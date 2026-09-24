import nodemailer from 'nodemailer';
import axios from 'axios';
import { saveNotificationToFirestore } from './firebaseService.js';

export const NOTIFICATION_RECIPIENTS = [
  'giftghor6525@gmail.com',
  'jahidulislammozumder@outlook.com',
];

export interface EmailConfig {
  gmailUser?: string;
  gmailAppPassword?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  whatsappNumber?: string;
}

export type NotificationConfig = EmailConfig;

/**
 * Helper to escape HTML characters for Telegram parse_mode: 'HTML'
 */
function escapeTelegramHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface TelegramDeliveryResult {
  success: boolean;
  deliveredChatIds: string[];
  autoCorrectedChatIds: Record<string, string>; // original -> corrected (e.g. 5487582348 -> -5487582348)
  errors: string[];
  rawErrors?: any[];
}

/**
 * Auto-detect recent chats and groups from Telegram bot updates
 */
export async function detectTelegramChats(botToken: string) {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, { timeout: 8000 });
    const updates = res.data?.result || [];
    const chatsMap = new Map<string, { id: string; title: string; type: 'group' | 'supergroup' | 'channel' | 'private'; isBotAdmin?: boolean; date?: number }>();

    for (const u of updates) {
      // Check message chats
      const chat = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat;
      if (chat && chat.id) {
        const idStr = String(chat.id);
        const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'Unnamed Chat';
        const type = chat.type || 'group';
        const isBotAdmin = u.my_chat_member?.new_chat_member?.status === 'administrator';

        chatsMap.set(idStr, {
          id: idStr,
          title,
          type,
          isBotAdmin,
          date: u.message?.date || u.my_chat_member?.date,
        });
      }
    }

    return Array.from(chatsMap.values());
  } catch (err: any) {
    console.error('[detectTelegramChats] Error fetching updates:', err.response?.data || err.message);
    return [];
  }
}

/**
 * Send an instant Telegram notification with detailed error diagnostics and smart auto-correction
 */
export async function sendTelegramNotificationDetailed(text: string, config?: NotificationConfig): Promise<TelegramDeliveryResult> {
  const token = config?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = config?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  const result: TelegramDeliveryResult = {
    success: false,
    deliveredChatIds: [],
    autoCorrectedChatIds: {},
    errors: [],
    rawErrors: [],
  };

  if (!token || !rawChatId) {
    const msg = `Missing credentials. Bot Token present: ${!!token}, Chat ID present: ${!!rawChatId}`;
    console.warn('[Telegram Alert]', msg);
    result.errors.push(msg);
    return result;
  }

  // Support multiple chat IDs separated by comma, space, semicolon, or newline
  const chatIds = String(rawChatId)
    .split(/[\s,;\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (chatIds.length === 0) {
    result.errors.push(`No valid chat IDs found in config: "${rawChatId}"`);
    return result;
  }

  const sendSingle = async (targetId: string, msgText: string, parseMode: 'HTML' | undefined) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: targetId,
      text: msgText,
      disable_web_page_preview: true,
    };
    if (parseMode) payload.parse_mode = parseMode;
    return await axios.post(url, payload, { timeout: 8000 });
  };

  for (const originalChatId of chatIds) {
    let currentId = originalChatId;
    let delivered = false;

    // 1. Try sending with HTML formatting to provided ID
    try {
      await sendSingle(currentId, text, 'HTML');
      result.deliveredChatIds.push(currentId);
      delivered = true;
      console.log(`[Telegram Alert] Delivered successfully to chatId ${currentId}`);
    } catch (err: any) {
      const errData = err.response?.data || {};
      const desc = errData.description || err.message || '';
      console.warn(`[Telegram Alert] Initial send failed for ${currentId}: ${desc}`);

      // Case A: Group was migrated to Supergroup
      const migrateTo = errData.parameters?.migrate_to_chat_id;
      if (migrateTo) {
        try {
          const migStr = String(migrateTo);
          await sendSingle(migStr, text, 'HTML');
          result.deliveredChatIds.push(migStr);
          result.autoCorrectedChatIds[originalChatId] = migStr;
          delivered = true;
          console.log(`[Telegram Alert] Delivered to migrated Supergroup ID ${migStr}`);
        } catch (migErr: any) {
          console.error(`[Telegram Alert] Migrated send also failed:`, migErr.message);
        }
      }

      // Case B: Chat not found and missing minus sign (-) for group
      if (!delivered && (desc.includes('chat not found') || desc.includes('chat_id is empty'))) {
        // Many users forget the minus sign '-' for groups (e.g. they enter '5487582348' instead of '-5487582348')
        if (!currentId.startsWith('-')) {
          const altGroupWithMinus = `-${currentId}`;
          try {
            console.log(`[Telegram Alert] Trying auto-fix with minus prefix: ${altGroupWithMinus}`);
            await sendSingle(altGroupWithMinus, text, 'HTML');
            result.deliveredChatIds.push(altGroupWithMinus);
            result.autoCorrectedChatIds[originalChatId] = altGroupWithMinus;
            delivered = true;
            console.log(`[Telegram Alert] Delivered successfully using auto-corrected ID: ${altGroupWithMinus}`);
          } catch (altErr: any) {
            console.warn(`[Telegram Alert] Auto-fix with minus failed: ${altErr.message}`);
          }
        } else if (currentId.startsWith('-100')) {
          // If -100 prefix was prematurely added to normal group
          const altBasicGroup = `-${currentId.replace(/^-100/, '')}`;
          try {
            console.log(`[Telegram Alert] Trying auto-fix removing -100: ${altBasicGroup}`);
            await sendSingle(altBasicGroup, text, 'HTML');
            result.deliveredChatIds.push(altBasicGroup);
            result.autoCorrectedChatIds[originalChatId] = altBasicGroup;
            delivered = true;
            console.log(`[Telegram Alert] Delivered successfully using auto-corrected basic group ID: ${altBasicGroup}`);
          } catch (altErr2: any) {
            console.warn(`[Telegram Alert] Auto-fix without -100 failed: ${altErr2.message}`);
          }
        }
      }

      // Case C: HTML parse error fallback to plain text
      if (!delivered && (desc.includes('can\'t parse entities') || desc.includes('unsupported start tag'))) {
        try {
          const plainText = text.replace(/<[^>]+>/g, '');
          await sendSingle(currentId, plainText, undefined);
          result.deliveredChatIds.push(currentId);
          delivered = true;
          console.log(`[Telegram Alert] Delivered fallback plain text to chatId ${currentId}`);
        } catch (plainErr: any) {
          console.error(`[Telegram Alert] Plain text fallback failed:`, plainErr.message);
        }
      }

      if (!delivered) {
        result.rawErrors?.push(errData);
        // Translate error into human-friendly explanation
        if (desc.includes('chat not found')) {
          result.errors.push(`Chat not found for "${originalChatId}". যদি এটি টেলিগ্রাম গ্রুপ হয়, তবে আইডির শুরুতে মাইনাস (-) চিহ্ন দিতে হবে (যেমন: -5487582348)।`);
        } else if (desc.includes('bot is not a member') || desc.includes('bot was kicked')) {
          result.errors.push(`বট এই গ্রুপে নেই বা কিক করা হয়েছে। অনুগ্রহ করে বটকে গ্রুপে অ্যাড করে আবার চেষ্টা করুন।`);
        } else if (desc.includes('bot was blocked by the user')) {
          result.errors.push(`টেলিগ্রামে বটকে ব্লক করা রয়েছে। টেলিগ্রামে বটটি ওপেন করে /start চাপুন।`);
        } else if (desc.includes('Unauthorized')) {
          result.errors.push(`Invalid Telegram Bot Token. @BotFather থেকে সঠিক টোকেন নিশ্চিত করুন।`);
        } else {
          result.errors.push(`Telegram Error for ${originalChatId}: ${desc || err.message}`);
        }
      }
    }
  }

  result.success = result.deliveredChatIds.length > 0;
  return result;
}

/**
 * Send an instant Telegram notification to admin's mobile phone or multiple team members / group
 */
export async function sendTelegramNotification(text: string, config?: NotificationConfig): Promise<boolean> {
  const result = await sendTelegramNotificationDetailed(text, config);
  return result.success;
}

/**
 * Get or create Nodemailer transporter
 */
function getTransporter(config?: EmailConfig) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  // Use passed config from DB, or fallback to environment variables
  const finalGmailUser = (config?.gmailUser || process.env.GMAIL_USER || '').trim();
  const rawPass = config?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '';
  // Clean password: strip all spaces/whitespace (Google 16-character App Passwords are generated in 4-letter groups separated by spaces)
  const finalGmailPass = rawPass.trim().replace(/\s+/g, '');

  // If GMAIL_APP_PASSWORD and GMAIL_USER exist
  if (finalGmailUser && finalGmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: finalGmailUser,
        pass: finalGmailPass,
      },
    });
  }

  return null;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  recipients: string[];
  diagnostic?: string;
  error?: string;
}

/**
 * Diagnostic test for Gmail SMTP credentials
 */
export async function testEmailNotification(config?: EmailConfig): Promise<EmailTestResult> {
  const finalGmailUser = (config?.gmailUser || process.env.GMAIL_USER || '').trim();
  const rawPass = config?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '';
  const finalGmailPass = rawPass.trim().replace(/\s+/g, '');

  if (!finalGmailUser || !finalGmailPass) {
    return {
      success: false,
      message: 'Gmail User বা App Password দেওয়া হয়নি।',
      recipients: [],
      error: 'Missing Gmail credentials',
      diagnostic: 'Integrations ট্যাবে আপনার Gmail address এবং 16-অক্ষরের Google App Password প্রদান করুন।',
    };
  }

  const targets = Array.from(new Set([
    ...NOTIFICATION_RECIPIENTS,
    finalGmailUser,
  ]));

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: finalGmailUser,
        pass: finalGmailPass,
      },
    });

    // 1. Verify credentials with Google SMTP
    await transporter.verify();

    // 2. Send actual diagnostic email
    const subject = '🔔 Gift Ghor: Gmail Notification Test (সফল সংযোগ)';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ECECEC; border-radius: 12px; background-color: #FFFFFF;">
        <div style="background-color: #262626; padding: 18px 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ECA548; margin: 0; font-size: 22px;">GIFT GHOR</h1>
          <p style="color: #ECECEC; margin: 4px 0 0 0; font-size: 13px;">Notification System Status: Online</p>
        </div>

        <div style="padding: 24px 8px;">
          <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #10B981; color: #047857; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 13px; margin-bottom: 16px;">
            ✅ Email System Verified Successfully
          </div>
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">অভিনন্দন! আপনার জিমেইল নোটিফিকেশন সফলভাবে কানেক্ট হয়েছে।</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            আপনার Gift Ghor অনলাইন স্টোরে কাস্টমার অর্ডার করলে বা চ্যাটে সাপোর্ট চাইলে ইনস্ট্যান্ট ইমেইল নোটিফিকেশন এই ঠিকানায় আসবে।
          </p>

          <div style="background-color: #F8F9FA; border-left: 4px solid #ECA548; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #374151;">
            <p style="margin: 0 0 6px 0;"><strong>Sender Gmail:</strong> ${finalGmailUser}</p>
            <p style="margin: 0 0 6px 0;"><strong>Recipients:</strong> ${targets.join(', ')}</p>
            <p style="margin: 0;"><strong>Sent Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST</p>
          </div>
        </div>

        <div style="background-color: #FDF7EE; padding: 12px; border-radius: 8px; text-align: center; font-size: 12px; color: #7C2D12;">
          Gift Ghor E-Commerce AI System • <a href="https://giftghor.world" style="color: #ECA548; font-weight: bold;">giftghor.world</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Gift Ghor System" <${finalGmailUser}>`,
      to: targets,
      subject,
      html: htmlContent,
    });

    console.log(`[testEmailNotification] Successfully sent test email to ${targets.join(', ')}`);

    return {
      success: true,
      message: `✅ Test email sent successfully to ${targets.join(', ')}!`,
      recipients: targets,
    };
  } catch (err: any) {
    const errMsg = String(err.message || err.response || '');
    console.error('[testEmailNotification] SMTP Error:', err);

    let diagnostic = '';
    if (err.code === 'EAUTH' || errMsg.includes('534') || errMsg.includes('InvalidSecondFactor') || errMsg.includes('Application-specific password required')) {
      diagnostic = 'Google সাধারণ ইমেইল পাসওয়ার্ড সরাসরি ব্যবহারের অনুমতি দেয় না। আপনার Google Account-এ 2-Step Verification অন করে "App Passwords" (https://myaccount.google.com/apppasswords) থেকে একটি ১৬ অক্ষরের অ্যাপ পাসওয়ার্ড তৈরি করে দিন।';
    } else if (err.code === 'EAUTH' || errMsg.includes('535') || errMsg.includes('Username and Password not accepted') || errMsg.includes('BadCredentials')) {
      diagnostic = 'জিমেইল ঠিকানা অথবা ১৬-অক্ষরের App Password মেলেনি। দয়া করে ১৬ অক্ষরের Google App Password নির্ভুলভাবে পেস্ট করুন।';
    } else {
      diagnostic = `ইমেইল সার্ভার কানেকশন ত্রুটি: ${err.message || 'SMTP Authentication Failed'}`;
    }

    return {
      success: false,
      message: err.message || 'Gmail authentication failed',
      recipients: targets,
      error: errMsg,
      diagnostic,
    };
  }
}

/**
 * Send New Order Captured Email
 */
export async function sendNewOrderEmail(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  quantity: number;
  codAmount: number;
  deliveryLocation: string;
  deliveryCharge: number;
  totalAmount: number;
  createdAt: string;
  notes?: string;
}, config?: EmailConfig) {
  const subject = `🛒 New Order Captured #${order.orderNumber} - Gift Ghor [${order.productName}]`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ECECEC; border-radius: 12px; background-color: #FFFFFF;">
      <div style="background-color: #262626; padding: 16px 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #ECA548; margin: 0; font-size: 22px;">GIFT GHOR</h1>
        <p style="color: #ECECEC; margin: 4px 0 0 0; font-size: 13px;">New Order Captured from AI Support Chat</p>
      </div>

      <div style="padding: 20px 0;">
        <div style="background-color: #FDF7EE; border: 1px solid #ECA548; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <span style="font-size: 18px; font-weight: bold; color: #262626;">Order #${order.orderNumber}</span>
          <span style="float: right; background-color: #ECA548; color: #FFFFFF; font-weight: bold; padding: 3px 10px; border-radius: 12px; font-size: 12px;">Cash on Delivery</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666; width: 140px;">Customer Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: bold; color: #262626;">${order.customerName || 'Customer'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Phone Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: bold; color: #0284C7;">
              <a href="tel:${order.customerPhone}" style="color: #0284C7; text-decoration: none;">${order.customerPhone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Delivery Address:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: 500; color: #262626;">${order.customerAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Product Details:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: bold; color: #262626;">${order.productName} (Qty: ${order.quantity})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Delivery Zone:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #262626;">
              ${order.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka (৳70)' : 'Outside Dhaka (৳130)'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Total COD Amount:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-size: 16px; font-weight: bold; color: #059669;">৳${order.totalAmount} BDT</td>
          </tr>
          ${order.notes ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Order Notes:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">${order.notes}</td>
          </tr>` : ''}
        </table>

        <p style="font-size: 12px; color: #888; margin-top: 15px;">
          Captured at: ${new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST
        </p>
      </div>

      <div style="background-color: #F8F9FA; padding: 12px; border-radius: 8px; text-align: center; font-size: 12px; color: #666;">
        Log into the <a href="https://giftghor.world" style="color: #ECA548; font-weight: bold;">Gift Ghor Admin Panel</a> to view and dispatch via Steadfast Courier.
      </div>
    </div>
  `;

  console.log(`[Email Notification] New order #${order.orderNumber} notification to: ${NOTIFICATION_RECIPIENTS.join(', ')}`);

  // Send instant Telegram notification to phone
  const cleanName = escapeTelegramHtml(order.customerName || 'Customer');
  const cleanPhone = escapeTelegramHtml(order.customerPhone || '');
  const cleanAddress = escapeTelegramHtml(order.customerAddress || 'N/A');
  const cleanProduct = escapeTelegramHtml(order.productName || 'Product');
  const tgOrderText = `🛍️ <b>NEW ORDER #${escapeTelegramHtml(order.orderNumber)}!</b>\n\n` +
    `👤 <b>Customer:</b> ${cleanName}\n` +
    `📞 <b>Phone:</b> ${cleanPhone}\n` +
    `📍 <b>Address:</b> ${cleanAddress}\n` +
    `📦 <b>Product:</b> ${cleanProduct} (Qty: ${order.quantity})\n` +
    `💵 <b>Total COD:</b> ৳${order.totalAmount} BDT\n\n` +
    `🚀 <i>Steadfast 1-Click Dispatch ready in Admin Dashboard!</i>`;
  sendTelegramNotification(tgOrderText, config).catch((e) => console.warn('[Order Telegram Alert] Failed:', e));

  let status = 'logged';
  const transporter = getTransporter(config);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Orders" <no-reply@giftghor.world>`,
        to: NOTIFICATION_RECIPIENTS,
        subject,
        html: htmlContent,
      });
      status = 'sent';
      console.log(`[Email Notification] Email sent successfully via SMTP!`);
    } catch (e) {
      console.error(`[Email Notification] SMTP send error:`, e);
      status = 'failed';
    }
  } else {
    console.log(`[Email Notification] No SMTP credentials configured. Order recorded in Firestore permanent notifications log.`);
  }

  // Save to Firestore notifications
  await saveNotificationToFirestore({
    id: `notif-order-${Date.now()}`,
    type: 'order',
    recipients: NOTIFICATION_RECIPIENTS,
    subject,
    details: order,
    sentAt: new Date().toISOString(),
    status,
  });

  return { success: true, status };
}

/**
 * Send Live Agent / Human Request Alert Email
 */
export async function sendLiveAgentAlertEmail(data: {
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  lastMessage: string;
  timestamp: string;
}, config?: EmailConfig) {
  const subject = `🚨 Customer Wants to Talk with Admin / Live Agent - Gift Ghor!`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ECECEC; border-radius: 12px; background-color: #FFFFFF;">
      <div style="background-color: #DC2626; padding: 16px 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 20px;">🚨 Live Support Request</h1>
        <p style="color: #FEE2E2; margin: 4px 0 0 0; font-size: 13px;">A customer requested to speak directly with an admin / human representative</p>
      </div>

      <div style="padding: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666; width: 140px;">Customer Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: bold; color: #262626;">${data.customerName || 'Online Guest'}</td>
          </tr>
          ${data.customerPhone ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Phone Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: bold; color: #0284C7;">
              <a href="tel:${data.customerPhone}" style="color: #0284C7;">${data.customerPhone}</a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Session ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-family: monospace; color: #666;">${data.sessionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; color: #666;">Last Customer Message:</td>
            <td style="padding: 8px; border-bottom: 1px solid #F0F0F0; font-weight: 600; color: #DC2626; background-color: #FEF2F2; border-radius: 4px;">"${data.lastMessage}"</td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #888; margin-top: 15px;">
          Requested at: ${new Date(data.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST
        </p>
      </div>

      <div style="background-color: #F8F9FA; padding: 12px; border-radius: 8px; text-align: center; font-size: 12px; color: #666;">
        Open the <strong>Admin Dashboard -> Conversations</strong> tab to take over the chat immediately.
      </div>
    </div>
  `;

  console.log(`[Email Notification] Live Agent request notification to: ${NOTIFICATION_RECIPIENTS.join(', ')}`);

  // Send instant Telegram notification to phone
  const cleanAgentCustomer = escapeTelegramHtml(data.customerName || 'Store Visitor');
  const cleanAgentPhone = escapeTelegramHtml(data.customerPhone || '');
  const cleanAgentMessage = escapeTelegramHtml(data.lastMessage || '');
  const cleanAgentSession = escapeTelegramHtml(data.sessionId || '');

  const tgAgentText = `🚨 <b>CUSTOMER WANTS LIVE SUPPORT / HUMAN!</b>\n\n` +
    `👤 <b>Customer:</b> ${cleanAgentCustomer}\n` +
    (cleanAgentPhone ? `📞 <b>Phone:</b> ${cleanAgentPhone}\n` : '') +
    `💬 <b>Last Message:</b> "${cleanAgentMessage}"\n` +
    `🆔 <b>Session:</b> <code>${cleanAgentSession}</code>\n\n` +
    `👉 <i>Customer is waiting for your live response! Open Admin Panel to chat.</i>`;
  sendTelegramNotification(tgAgentText, config).catch((e) => console.warn('[Live Agent Telegram Alert] Failed:', e));

  let status = 'logged';
  const transporter = getTransporter(config);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Alerts" <alerts@giftghor.world>`,
        to: NOTIFICATION_RECIPIENTS,
        subject,
        html: htmlContent,
      });
      status = 'sent';
      console.log(`[Email Notification] Live Agent email sent successfully!`);
    } catch (e) {
      console.error(`[Email Notification] SMTP send error:`, e);
      status = 'failed';
    }
  }

  await saveNotificationToFirestore({
    id: `notif-agent-${Date.now()}`,
    type: 'live_agent',
    recipients: NOTIFICATION_RECIPIENTS,
    subject,
    details: data,
    sentAt: new Date().toISOString(),
    status,
  });

  return { success: true, status };
}

/**
 * Send 2-Step Verification OTP Code Email
 */
export async function sendOtpEmail(otp: string, targetEmail: string = 'giftghor6525@gmail.com', config?: EmailConfig) {
  const subject = `🔐 Your Gift Ghor Admin Verification Code: ${otp}`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ECECEC; border-radius: 12px; background-color: #FFFFFF;">
      <div style="background-color: #262626; padding: 16px 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #ECA548; margin: 0; font-size: 20px;">GIFT GHOR ADMIN</h1>
        <p style="color: #ECECEC; margin: 4px 0 0 0; font-size: 13px;">Two-Step Login Verification</p>
      </div>

      <div style="padding: 24px 0; text-align: center;">
        <p style="color: #444; font-size: 14px; margin-bottom: 16px;">
          Use the 6-digit security code below to complete your login to the Gift Ghor Admin Panel:
        </p>

        <div style="display: inline-block; background-color: #FDF7EE; border: 2px dashed #ECA548; padding: 12px 30px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #262626;">
          ${otp}
        </div>

        <p style="color: #888; font-size: 12px; margin-top: 16px;">
          This code will expire in 10 minutes. If you did not request this code, please secure your password.
        </p>
      </div>
    </div>
  `;

  const recipients = [targetEmail, 'jahidulislammozumder@outlook.com'];
  console.log(`[Email OTP] 2FA OTP [${otp}] generated for: ${recipients.join(', ')}`);

  let status = 'logged';
  const transporter = getTransporter(config);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Security" <security@giftghor.world>`,
        to: recipients,
        subject,
        html: htmlContent,
      });
      status = 'sent';
    } catch (e) {
      console.error('[Email OTP] Send error:', e);
      status = 'failed';
    }
  }

  await saveNotificationToFirestore({
    id: `notif-otp-${Date.now()}`,
    type: 'otp',
    recipients,
    subject,
    details: { otp },
    sentAt: new Date().toISOString(),
    status,
  });

  return { success: true, status, otp };
}

/**
 * Send customer message notification (via Telegram instant mobile alert + Email)
 */
export async function sendCustomerMessageAlert(data: {
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  customerMessage: string;
  botReply?: string;
  needsAttention?: boolean;
  isNewChat?: boolean;
}, config?: NotificationConfig) {
  // 1. Send via Telegram (instant mobile push notification with sound)
  const cleanCustomerName = escapeTelegramHtml(data.customerName || 'Website Visitor');
  const cleanPhone = escapeTelegramHtml(data.customerPhone || '');
  const cleanMessage = escapeTelegramHtml(data.customerMessage || '');
  const cleanBotReply = escapeTelegramHtml(
    data.botReply ? (data.botReply.length > 200 ? data.botReply.slice(0, 197) + '...' : data.botReply) : ''
  );

  const tgIcon = data.needsAttention ? '🚨 [LIVE AGENT / ATTENTION]' : (data.isNewChat ? '💬 [NEW CUSTOMER CHAT]' : '📩 [NEW CUSTOMER MESSAGE]');
  const tgText = `${tgIcon} <b>Gift Ghor Store Alert</b>\n\n` +
    `👤 <b>Customer:</b> ${cleanCustomerName}\n` +
    (cleanPhone ? `📞 <b>Phone:</b> ${cleanPhone}\n` : '') +
    `💬 <b>Customer Message:</b> "${cleanMessage}"\n` +
    (cleanBotReply ? `🤖 <b>AI Replied:</b> "${cleanBotReply}"\n` : '') +
    `\n🆔 <b>Session ID:</b> <code>${escapeTelegramHtml(data.sessionId)}</code>\n` +
    `⏰ <i>${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })} (BD Time)</i>\n\n` +
    `📲 <b>টেলিগ্রাম থেকেই কাস্টমারকে উত্তর দিন:</b>\n` +
    `• এই মেসেজে সরাসরি <b>Reply</b> (Swipe) করে আপনার উত্তর লিখে পাঠিয়ে দিন।\n` +
    `• অথবা টাইপ করুন: <code>/reply ${escapeTelegramHtml(data.sessionId)} আপনার উত্তর</code>\n` +
    `<i>(আপনার উত্তর সরাসরি ওয়েবসাইটের চ্যাট উইজেটে পৌঁছে যাবে)</i>`;

  console.log(`[sendCustomerMessageAlert] Dispatching Telegram alert for session ${data.sessionId} (needsAttention: ${data.needsAttention})`);
  sendTelegramNotification(tgText, config).catch((e) => console.warn('[Telegram Error]:', e));

  // 2. Send via Email if it needs attention or is a new customer chat
  if (data.needsAttention || data.isNewChat) {
    const subject = data.needsAttention 
      ? `🚨 Customer Needs Assistance: "${data.customerMessage.slice(0, 45)}..."` 
      : `💬 New Customer Chat on Gift Ghor: "${data.customerMessage.slice(0, 45)}..."`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #ECECEC; border-radius: 12px; background-color: #FFFFFF;">
        <div style="background-color: ${data.needsAttention ? '#DC2626' : '#ECA548'}; padding: 14px 20px; border-radius: 8px; text-align: center;">
          <h2 style="color: #FFFFFF; margin: 0; font-size: 18px;">${data.needsAttention ? '🚨 Customer Needs Human Assistance' : '💬 New Customer Message'}</h2>
          <p style="color: #FFF; margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Gift Ghor Live Alert</p>
        </div>

        <div style="padding: 16px 0; font-size: 14px; line-height: 1.6;">
          <p><strong>Customer:</strong> ${data.customerName || 'Store Visitor'}</p>
          ${data.customerPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.customerPhone}">${data.customerPhone}</a></p>` : ''}
          <div style="background-color: #F8F9FA; border-left: 4px solid #ECA548; padding: 12px; margin: 12px 0; border-radius: 4px;">
            <strong>Customer Message:</strong><br/>
            "${data.customerMessage}"
          </div>
          ${data.botReply ? `
          <div style="background-color: #F0FDF4; border-left: 4px solid #16A34A; padding: 12px; margin: 12px 0; border-radius: 4px; color: #166534;">
            <strong>Bot Answer:</strong><br/>
            "${data.botReply}"
          </div>` : ''}
          <p style="font-size: 12px; color: #666;">Session ID: <code>${data.sessionId}</code></p>
        </div>

        <div style="background-color: #FDF7EE; padding: 12px; border-radius: 8px; text-align: center; font-size: 12px; color: #7C2D12;">
          Log into the <a href="https://giftghor.world" style="color: #ECA548; font-weight: bold;">Admin Panel</a> to reply directly to this customer.
        </div>
      </div>
    `;

    const transporter = getTransporter(config);
    if (transporter) {
      transporter.sendMail({
        from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Alerts" <alerts@giftghor.world>`,
        to: NOTIFICATION_RECIPIENTS,
        subject,
        html: htmlContent,
      }).catch((e) => console.warn('[Email Alert] Error:', e));
    }
  }

  // 3. Save Notification in Firestore
  saveNotificationToFirestore({
    id: `notif-chat-${Date.now()}`,
    type: data.needsAttention ? 'live_agent' : 'order',
    recipients: NOTIFICATION_RECIPIENTS,
    subject: `Customer Message: ${data.customerMessage.slice(0, 30)}`,
    details: data,
    sentAt: new Date().toISOString(),
    status: 'sent',
  }).catch(() => {});
}

