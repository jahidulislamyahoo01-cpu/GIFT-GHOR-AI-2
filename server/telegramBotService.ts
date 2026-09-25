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
 * Extracts a session ID from a Telegram message text (e.g. from a reply to a notification)
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
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>
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

  console.log('[TelegramBotService] Initializing 2-way Telegram customer reply listener...');

  // Step 1: Delete any stale webhook so getUpdates works reliably
  axios
    .get(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`, {
      timeout: 10000,
    })
    .then((res) => {
      console.log('[TelegramBotService] Stale webhook cleared:', res.data?.description || 'OK');
      runPollLoop(getDB, onAdminReply);
    })
    .catch((err) => {
      console.warn('[TelegramBotService] Error clearing webhook, will attempt poll anyway:', err.message);
      runPollLoop(getDB, onAdminReply);
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
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>
) {
  stopTelegramBotPolling();
  setTimeout(() => {
    startTelegramBotPolling(getDB, onAdminReply);
  }, 1000);
}

/**
 * Continuous polling loop
 */
async function runPollLoop(
  getDB: () => any,
  onAdminReply: (
    sessionId: string,
    replyText: string,
    senderName?: string
  ) => Promise<{ success: boolean; customerName?: string; error?: string }>
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

        const msg = update.message;
        if (!msg || !msg.text) continue;

        const rawText = msg.text.trim();
        const chatId = msg.chat.id;
        const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.from?.username || 'Admin';

        // Check 1: Command /start or /help
        if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
          const helpMsg =
            `👋 <b>Gift Ghor Store Assistant Bot</b>\n\n` +
            `কাস্টমার ওয়েবসাইটে কোনো মেসেজ পাঠালে বা অর্ডার করলে এই চ্যাটে নোটিফিকেশন আসে।\n\n` +
            `📲 <b>টেলিগ্রাম থেকেই কাস্টমারকে উত্তর দেওয়ার উপায়:</b>\n\n` +
            `১. <b>সরাসরি Reply:</b> নোটিফিকেশন মেসেজটিতে Swipe করে <b>Reply</b> অপশন সিলেক্ট করে আপনার উত্তর লিখুন।\n\n` +
            `২. <b>কমান্ডের মাধ্যমে:</b> লিখুন:\n` +
            `<code>/reply &lt;SessionID&gt; আপনার উত্তর</code>\n` +
            `<i>(যেমন: <code>/reply ghor-abc-1234 হ্যাঁ আপু, এটি স্টকে আছে!</code>)</i>\n\n` +
            `✅ আপনার পাঠানো মেসেজ সাথে সাথে গ্রাহকের ওয়েবসাইটের চ্যাট উইজেটে Admin Specialist হিসেবে পৌঁছে যাবে!`;

          await sendTelegramReply(botToken, chatId, helpMsg, msg.message_id);
          continue;
        }

        // Check 2: Direct /reply or /r command
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
              `🟢 <i>চ্যাট উইজেটে Admin Mode এখন সক্রিয়।</i>`;
            await sendTelegramReply(botToken, chatId, confirmMsg, msg.message_id);
          } else {
            const errMsg =
              `⚠️ <b>উত্তর পাঠানো যায়নি:</b> ${escapeTelegramHtml(result.error || 'সেশনটি পাওয়া যায়নি বা মেয়াদোত্তীর্ণ।')}\n\n` +
              `অনুগ্রহ করে সঠিক Session ID দিন।`;
            await sendTelegramReply(botToken, chatId, errMsg, msg.message_id);
          }
          continue;
        }

        // Check 3: Reply to a previous bot message
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
                `🟢 <i>চ্যাট উইজেটে সরাসরি প্রদর্শিত হচ্ছে।</i>`;
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
        // If message is not a command and not a reply to a specific post, find the most recent active session that requested a human or needs attention
        try {
          const currentDb = getDB();
          const allSessions = Object.values(currentDb.sessions || {}) as any[];
          
          // Sort by lastActivity descending
          allSessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
          
          // Find the most recent active session that needs attention, requested human, or is in admin_takeover
          const activeSession = allSessions.find(
            (s) => s.requestedHuman || s.needsAttention || s.mode === 'admin_takeover'
          );

          if (activeSession) {
            const result = await onAdminReply(activeSession.id, rawText, senderName);
            if (result.success) {
              const confirmMsg =
                `✅ <b>গ্রাহককে উত্তর পাঠানো হয়েছে! (Auto-routed)</b>\n\n` +
                `👤 <b>গ্রাহক:</b> ${escapeTelegramHtml(result.customerName || activeSession.customerName || 'Website Visitor')}\n` +
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
