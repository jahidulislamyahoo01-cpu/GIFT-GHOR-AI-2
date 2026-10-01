import axios from 'axios';

export interface TelegramMessageUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number | string;
      title?: string;
      type: string;
    };
    date: number;
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
      caption?: string;
    };
  };
}

let isPolling = false;
let pollingAbortController: AbortController | null = null;
let lastUpdateId = 0;
const processedUpdateIds = new Set<number>();
const processedMessageKeys = new Set<string>();

/**
 * Helper to escape HTML characters for Telegram
 */
function escapeTelegramHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Extracts a session ID from a Telegram message text
 */
export function extractSessionIdFromText(text?: string): string | null {
  if (!text) return null;

  // 1. Look for explicit Session ID labels
  const sessionMatch = text.match(/(?:Session(?:\s*ID)?|সেশন(?:\s*আইডি)?)\s*[:=]\s*`?([a-zA-Z0-9_\-]+)`?/i);
  if (sessionMatch && sessionMatch[1]) {
    return sessionMatch[1].trim();
  }

  // 2. Look for ghor-xxx-yyy pattern
  const ghorMatch = text.match(/\b(ghor-[a-zA-Z0-9_\-]+)\b/i);
  if (ghorMatch && ghorMatch[1]) {
    return ghorMatch[1].trim();
  }

  // 3. Look for test-session or generic session pattern
  const genMatch = text.match(/\b([a-zA-Z0-9_\-]*session[a-zA-Z0-9_\-]*)\b/i);
  if (genMatch && genMatch[1]) {
    return genMatch[1].trim();
  }

  return null;
}

/**
 * Send a reply back to a specific Telegram chat
 */
async function sendTelegramReply(
  botToken: string,
  chatId: number | string,
  text: string,
  replyToMessageId?: number
) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
      },
      { timeout: 10000 }
    );
  } catch (err: any) {
    console.warn('[TelegramBotService] Failed to send Telegram reply:', err.response?.data || err.message);
  }
}

/**
 * Start background long-polling for incoming Telegram messages / replies
 */
export function startTelegramBotPolling(
  getDB: () => any,
  saveDB: (db: any) => void,
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>,
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
) {
  if (isPolling) {
    console.log('[TelegramBotService] Polling is already running.');
    return;
  }

  const db = getDB();
  const botToken = db.adminSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.log('[TelegramBotService] No Telegram Bot Token configured. Polling skipped.');
    return;
  }

  isPolling = true;
  pollingAbortController = new AbortController();

  console.log('[TelegramBotService] Initializing 2-way Telegram Live Customer Support listener...');

  // Step 1: Drop stale pending updates so past messages are not reprocessed upon startup
  axios
    .get(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`, {
      timeout: 10000,
    })
    .then((res) => {
      console.log('[TelegramBotService] Stale webhook cleared with drop_pending_updates=true:', res.data?.description || 'OK');
      runPollLoop(getDB, saveDB, onAdminReply, callAI);
    })
    .catch((err) => {
      console.warn('[TelegramBotService] Error clearing webhook, will attempt poll anyway:', err.message);
      runPollLoop(getDB, saveDB, onAdminReply, callAI);
    });
}

/**
 * Stop active polling
 */
export function stopTelegramBotPolling() {
  isPolling = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
  console.log('[TelegramBotService] Polling stopped.');
}

/**
 * Restart polling with updated credentials
 */
export function restartTelegramBotPolling(
  getDB: () => any,
  saveDB: (db: any) => void,
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>,
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
) {
  stopTelegramBotPolling();
  setTimeout(() => {
    startTelegramBotPolling(getDB, saveDB, onAdminReply, callAI);
  }, 1000);
}

/**
 * Continuous polling loop for Live Customer Support message routing only
 */
async function runPollLoop(
  getDB: () => any,
  saveDB: (db: any) => void,
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>,
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
) {
  while (isPolling) {
    const db = getDB();
    const botToken = db.adminSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.log('[TelegramBotService] Bot token removed. Stopping poll loop.');
      isPolling = false;
      break;
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
      const response = await axios.get(url, {
        params: {
          offset: lastUpdateId > 0 ? lastUpdateId + 1 : undefined,
          timeout: 20, // long poll for 20 seconds
          allowed_updates: JSON.stringify(['message']),
        },
        timeout: 30000,
        signal: pollingAbortController?.signal,
      });

      const updates: TelegramMessageUpdate[] = response.data?.result || [];

      for (const update of updates) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);

        // Deduplication: Never process the same update_id twice
        if (processedUpdateIds.has(update.update_id)) {
          continue;
        }
        processedUpdateIds.add(update.update_id);
        if (processedUpdateIds.size > 5000) {
          const firstKey = processedUpdateIds.values().next().value;
          if (firstKey !== undefined) processedUpdateIds.delete(firstKey);
        }

        const msg = update.message;
        if (!msg || !msg.text) continue;

        // Message-level deduplication: check chat_id + message_id
        const messageKey = `${msg.chat.id}_${msg.message_id}`;
        if (processedMessageKeys.has(messageKey)) {
          continue;
        }
        processedMessageKeys.add(messageKey);
        if (processedMessageKeys.size > 5000) {
          const firstKey = processedMessageKeys.values().next().value;
          if (firstKey !== undefined) processedMessageKeys.delete(firstKey);
        }

        // Stale message filter: Ignore messages older than 180 seconds (3 minutes) to avoid processing historical backlogs
        const msgAgeSeconds = Math.floor(Date.now() / 1000) - (msg.date || 0);
        if (msgAgeSeconds > 180) {
          console.log(`[TelegramBotService] Skipping stale message ${messageKey} from ${msgAgeSeconds}s ago.`);
          continue;
        }

        const rawText = msg.text.trim();
        const chatId = msg.chat.id;
        const senderName =
          [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
          msg.from?.username ||
          'Team Member';

        // Check 1: Command /start or /help
        if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
          const helpMsg =
            `👋 <b>Gift Ghor Live Customer Support Bot</b>\n\n` +
            `🔔 <b>গ্রাহকদের সাথে লাইভ চ্যাট রিপ্লাই করার নিয়ম:</b>\n\n` +
            `1️⃣ <b>সরাসরি রিপ্লাই:</b> ওয়েবসাইটে কোনো কাস্টমার মেসেজ দিলে যে অ্যালার্ট মেসেজ আসবে, সেই মেসেজটিতে Telegram-এ সরাসরি <b>Reply (Quote Reply)</b> করে আপনার বার্তা লিখুন।\n` +
            `2️⃣ <b>কমান্ড দিয়ে রিপ্লাই:</b> অথবা যেকোনো মেসেজে লিখুন: <code>/reply &lt;SessionID&gt; আপনার বার্তা</code> (যেমন: <code>/reply ghor-123 ধন্যবাদ, আপনার অর্ডার কনফার্ম হয়েছে।</code>)\n` +
            `3️⃣ <b>অটো-রাউটিং:</b> সাম্প্রতিক সক্রিয় কাস্টমার চ্যাটে সরাসরি বার্তা পাঠাতে পারেন।\n\n` +
            `✨ <i>আপনার পাঠানো রিপ্লাই তাৎক্ষণিকভাবে ওয়েবসাইটের কাস্টমার চ্যাট উইজেটে প্রদর্শিত হবে!</i>`;

          await sendTelegramReply(botToken, chatId, helpMsg, msg.message_id);
          continue;
        }

        // Check 2: Direct /reply or /r command for customer chat
        const replyCmdMatch = rawText.match(/^\/(?:reply|r)\s+([a-zA-Z0-9_\-]+)\s+([\s\S]+)$/i);
        if (replyCmdMatch) {
          const targetSessionId = replyCmdMatch[1].trim();
          const replyContent = replyCmdMatch[2].trim();

          const result = await onAdminReply(targetSessionId, replyContent, senderName);

          if (result.success) {
            const confirmMsg =
              `✅ <b>গ্রাহককে উত্তর সফলভাবে পাঠানো হয়েছে!</b>\n\n` +
              `👤 <b>গ্রাহক:</b> ${escapeTelegramHtml(result.customerName || 'Website Visitor')}\n` +
              `🆔 <b>Session:</b> <code>${escapeTelegramHtml(targetSessionId)}</code>\n` +
              `💬 <b>বার্তা:</b> "${escapeTelegramHtml(replyContent)}"\n\n` +
              `🟢 <i>চ্যাট উইজেটে সরাসরি ডেলিভারি করা হয়েছে।</i>`;
            await sendTelegramReply(botToken, chatId, confirmMsg, msg.message_id);
          } else {
            const errMsg =
              `⚠️ <b>উত্তর পাঠানো যায়নি:</b> ${escapeTelegramHtml(result.error || 'সেশনটি পাওয়া যায়নি বা মেয়াদোত্তীর্ণ।')}\n\n` +
              `অনুগ্রহ করে সঠিক Session ID দিন।`;
            await sendTelegramReply(botToken, chatId, errMsg, msg.message_id);
          }
          continue;
        }

        // Check 3: Reply to a previous bot alert message in Support Group
        if (msg.reply_to_message) {
          const quotedText = msg.reply_to_message.text || msg.reply_to_message.caption || '';
          const detectedSessionId = extractSessionIdFromText(quotedText);

          if (detectedSessionId) {
            const replyContent = rawText;
            const result = await onAdminReply(detectedSessionId, replyContent, senderName);

            if (result.success) {
              const confirmMsg =
                `✅ <b>গ্রাহককে উত্তর পাঠানো হয়েছে!</b>\n\n` +
                `👤 <b>গ্রাহক:</b> ${escapeTelegramHtml(result.customerName || 'Website Visitor')}\n` +
                `🆔 <b>Session:</b> <code>${escapeTelegramHtml(detectedSessionId)}</code>\n` +
                `💬 <b>বার্তা:</b> "${escapeTelegramHtml(replyContent)}"\n\n` +
                `🟢 <i>চ্যাট উইজেটে সরাসরি ডেলিভারি করা হয়েছে।</i>`;
              await sendTelegramReply(botToken, chatId, confirmMsg, msg.message_id);
            } else {
              const errMsg =
                `⚠️ <b>উত্তর পাঠানো যায়নি:</b> ${escapeTelegramHtml(result.error || 'সেশন পাওয়া যায়নি।')}\n` +
                `Session ID: <code>${escapeTelegramHtml(detectedSessionId)}</code>`;
              await sendTelegramReply(botToken, chatId, errMsg, msg.message_id);
            }
            continue;
          }
        }

        // Check 4: Smart Auto-Routing for unquoted direct messages
        try {
          const currentDb = getDB();
          const allSessions = Object.values(currentDb.sessions || {}) as any[];

          // Sort by lastActivity descending
          allSessions.sort(
            (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
          );

          const activeSession = allSessions.find(
            (s) => s.requestedHuman || s.needsAttention || s.mode === 'admin_takeover'
          );

          if (activeSession) {
            const result = await onAdminReply(activeSession.id, rawText, senderName);
            if (result.success) {
              const confirmMsg =
                `✅ <b>গ্রাহককে উত্তর পাঠানো হয়েছে! (Auto-routed)</b>\n\n` +
                `👤 <b>গ্রাহক:</b> ${escapeTelegramHtml(
                  result.customerName || activeSession.customerName || 'Website Visitor'
                )}\n` +
                `🆔 <b>Session:</b> <code>${escapeTelegramHtml(activeSession.id)}</code>\n` +
                `💬 <b>বার্তা:</b> "${escapeTelegramHtml(rawText)}"\n\n` +
                `🟢 <i>লাইভ চ্যাট উইজেটে সরাসরি ডেলিভারি করা হয়েছে।</i>`;
              await sendTelegramReply(botToken, chatId, confirmMsg, msg.message_id);
              continue;
            }
          }
        } catch (routeErr) {
          console.warn('[TelegramBotService] Auto-routing error:', routeErr);
        }
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Normal abort on server reload
        break;
      }
      console.warn('[TelegramBotService] Polling warning:', err.response?.data?.description || err.message);
      // Wait 3 seconds before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
