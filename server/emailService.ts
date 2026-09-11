import nodemailer from 'nodemailer';
import { saveNotificationToFirestore } from './firebaseService.js';

export const NOTIFICATION_RECIPIENTS = [
  'giftghor6525@gmail.com',
  'jahidulislammozumder@outlook.com',
];

/**
 * Get or create Nodemailer transporter
 */
function getTransporter() {
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

  // If GMAIL_APP_PASSWORD and GMAIL_USER exist
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
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
}) {
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

  let status = 'logged';
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Gift Ghor Orders" <no-reply@giftghor.world>`,
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
}) {
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

  let status = 'logged';
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Gift Ghor Alerts" <alerts@giftghor.world>`,
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
export async function sendOtpEmail(otp: string, targetEmail: string = 'giftghor6525@gmail.com') {
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
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Gift Ghor Security" <security@giftghor.world>`,
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
