/**
 * Steadfast Courier API Integration Service
 * Provides:
 * - Live parcel booking (create_order)
 * - Live delivery status tracking (status_by_cid, status_by_trackingcode, status_by_invoice)
 * - Account balance checks (get_balance)
 * - Bulk order tracking synchronization
 * - Webhook handler for instant real-time status updates
 */

import axios from 'axios';

export interface SteadfastCredentials {
  apiKey: string;
  secretKey: string;
}

export interface SteadfastBookingPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastBookingResult {
  success: boolean;
  consignmentId?: string;
  trackingCode?: string;
  invoice?: string;
  trackingUrl?: string;
  deliveryStatus?: string;
  codAmount: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  raw?: any;
  error?: string;
}

/**
 * Creates a live parcel booking on Steadfast Courier
 */
export async function bookSteadfastParcel(
  payload: SteadfastBookingPayload,
  creds: SteadfastCredentials
): Promise<SteadfastBookingResult> {
  const cleanPhone = (payload.recipient_phone || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('880') ? cleanPhone.slice(2) : (cleanPhone.startsWith('88') ? cleanPhone.slice(2) : cleanPhone);

  const cleanPayload = {
    invoice: payload.invoice ? String(payload.invoice).trim() : `GG-${Date.now().toString().slice(-6)}`,
    recipient_name: payload.recipient_name ? String(payload.recipient_name).trim() : 'Customer',
    recipient_phone: normalizedPhone,
    recipient_address: payload.recipient_address ? String(payload.recipient_address).trim() : 'Dhaka, Bangladesh',
    cod_amount: Math.max(0, Number(payload.cod_amount) || 0),
    note: payload.note ? String(payload.note).trim() : '',
  };

  try {
    const res = await axios.post(`${STEADFAST_BASE_URL}/create_order`, cleanPayload, {
      headers: {
        'Api-Key': creds.apiKey,
        'Secret-Key': creds.secretKey,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
      validateStatus: () => true,
    });

    if (res.data && (res.data.status === 200 || res.data.consignment)) {
      const consignment = res.data.consignment || {};
      const cid = consignment.consignment_id ? String(consignment.consignment_id) : undefined;
      const trackingCode = consignment.tracking_code ? String(consignment.tracking_code) : undefined;
      const trackingTarget = trackingCode || cid;
      const trackingUrl = trackingTarget ? `https://steadfast.com.bd/tracking?q=${encodeURIComponent(trackingTarget)}` : undefined;

      return {
        success: true,
        consignmentId: cid,
        trackingCode: trackingCode,
        invoice: cleanPayload.invoice,
        trackingUrl,
        deliveryStatus: consignment.status || 'in_review',
        codAmount: cleanPayload.cod_amount,
        recipientName: cleanPayload.recipient_name,
        recipientPhone: cleanPayload.recipient_phone,
        recipientAddress: cleanPayload.recipient_address,
        raw: res.data,
      };
    } else {
      let errMsg = 'Steadfast booking failed';
      if (res.data?.errors) {
        if (typeof res.data.errors === 'object') {
          errMsg = Object.entries(res.data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        } else {
          errMsg = String(res.data.errors);
        }
      } else if (res.data?.message) {
        errMsg = res.data.message;
      }
      return {
        success: false,
        codAmount: cleanPayload.cod_amount,
        recipientName: cleanPayload.recipient_name,
        recipientPhone: cleanPayload.recipient_phone,
        recipientAddress: cleanPayload.recipient_address,
        error: errMsg,
        raw: res.data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      codAmount: cleanPayload.cod_amount,
      recipientName: cleanPayload.recipient_name,
      recipientPhone: cleanPayload.recipient_phone,
      recipientAddress: cleanPayload.recipient_address,
      error: err?.response?.data?.message || err.message,
    };
  }
}

export interface SteadfastTrackingResult {
  success: boolean;
  deliveryStatus: string;
  statusTextBangla: string;
  statusTextEnglish: string;
  consignmentId?: string;
  trackingCode?: string;
  invoice?: string;
  trackingUrl?: string;
  raw?: any;
  error?: string;
}

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

export function getSteadfastCredentials(adminSettings?: any): SteadfastCredentials | null {
  const apiKey = adminSettings?.steadfastApiKey || process.env.STEADFAST_API_KEY;
  const secretKey = adminSettings?.steadfastSecretKey || process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return null;
  }
  return { apiKey: apiKey.trim(), secretKey: secretKey.trim() };
}

/**
 * Translates Steadfast delivery_status to friendly human status in Bengali & English with explanation
 */
export function translateSteadfastStatus(status: string): { bangla: string; english: string; badgeColor: string; explanation: string } {
  const normalized = (status || '').toLowerCase().trim();

  switch (normalized) {
    case 'delivered':
      return {
        bangla: '✅ ডেলিভারি সম্পন্ন (Delivered)',
        english: 'Delivered',
        badgeColor: 'green',
        explanation: 'পার্সেলটি সফলভাবে আপনার কাছে ডেলিভারি করা হয়েছে। Gift Ghor-এর সাথে থাকার জন্য ধন্যবাদ!',
      };
    case 'delivered_approval_pending':
      return {
        bangla: '✅ ডেলিভারি সম্পন্ন (ডেলিভারি অনুমোদনের অপেক্ষায়)',
        english: 'Delivered (Approval Pending)',
        badgeColor: 'green',
        explanation: 'রাইডার পার্সেলটি সফলভাবে ডেলিভারি সম্পন্ন করেছেন এবং কুরিয়ার সিস্টেমে চূড়ান্ত অনুমোদনের প্রক্রিয়ায় রয়েছে।',
      };
    case 'partial_delivered':
      return {
        bangla: '⚠️ আংশিক ডেলিভারি সম্পন্ন (Partially Delivered)',
        english: 'Partially Delivered',
        badgeColor: 'amber',
        explanation: 'অর্ডারের কিছু পণ্য ডেলিভারি করা হয়েছে।',
      };
    case 'in_transit':
      return {
        bangla: '🚚 ট্রানজিটে রয়েছে / ডেলিভারির পথে (In Transit)',
        english: 'In Transit',
        badgeColor: 'blue',
        explanation: 'পার্সেলটি Steadfast কুরিয়ার হাবে রয়েছে এবং ডেলিভারির জন্য আপনার ঠিকানায় পাঠানো হচ্ছে।',
      };
    case 'pending':
      return {
        bangla: '⏳ পিকআপের অপেক্ষায় (Pending Pickup)',
        english: 'Pending Pickup',
        badgeColor: 'yellow',
        explanation: 'অর্ডারটি কুরিয়ারে বুকিং সম্পন্ন হয়েছে এবং কুরিয়ার রাইডার কর্তৃক পিকআপের অপেক্ষায় রয়েছে।',
      };
    case 'in_review':
      return {
        bangla: '📋 পর্যালোচনায় রয়েছে (In Review)',
        english: 'In Review',
        badgeColor: 'purple',
        explanation: 'অর্ডারটি সিস্টেমে রিভিউ ও প্যাকিং প্রক্রিয়ায় রয়েছে।',
      };
    case 'hold':
      return {
        bangla: '⏸️ সাময়িক হোল্ডে রয়েছে (On Hold)',
        english: 'On Hold',
        badgeColor: 'orange',
        explanation: 'ডেলিভারির জন্য আপনার ঠিকানার অতিরিক্ত তথ্যের জন্য সাময়িক হোল্ড করা হয়েছে।',
      };
    case 'cancelled':
      return {
        bangla: '❌ অর্ডার বাতিল (Cancelled)',
        english: 'Cancelled',
        badgeColor: 'rose',
        explanation: 'এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।',
      };
    case 'cancelled_approval_pending':
      return {
        bangla: '⏳ অর্ডার বাতিল প্রক্রিয়ায় রয়েছে (Cancellation Pending)',
        english: 'Cancelled (Approval Pending)',
        badgeColor: 'rose',
        explanation: 'অর্ডারটি বাতিলের অনুরোধ প্রক্রিয়াকরণে রয়েছে।',
      };
    default:
      return {
        bangla: `📦 ${status ? status.replace(/_/g, ' ') : 'বুকড রয়েছে'}`,
        english: status || 'Booked',
        badgeColor: 'gray',
        explanation: 'পার্সেলটির তথ্য কুরিয়ার সিস্টেমে আপডেট হচ্ছে।',
      };
  }
}

/**
 * Checks live delivery status from Steadfast Courier API
 * Supports consignment_id, tracking_code, or invoice number
 */
export async function querySteadfastTracking(
  identifier: { consignmentId?: string; trackingCode?: string; invoice?: string },
  creds: SteadfastCredentials
): Promise<SteadfastTrackingResult> {
  const headers = {
    'Api-Key': creds.apiKey,
    'Secret-Key': creds.secretKey,
    'Content-Type': 'application/json',
  };

  const code = identifier.trackingCode?.trim();
  const cid = identifier.consignmentId?.trim();
  const inv = identifier.invoice?.trim();

  const attempts: Array<{ url: string; label: string }> = [];

  if (code) {
    attempts.push({ url: `${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(code)}`, label: 'tracking_code' });
  }
  if (cid) {
    attempts.push({ url: `${STEADFAST_BASE_URL}/status_by_cid/${encodeURIComponent(cid)}`, label: 'consignment_id' });
  }
  if (inv) {
    attempts.push({ url: `${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(inv)}`, label: 'invoice' });
  }

  if (attempts.length === 0) {
    return {
      success: false,
      deliveryStatus: 'unknown',
      statusTextBangla: 'ট্র্যাকিং কোড বা কনসাইনমেন্ট আইডি পাওয়া যায়নি',
      statusTextEnglish: 'No tracking code or consignment ID provided',
      error: 'No identifier provided',
    };
  }

  let lastError = '';

  for (const attempt of attempts) {
    try {
      const res = await axios.get(attempt.url, {
        headers,
        timeout: 8000,
        validateStatus: () => true,
      });

      if (res.data && (res.data.status === 200 || res.data.delivery_status)) {
        const rawStatus = res.data.delivery_status || 'booked';
        const translated = translateSteadfastStatus(rawStatus);
        const trackingTarget = code || cid;
        const trackingUrl = trackingTarget ? `https://steadfast.com.bd/tracking?q=${encodeURIComponent(trackingTarget)}` : undefined;

        return {
          success: true,
          deliveryStatus: rawStatus,
          statusTextBangla: translated.bangla,
          statusTextEnglish: translated.english,
          consignmentId: cid,
          trackingCode: code,
          invoice: inv,
          trackingUrl,
          raw: res.data,
        };
      } else {
        lastError = res.data?.message || `Status response code ${res.status}`;
      }
    } catch (e: any) {
      lastError = e?.response?.data?.message || e.message;
    }
  }

  // Fallback: If live lookup fails or is pending
  const fallbackTarget = code || cid;
  const fallbackUrl = fallbackTarget ? `https://steadfast.com.bd/tracking?q=${encodeURIComponent(fallbackTarget)}` : undefined;
  return {
    success: false,
    deliveryStatus: 'booked',
    statusTextBangla: '🚚 কুরিয়ারে বুকিং সক্রিয় রয়েছে',
    statusTextEnglish: 'Booked with Steadfast',
    trackingUrl: fallbackUrl,
    error: lastError,
  };
}

/**
 * Checks current Steadfast merchant balance
 */
export async function getSteadfastBalance(creds: SteadfastCredentials): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const res = await axios.get(`${STEADFAST_BASE_URL}/get_balance`, {
      headers: {
        'Api-Key': creds.apiKey,
        'Secret-Key': creds.secretKey,
      },
      timeout: 7000,
    });
    if (res.data && typeof res.data.current_balance === 'number') {
      return { success: true, balance: res.data.current_balance };
    }
    return { success: false, error: 'Invalid response from Steadfast' };
  } catch (e: any) {
    return { success: false, error: e?.response?.data?.message || e.message };
  }
}

/**
 * Syncs all booked orders with Steadfast Courier in background
 */
export async function syncAllBookedOrdersWithSteadfast(
  db: any,
  saveDB: (db: any) => void,
  saveOrderToFirestore: (order: any) => Promise<any>,
  onStatusChanged?: (order: any, oldStatus: string, newStatus: string) => Promise<any>
): Promise<{ totalChecked: number; updatedCount: number; errors: number }> {
  const creds = getSteadfastCredentials(db.adminSettings);
  if (!creds) {
    return { totalChecked: 0, updatedCount: 0, errors: 0 };
  }

  const orders = Object.values(db.orders || {}) as any[];
  const eligibleOrders = orders.filter((o) => {
    // Check orders booked or with consignment/tracking code that are not yet marked as delivered/cancelled
    const hasTracking = !!(o.steadfastConsignmentId || o.steadfastTrackingCode);
    const isBooked = o.status === 'steadfast_booked';
    const isPending = o.status === 'pending' || o.status === 'confirmed';
    return (isBooked || (hasTracking && isPending)) && o.status !== 'delivered' && o.status !== 'cancelled';
  });

  let updatedCount = 0;
  let errors = 0;

  for (const order of eligibleOrders) {
    try {
      const trackingResult = await querySteadfastTracking(
        {
          consignmentId: order.steadfastConsignmentId,
          trackingCode: order.steadfastTrackingCode,
          invoice: order.orderNumber,
        },
        creds
      );

      if (trackingResult.success && trackingResult.deliveryStatus) {
        const rawStatus = trackingResult.deliveryStatus.toLowerCase();
        const oldStatus = order.status;
        let statusChanged = false;

        order.steadfastDeliveryStatus = rawStatus;
        order.steadfastLastCheckedAt = new Date().toISOString();

        if (rawStatus === 'delivered' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.updatedAt = new Date().toISOString();
          statusChanged = true;
        } else if (rawStatus === 'cancelled' && order.status !== 'cancelled') {
          order.status = 'cancelled';
          order.updatedAt = new Date().toISOString();
          statusChanged = true;
        } else if (rawStatus === 'partial_delivered' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.updatedAt = new Date().toISOString();
          statusChanged = true;
        }

        updatedCount++;
        saveDB(db);
        saveOrderToFirestore(order).catch((e) => console.warn('[Firestore] Sync order failed:', e));

        if (statusChanged && onStatusChanged) {
          onStatusChanged(order, oldStatus, order.status).catch((e) => console.warn('[Telegram Alert] Courier sync notify error:', e));
        }
      }
    } catch (err) {
      errors++;
    }

    // Small delay between requests to be gentle on Steadfast API
    await new Promise((r) => setTimeout(r, 400));
  }

  return { totalChecked: eligibleOrders.length, updatedCount, errors };
}
