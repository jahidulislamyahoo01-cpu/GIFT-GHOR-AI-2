import baileysModule, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Helper function to safely get the makeWASocket factory function regardless of CJS/ESM bundling
function getMakeWASocket(): any {
  if (typeof baileysModule === 'function') {
    return baileysModule;
  }
  if (baileysModule && typeof (baileysModule as any).default === 'function') {
    return (baileysModule as any).default;
  }
  if (baileysModule && typeof (baileysModule as any).makeWASocket === 'function') {
    return (baileysModule as any).makeWASocket;
  }
  try {
    const req = require('@whiskeysockets/baileys');
    return req.default || req.makeWASocket || req;
  } catch (e) {
    return baileysModule;
  }
}

const AUTH_FOLDER = path.join(process.cwd(), 'whatsapp_auth_info');

let waSock: WASocket | null = null;
let currentPairingCode: string | null = null;
let currentQrData: string | null = null;
let initPromise: Promise<WASocket | null> | null = null;

// Callbacks provided by server.ts
let getSystemDb: () => any = () => ({});
let saveSystemDb: (db: any) => void = () => {};
let callGeminiFn: (contents: any[], prompt: string, maxTokens?: number) => Promise<string | null> = async () => null;
let getSystemKnowledgeFn: (db: any) => string = () => '';

const logger = pino({ level: 'silent' });

export function setupWhatsAppService(
  getDb: () => any,
  saveDb: (db: any) => void,
  callGemini: (contents: any[], prompt: string, maxTokens?: number) => Promise<string | null>,
  getKnowledge: (db: any) => string
) {
  getSystemDb = getDb;
  saveSystemDb = saveDb;
  callGeminiFn = callGemini;
  getSystemKnowledgeFn = getKnowledge;
}

export async function initWhatsAppSocket(forceResetAuth = false): Promise<WASocket | null> {
  if (!forceResetAuth && waSock && waSock.user) {
    return waSock;
  }

  if (initPromise && !forceResetAuth) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (forceResetAuth && waSock) {
        try { waSock.end(undefined); } catch (e) {}
        waSock = null;
      }

      if (forceResetAuth) {
        try {
          if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
        } catch (e) {}
      }

      if (!fs.existsSync(AUTH_FOLDER)) {
        fs.mkdirSync(AUTH_FOLDER, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

      let version: [number, number, number] = [2, 3000, 1043857760];
      try {
        const fetched = await fetchLatestBaileysVersion();
        if (fetched && fetched.version) {
          version = fetched.version;
        }
      } catch (vErr) {
        console.warn('[WhatsApp Baileys] Version fetch fallback used');
      }

      const createSocket = getMakeWASocket();
      const sock = createSocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        retryRequestDelayMs: 250,
      });

      waSock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          currentQrData = qr;
          const db = getSystemDb();
          if (db && db.whatsappState) {
            db.whatsappState.qrCodeData = qr;
            db.whatsappState.sessionStatus = 'connecting';
            saveSystemDb(db);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          console.log(`[WhatsApp Baileys] Connection closed. Reason code: ${statusCode}. Logged Out: ${isLoggedOut}`);

          const db = getSystemDb();
          if (db && db.whatsappState) {
            if (isLoggedOut) {
              db.whatsappState.connected = false;
              db.whatsappState.sessionStatus = 'disconnected';
              db.whatsappState.pairingCode = undefined;
              db.whatsappState.qrCodeData = undefined;
              try {
                fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
              } catch (e) {}
            } else {
              // During pairing / restart, keep status as connecting
              db.whatsappState.sessionStatus = 'connecting';
            }
            saveSystemDb(db);
          }

          if (waSock === sock) {
            waSock = null;
          }

          if (!isLoggedOut) {
            setTimeout(() => {
              initWhatsAppSocket().catch((e) => console.error('[WhatsApp Reconnect Error]', e));
            }, 2000);
          }
        } else if (connection === 'open') {
          console.log('[WhatsApp Baileys] 🎉 Connection successfully OPENED & Device Linked to Meta servers!');
          currentPairingCode = null;
          currentQrData = null;

          const db = getSystemDb();
          if (db && db.whatsappState) {
            db.whatsappState.connected = true;
            db.whatsappState.sessionStatus = 'connected';
            db.whatsappState.connectedAt = new Date().toISOString();
            db.whatsappState.lastSyncedAt = new Date().toISOString();
            if (sock?.user?.id) {
              const num = sock.user.id.split(':')[0] || sock.user.id.split('@')[0];
              db.whatsappState.whatsappNumber = '+' + num;
            }
            db.whatsappState.pairingCode = undefined;
            db.whatsappState.qrCodeData = undefined;
            saveSystemDb(db);
          }
        }
      });

      // Handle Incoming Messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const senderJid = msg.key.remoteJid;
          if (!senderJid || senderJid.endsWith('@g.us')) continue; // Skip group chats

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

          if (!text || text.trim().length === 0) continue;

          const db = getSystemDb();
          if (!db.whatsappState?.autoReplyEnabled) continue;

          const pushName = msg.pushName || 'WhatsApp Contact';
          const cleanNumber = '+' + senderJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');

          console.log(`[WhatsApp Incoming] From ${pushName} (${cleanNumber}): "${text}"`);

          // Generate AI response
          const knowledgePrompt =
            `You are the official WhatsApp AI Assistant for 'Gift Ghor' (website: giftghor.world). Answer the customer's question politely, completely, and accurately in Bengali (বাংলা) or English.

CRITICAL RESPONSE RULES:
- ALWAYS complete all sentences fully. NEVER stop or cut off mid-sentence.
- Provide a helpful, clear response in 2-4 complete sentences.
- Use WhatsApp formatting like *bold* for key product names, prices, and delivery charges.
- End your response with a friendly closing (e.g. "Gift Ghor-এর সাথে থাকার জন্য ধন্যবাদ! ❤️").\n\n` +
            getSystemKnowledgeFn(db);
          const contents = [{ role: 'user', parts: [{ text }] }];

          let aiReply = await callGeminiFn(contents, knowledgePrompt, 1200);
          if (!aiReply) {
            aiReply =
              'আসসালামু আলাইকুম! গিফট ঘর-এ আপনাকে স্বাগতম। ❤️\nআমরা আপনার মেসেজটি পেয়েছি। আমাদের প্রতিনিধি শীঘ্রই আপনার প্রশ্নের উত্তর দেবেন।\nজরুরি প্রয়োজনে কল করুন: ' +
              (db.adminSettings?.whatsappNumber || '01522126525');
          }

          const delayMs = (db.whatsappState?.replyDelaySeconds || 2) * 1000;
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          if (waSock) {
            await waSock.sendMessage(senderJid, { text: aiReply });
            console.log(`[WhatsApp Auto-Replied] To ${cleanNumber}: "${aiReply}"`);
          }

          const logEntry = {
            id: 'walog-' + Date.now(),
            fromNumber: cleanNumber,
            contactName: pushName,
            messageText: text,
            replyText: aiReply,
            timestamp: new Date().toISOString(),
            status: 'auto_replied' as const,
          };

          if (!db.whatsappLogs) db.whatsappLogs = [];
          db.whatsappLogs.unshift(logEntry);
          saveSystemDb(db);
        }
      });

      return sock;
    } catch (err) {
      console.error('[WhatsApp Baileys Init Error]', err);
      waSock = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// Request real 8-character pairing code from Meta WhatsApp servers
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<{
  success: boolean;
  pairingCode?: string;
  whatsappNumber?: string;
  error?: string;
}> {
  let cleanPhone = phoneNumber.trim().replace(/[\s\-\(\)\+]/g, '');
  if (cleanPhone.startsWith('88001')) {
    cleanPhone = '8801' + cleanPhone.substring(5);
  } else if (cleanPhone.startsWith('01')) {
    cleanPhone = '880' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('880') && cleanPhone.length === 10) {
    cleanPhone = '880' + cleanPhone;
  }

  try {
    // Force reset auth to guarantee a clean new pairing session without stale tokens
    let sock = await initWhatsAppSocket(true);

    if (!sock) {
      return {
        success: false,
        error: 'WhatsApp কানেকশন সকেট চালু করা সম্ভব হয়নি। অনুগ্রহ করে পেজ রিফ্রেশ করে আবার চেষ্টা করুন।',
      };
    }

    // Wait for WS connection to open or up to 3.5s
    await new Promise((res) => setTimeout(res, 3500));

    console.log(`[WhatsApp Baileys] Requesting official Meta pairing code for phone: +${cleanPhone}...`);

    let rawCode: string | null = null;
    let lastErr: any = null;

    // Retry up to 3 times if WS connection handshake was still in progress
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        rawCode = await sock.requestPairingCode(cleanPhone);
        if (rawCode) break;
      } catch (e: any) {
        lastErr = e;
        console.warn(`[WhatsApp Pairing Code] Attempt ${attempt} failed:`, e?.message || e);
        await new Promise((res) => setTimeout(res, 1500));
      }
    }

    if (!rawCode) {
      throw lastErr || new Error('Meta WhatsApp server failed to issue pairing code.');
    }

    // Format pairing code e.g. "ABCD-EFGH"
    let formattedCode = rawCode;
    if (rawCode && rawCode.length === 8 && !rawCode.includes('-')) {
      formattedCode = `${rawCode.substring(0, 4)}-${rawCode.substring(4)}`;
    }

    currentPairingCode = formattedCode;
    console.log(`[WhatsApp Baileys] Received REAL Meta Pairing Code: ${formattedCode}`);

    const db = getSystemDb();
    if (db && db.whatsappState) {
      db.whatsappState.pairingCode = formattedCode;
      db.whatsappState.whatsappNumber = '+' + cleanPhone;
      db.whatsappState.sessionStatus = 'pairing_ready';
      db.whatsappState.connectionMethod = 'pairing_code';
      saveSystemDb(db);
    }

    return {
      success: true,
      pairingCode: formattedCode,
      whatsappNumber: '+' + cleanPhone,
    };
  } catch (err: any) {
    console.error('[WhatsApp Request Pairing Code Error]', err);
    return {
      success: false,
      error: err?.message || 'মেটা হোয়াটসঅ্যাপ সার্ভার থেকে পেয়ারিং কোড তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    };
  }
}

// Disconnect and wipe credentials
export async function disconnectWhatsAppSocket(): Promise<boolean> {
  try {
    if (waSock) {
      try {
        await waSock.logout();
      } catch (e) {}
      try {
        waSock.end(undefined);
      } catch (e) {}
      waSock = null;
    }

    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      }
    } catch (e) {}

    const db = getSystemDb();
    if (db && db.whatsappState) {
      db.whatsappState.connected = false;
      db.whatsappState.sessionStatus = 'disconnected';
      db.whatsappState.pairingCode = undefined;
      db.whatsappState.qrCodeData = undefined;
      saveSystemDb(db);
    }

    return true;
  } catch (err) {
    console.error('[WhatsApp Disconnect Error]', err);
    return false;
  }
}

// Send manual text message from Admin panel to a WhatsApp contact
export async function sendWhatsAppMessageDirect(toJidOrPhone: string, text: string): Promise<boolean> {
  try {
    if (!waSock) {
      await initWhatsAppSocket();
    }
    if (!waSock) return false;

    let targetJid = toJidOrPhone;
    if (!targetJid.includes('@s.whatsapp.net')) {
      const clean = toJidOrPhone.replace(/[^0-9]/g, '');
      targetJid = `${clean}@s.whatsapp.net`;
    }

    await waSock.sendMessage(targetJid, { text });
    return true;
  } catch (err) {
    console.error('[WhatsApp Send Message Error]', err);
    return false;
  }
}
