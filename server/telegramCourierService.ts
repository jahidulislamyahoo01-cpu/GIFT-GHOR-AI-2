import axios from 'axios';
import {
  getSteadfastCredentials,
  bookSteadfastParcel,
  SteadfastBookingResult,
} from './steadfastService.js';
import { deductStock, matchProduct, convertBengaliDigits } from './stockService.js';

export interface ParsedCourierOrder {
  isBookingRequested: boolean;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  isPaid: boolean;
  codAmount: number;
  productName?: string;
  quantity?: number;
  variantColor?: string;
  note?: string;
}

/**
 * Helper to escape HTML characters for Telegram
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Robust extractor for Bangladesh 11-digit mobile phone numbers:
 * - Handles Bengali numerals (০১৭১২৩৪৫৬৭৮)
 * - Handles formatted numbers with spaces, dashes, or dots (01712 345678, 01712-345678, 017-1234-5678)
 * - Handles country code prefixes (+8801..., 8801...)
 * - Handles unlabeled numbers appearing on their own line or inside free text
 */
export function extractBangladeshPhone(text: string): string | undefined {
  if (!text) return undefined;
  const converted = convertBengaliDigits(text);

  // 1. Explicit labeled pattern (Phone: 01712345678, মোবাইল - 018...)
  const labeled = converted.match(/(?:phone|mobile|cell|call|tel|contact|ফোন|মোবাইল|নাম্বার|নম্বর)\s*[:=-]?\s*(\+?88\s*0?1[3-9][\d\s\-]{8,14}|01[3-9][\d\s\-]{8,14})/i);
  if (labeled && labeled[1]) {
    const raw = labeled[1].replace(/[^0-9]/g, '');
    const clean = raw.startsWith('880') ? raw.slice(2) : (raw.startsWith('88') ? raw.slice(2) : raw);
    if (clean.length === 11 && clean.startsWith('01')) {
      return clean;
    }
  }

  // 2. Scan lines for standalone or embedded phone number
  const lines = converted.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Check if line contains a phone pattern
    const lineDigits = line.replace(/[^0-9]/g, '');
    const normalizedLineDigits = lineDigits.startsWith('880') ? lineDigits.slice(2) : (lineDigits.startsWith('88') ? lineDigits.slice(2) : lineDigits);
    if (normalizedLineDigits.length === 11 && normalizedLineDigits.startsWith('01')) {
      return normalizedLineDigits;
    }

    // Match regex inside line
    const match = line.match(/(?:\+?88\s*0?)?(01[3-9](?:[\s\-]?\d){8})/);
    if (match && match[1]) {
      const clean = match[1].replace(/[^0-9]/g, '');
      if (clean.length === 11 && clean.startsWith('01')) {
        return clean;
      }
    }
  }

  // 3. Global scan across entire text
  const matches = converted.matchAll(/(?:\+?88\s*0?)?(01[3-9](?:[\s\-]?\d){8})/g);
  for (const m of matches) {
    if (m && m[1]) {
      const clean = m[1].replace(/[^0-9]/g, '');
      if (clean.length === 11 && clean.startsWith('01')) {
        return clean;
      }
    }
  }

  return undefined;
}

/**
 * Checks if user message contains intent to book parcel into Steadfast courier
 */
export function hasCourierBookingIntent(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();

  // Explicit commands
  if (lower.startsWith('/book') || lower.startsWith('/courier') || lower.startsWith('/steadfast') || lower.startsWith('/entry')) {
    return true;
  }

  // Keywords indicating courier entry / booking
  const keywords = [
    'courier',
    'কুরিয়ার',
    'kuriyar',
    'curiar',
    'curier',
    'steadfast',
    'স্টেডফাস্ট',
    'stedfast',
    'কুরিয়ার',
    'বুকিং',
    'বুক করো',
    'বুক কর',
    'book koro',
    'booking koro',
    'entry koro',
    'এন্ট্রি করো',
    'এন্ট্রি দাও',
    'entry dao',
    'courier e dao',
    'courier e pathao',
    'পার্সেল পাঠাও',
    'পার্সেল বুক',
    'parcel book',
    'parcel entry',
    'send to courier',
  ];

  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Extracts courier booking details from text using Regex heuristic fallback
 */
export function parseCourierOrderRegex(text: string, products: any[] = []): ParsedCourierOrder {
  const converted = convertBengaliDigits(text || '').replace(/\r/g, '');
  const lower = converted.toLowerCase();

  // 1. Phone number (Robust extraction: supports any formatting, Bengali/English digits, with or without label)
  const customerPhone = extractBangladeshPhone(converted);

  // 2. Paid vs COD detection
  let isPaid = false;
  let codAmount = 0;

  const paidMatch = lower.match(/\b(?:paid|full\s*paid|advance|advance\s*paid|00|০|০0|পেইড|ফুল\s*পেইড|এডভান্স|অগ্রিম|পরিশোধিত)\b/);
  if (paidMatch) {
    isPaid = true;
    codAmount = 0;
  }

  // Look for COD amount patterns e.g. COD: 450, 450 tk, ৳450, cod 450, বিল 450, টাকা 450, bill: 450
  const codMatch = converted.match(/(?:cod|বিল|টাকা|দাম|মূল্য|amount|bill|taka|tk)\s*[:=-]?\s*৳?\s*(\d+)/i) ||
    converted.match(/৳\s*(\d+)/) ||
    converted.match(/\b(\d{3,5})\s*(?:tk|taka|টাকা|৳)\b/i);

  if (codMatch && !isPaid) {
    codAmount = parseInt(codMatch[1], 10);
    if (codAmount === 0) {
      isPaid = true;
    }
  }

  // 3. Name detection
  let customerName: string | undefined;
  const nameMatch = converted.match(/(?:name|customer(?:\s*name)?|গ্রাহক|নাম|recipient)\s*[:=-]\s*([^\n,]+)/i);
  if (nameMatch) {
    customerName = nameMatch[1].trim();
  }

  // 4. Address detection
  let customerAddress: string | undefined;
  const addressMatch = converted.match(/(?:address|ঠিকানা|লোকেশন|location|loc)\s*[:=-]\s*([^\n]+)/i);
  if (addressMatch) {
    customerAddress = addressMatch[1].trim();
  }

  // 5. Product & Note detection
  let productName: string | undefined;
  let quantity = 1;
  let variantColor: string | undefined;

  const lines = converted.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const matched = matchProduct(line, products);
    if (matched && matched.product) {
      productName = matched.product.title;
      // Extract color if available
      const colors = ['black', 'white', 'pink', 'blue', 'brown', 'red', 'green', 'yellow', 'purple', 'beige', 'khaki', 'grey', 'কালো', 'সাদা', 'গোলাপি', 'নীল', 'লাল', 'বাদামি', 'সবুজ', 'হলুদ', 'বেগুনি', 'বেইজ', 'খাকি'];
      for (const col of colors) {
        if (line.toLowerCase().includes(col)) {
          variantColor = col;
          break;
        }
      }
      // Extract qty
      const qtyMatch = line.match(/(\d+)\s*(?:pcs|pc|টা|টি|পিস|ta|ti)/i);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
      }
      break;
    }
  }

  // If no name found by label, check lines for a human name (non-phone, non-address, non-product line)
  if (!customerName && lines.length > 0) {
    for (const line of lines) {
      const lineDigits = line.replace(/[^0-9]/g, '');
      if (
        !line.match(/01[3-9]\d{8}/) &&
        lineDigits.length < 9 &&
        !line.match(/(?:courier|steadfast|paid|cod|order|book|ঠিকানা|ঢাকা|চট্টগ্রাম|house|road|sector|থানা|জেলা|বিল|টাকা|tk|taka)/i) &&
        line.length > 2 &&
        line.length < 30 &&
        !matchProduct(line, products)
      ) {
        customerName = line.replace(/^[-\s*•]+/, '').trim();
        break;
      }
    }
  }

  // If address not found by label, check lines containing location keywords
  if (!customerAddress && lines.length > 0) {
    for (const line of lines) {
      if (
        line.match(/(?:house|road|thana|district|dhaka|chittagong|sylhet|rajshahi|khulna|barisal|rangpur|mymensingh|gazipur|narayanganj|savar|mirpur|dhanmondi|uttara|gulshan|banani|mohammadpur|badda|বাড়ি|রোড|থানা|জেলা|ঢাকা|চট্টগ্রাম|মিরপুর|ধানমন্ডি|উত্তরা|গুলশান|বাসা|সেক্টর|গ্রাম|ডাকঘর)/i) &&
        !line.match(/^(?:courier|steadfast|book|entry)/i)
      ) {
        customerAddress = line.trim();
        break;
      }
    }
  }

  return {
    isBookingRequested: hasCourierBookingIntent(text),
    customerName: customerName || 'সম্মানিত গ্রাহক',
    customerPhone,
    customerAddress,
    isPaid,
    codAmount,
    productName,
    quantity,
    variantColor,
    note: productName ? `${productName}${variantColor ? ` (${variantColor})` : ''} - ${quantity} pcs` : undefined,
  };
}

/**
 * Intelligent AI parser using Gemini with structured prompt
 */
export async function parseCourierOrderWithAI(
  text: string,
  products: any[],
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
): Promise<ParsedCourierOrder> {
  // First run heuristic parser as baseline
  const heuristic = parseCourierOrderRegex(text, products);

  if (!callAI) {
    return heuristic;
  }

  try {
    const productCatalog = products.map((p) => `- ${p.title} (Price: ৳${p.price})`).join('\n');

    const prompt = `You are an intelligent order extractor for an e-commerce store in Bangladesh.
The staff has written a message in the Telegram group requesting to book an order into Steadfast Courier.

Available Products:
${productCatalog}

Text to parse:
"""
${text}
"""

Instructions:
1. Extract customerName, customerPhone (11-digit Bangladesh phone like 017xxxxxxxx or +88017xxxxxxxx, handles Bengali numerals and any formatting), customerAddress (full delivery address).
2. Payment detection:
   - If message mentions "paid", "full paid", "advance", "0", "00", "পেইড", "এডভান্স" -> isPaid: true, codAmount: 0.
   - If message specifies an amount (e.g. "COD 450", "450 tk", "বিল ৪৫০") -> isPaid: false, codAmount: 450 (as a number).
   - If neither is mentioned, check product price from catalog or default to 0.
3. Identify productName, variantColor, and quantity.
4. Output STRICT JSON ONLY matching this structure (no markdown fences, no extra text):
{
  "isBookingRequested": true,
  "customerName": "Customer Name",
  "customerPhone": "01712345678",
  "customerAddress": "Full delivery address",
  "isPaid": false,
  "codAmount": 450,
  "productName": "Product Name",
  "quantity": 1,
  "variantColor": "Color",
  "note": "Optional order summary"
}`;

    const aiRes = await callAI([{ role: 'user', parts: [{ text: prompt }] }], prompt, 350);
    if (aiRes) {
      const cleanJson = aiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const parsedPhone = parsed.customerPhone ? extractBangladeshPhone(parsed.customerPhone) : undefined;

      return {
        isBookingRequested: true,
        customerName: parsed.customerName || heuristic.customerName,
        customerPhone: parsedPhone || heuristic.customerPhone,
        customerAddress: parsed.customerAddress || heuristic.customerAddress,
        isPaid: parsed.isPaid !== undefined ? !!parsed.isPaid : heuristic.isPaid,
        codAmount: typeof parsed.codAmount === 'number' ? parsed.codAmount : heuristic.codAmount,
        productName: parsed.productName || heuristic.productName,
        quantity: parsed.quantity || heuristic.quantity || 1,
        variantColor: parsed.variantColor || heuristic.variantColor,
        note: parsed.note || heuristic.note,
      };
    }
  } catch (err) {
    // fallback to heuristic
  }

  return heuristic;
}

// -------------------------------------------------------------
// DEDUPLICATION & CONCURRENCY LOCK ENGINE
// Prevents duplicate courier bookings (e.g. 3-4 bookings for the same parcel)
// -------------------------------------------------------------
interface RecentBookingCacheItem {
  timestamp: number;
  order: any;
  replyText: string;
  logisticsNotificationMsg: string;
}

const recentBookingsCache = new Map<string, RecentBookingCacheItem>();
const activeBookingLocks = new Set<string>();

// Cleanup stale bookings every 5 minutes (keep 90 second TTL)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of recentBookingsCache.entries()) {
    if (now - val.timestamp > 90 * 1000) {
      recentBookingsCache.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Main dispatcher for Telegram Courier Booking with robust deduplication & group isolation
 */
export async function processTelegramCourierBooking(
  currentText: string,
  replyToText: string | undefined,
  db: any,
  saveDB: (db: any) => void,
  saveOrderToFirestore: (order: any) => Promise<any>,
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>,
  options?: {
    senderName?: string;
    onNotifySecondaryGroup?: (text: string) => Promise<any>;
    chatId?: string | number;
    messageId?: number;
  }
): Promise<{ handled: boolean; success?: boolean; replyText?: string; order?: any }> {
  const combinedText = replyToText ? `${replyToText}\n${currentText}` : currentText;

  // 1. Check if courier booking was explicitly requested
  if (!hasCourierBookingIntent(currentText) && !hasCourierBookingIntent(combinedText)) {
    return { handled: false };
  }

  // 2. Parse details with AI + Regex
  const parsed = await parseCourierOrderWithAI(combinedText, db.products || [], callAI);

  // 3. Validation: Phone number is mandatory for Steadfast
  if (!parsed.customerPhone || parsed.customerPhone.length < 10) {
    return {
      handled: true,
      success: false,
      replyText:
        `⚠️ <b>কুরিয়ারে এন্ট্রি করতে কাস্টমারের ১১ ডিজিটের মোবাইল নম্বর প্রয়োজন!</b>\n\n` +
        `অনুগ্রহ করে মোবাইল নম্বর সহ লিখুন। উদাহরণ:\n` +
        `<code>Daisy Wallet 1 pcs\n01712345678\nধানমন্ডি, ঢাকা\nCOD: 420\ncourier e entry koro</code>`,
    };
  }

  // 4. Validation: Address is mandatory
  if (!parsed.customerAddress || parsed.customerAddress.trim().length < 4) {
    return {
      handled: true,
      success: false,
      replyText:
        `⚠️ <b>কুরিয়ারে এন্ট্রি করতে কাস্টমারের সম্পূর্ণ ডেলিভারি ঠিকানা প্রয়োজন!</b>\n\n` +
        `📞 <b>মোবাইল:</b> <code>${parsed.customerPhone}</code>\n` +
        `অনুগ্রহ করে সম্পূর্ণ ঠিকানা সহ লিখুন (যেমন: <i>বাড়ি নং, রোড নং, এলাকা/জেলা</i>)।`,
    };
  }

  // 5. Deduplication Check: Prevent duplicate bookings triggered within 15 minutes
  const bookingFingerprint = `${parsed.customerPhone}_${parsed.codAmount}_${parsed.productName || 'item'}_${parsed.isPaid ? 'paid' : 'cod'}`;

  if (activeBookingLocks.has(bookingFingerprint)) {
    console.log(`[Courier Lock] Booking already in progress for fingerprint: ${bookingFingerprint}, blocking duplicate execution.`);
    return {
      handled: true,
      success: true,
      replyText: `⏳ <b>পার্সেলটি কুরিয়ারে বুকিং প্রক্রিয়াধীন রয়েছে...</b> অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।`,
    };
  }

  const existingRecent = recentBookingsCache.get(bookingFingerprint);
  if (existingRecent && Date.now() - existingRecent.timestamp < 90 * 1000) {
    console.log(`[Courier Dedup] Duplicate courier request ignored for ${parsed.customerPhone}. Returning cached response.`);
    return {
      handled: true,
      success: true,
      replyText: existingRecent.replyText,
      order: existingRecent.order,
    };
  }

  // Check persistent DB orders: Never create duplicate Steadfast parcel for the same phone within 15 minutes
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const recentExistingOrder = Object.values(db.orders || {}).find((ord: any) => {
    if (!ord || !ord.customerPhone) return false;
    const samePhone =
      ord.customerPhone === parsed.customerPhone ||
      (ord.customerPhone.length >= 10 && parsed.customerPhone && ord.customerPhone.slice(-10) === parsed.customerPhone.slice(-10));
    const orderTime = new Date(ord.createdAt).getTime();
    return samePhone && orderTime > fifteenMinutesAgo && ord.status === 'steadfast_booked';
  }) as any;

  if (recentExistingOrder) {
    console.log(`[Courier Dedup] Found existing recent booked order ${recentExistingOrder.orderNumber} for phone ${parsed.customerPhone}. Returning existing confirmation.`);
    const paymentBadge = recentExistingOrder.isPaid
      ? `🟢 <b>সম্পূর্ণ পেইড (Paid in Advance — COD: ৳0)</b>`
      : `💵 <b>ক্যাশ অন ডেলিভারি (COD): ৳${recentExistingOrder.codAmount || 0}</b>`;

    const existingReplyMsg =
      `ℹ️ <b>এই পার্সেলটি ইতিমধ্যে Steadfast এ বুকিং করা হয়েছে!</b>\n\n` +
      `🆔 <b>ইনভয়েস:</b> <code>#${recentExistingOrder.orderNumber}</code>` +
      (recentExistingOrder.steadfastConsignmentId ? ` | <b>CID:</b> <code>${recentExistingOrder.steadfastConsignmentId}</code>` : '') +
      `\n👤 <b>গ্রাহক:</b> ${escapeHtml(recentExistingOrder.customerName)} (<code>${escapeHtml(recentExistingOrder.customerPhone)}</code>)\n` +
      `💳 <b>পেমেন্ট:</b> ${paymentBadge}\n` +
      `📦 <b>পণ্য:</b> ${escapeHtml(recentExistingOrder.productName)}${recentExistingOrder.variantColor ? ` (${recentExistingOrder.variantColor})` : ''} (${recentExistingOrder.quantity} pcs)\n` +
      (recentExistingOrder.steadfastTrackingCode ? `🏷️ <b>ট্র্যাকিং কোড:</b> <code>${recentExistingOrder.steadfastTrackingCode}</code>\n` : '') +
      `\n✅ <i>ডুপ্লিকেট পার্সেল এন্ট্রি প্রতিরোধ করা হয়েছে।</i>`;

    return {
      handled: true,
      success: true,
      replyText: existingReplyMsg,
      order: recentExistingOrder,
    };
  }

  // Set active concurrency lock
  activeBookingLocks.add(bookingFingerprint);

  try {
    // 6. Check Steadfast Credentials
    const creds = getSteadfastCredentials(db.adminSettings);
    if (!creds) {
      return {
        handled: true,
        success: false,
        replyText: `⚠️ <b>Steadfast Courier API Credentials পাওয়া যায়নি!</b>\n\nঅ্যাডমিন ড্যাশবোর্ড থেকে API Key ও Secret Key কনফিগার করুন।`,
      };
    }

    // 7. Generate Invoice Number & Booking Payload
    const invoiceNum = `GG-${Date.now().toString().slice(-5)}`;
    const finalCodAmount = parsed.isPaid ? 0 : Math.max(0, parsed.codAmount);
    const orderNote = parsed.note || (parsed.productName ? `${parsed.productName}${parsed.variantColor ? ` (${parsed.variantColor})` : ''} - ${parsed.quantity || 1} pcs` : 'Gift Ghor Order');

    // 8. Execute Live Booking on Steadfast Courier API
    const bookingRes = await bookSteadfastParcel(
      {
        invoice: invoiceNum,
        recipient_name: parsed.customerName || 'সম্মানিত গ্রাহক',
        recipient_phone: parsed.customerPhone,
        recipient_address: parsed.customerAddress,
        cod_amount: finalCodAmount,
        note: orderNote,
      },
      creds
    );

    if (!bookingRes.success) {
      return {
        handled: true,
        success: false,
        replyText:
          `❌ <b>Steadfast কুরিয়ার বুকিং ব্যর্থ হয়েছে!</b>\n\n` +
          `⚠️ <b>কারন:</b> ${escapeHtml(bookingRes.error || 'অজানা ত্রুটি')}\n\n` +
          `👤 <b>গ্রাহক:</b> ${escapeHtml(parsed.customerName || 'N/A')}\n` +
          `📞 <b>মোবাইল:</b> <code>${escapeHtml(parsed.customerPhone)}</code>\n` +
          `📍 <b>ঠিকানা:</b> ${escapeHtml(parsed.customerAddress)}`,
      };
    }

    // 9. Auto-deduct inventory stock if product recognized
    let stockDeductedText = '';
    if (parsed.productName) {
      const stockRes = deductStock(
        parsed.productName,
        parsed.quantity || 1,
        db,
        saveDB,
        {
          variantColor: parsed.variantColor,
          source: 'telegram_group',
          customerName: parsed.customerName,
          customerPhone: parsed.customerPhone,
          customerAddress: parsed.customerAddress,
          senderName: options?.senderName || 'Staff (Telegram)',
        }
      );
      if (stockRes.success && stockRes.product) {
        stockDeductedText = `\n📉 <b>স্টক আপডেট:</b> ${stockRes.product.title}${parsed.variantColor ? ` (${parsed.variantColor})` : ''} (-${parsed.quantity || 1} pcs, অবশিষ্ট: ${stockRes.newStock} pcs)`;
      }
    }

    // 10. Save Order into Database & Cloud Firestore
    const newOrder: any = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: invoiceNum,
      customerName: parsed.customerName || 'সম্মানিত গ্রাহক',
      customerPhone: parsed.customerPhone,
      customerAddress: parsed.customerAddress,
      deliveryLocation: parsed.customerAddress.toLowerCase().includes('dhaka') || parsed.customerAddress.includes('ঢাকা') ? 'inside_dhaka' : 'outside_dhaka',
      productName: parsed.productName || 'Gift Ghor Special Collection',
      variantColor: parsed.variantColor,
      quantity: parsed.quantity || 1,
      totalAmount: finalCodAmount,
      codAmount: finalCodAmount,
      isPaid: parsed.isPaid,
      paymentMethod: parsed.isPaid ? 'Paid in Advance' : 'Cash on Delivery',
      status: 'steadfast_booked',
      steadfastConsignmentId: bookingRes.consignmentId,
      steadfastTrackingCode: bookingRes.trackingCode,
      steadfastDeliveryStatus: 'in_review',
      steadfastLastCheckedAt: new Date().toISOString(),
      source: 'telegram_order_group',
      bookedBy: options?.senderName || 'Staff',
      notes: orderNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.orders) db.orders = {};
    db.orders[newOrder.id] = newOrder;
    saveDB(db);
    saveOrderToFirestore(newOrder).catch(() => {});

    // 11. Format Confirmation Messages for Logistics Group & Order Group
    const paymentBadge = parsed.isPaid
      ? `🟢 <b>সম্পূর্ণ পেইড (Paid in Advance — COD: ৳0)</b>`
      : `💵 <b>ক্যাশ অন ডেলিভারি (COD): ৳${finalCodAmount}</b>`;

    const trackingTarget = bookingRes.trackingCode || bookingRes.consignmentId || '';
    const trackingLink = bookingRes.trackingUrl || (trackingTarget ? `https://steadfast.com.bd/tracking?q=${encodeURIComponent(trackingTarget)}` : '');

    // Rich Notification message dedicated for the Logistics & Courier Sector Group
    const logisticsNotificationMsg =
      `🚚 <b>Steadfast কুরিয়ার পার্সেল বুকিং কনফার্মেশন (লজিস্টিকস সেক্টর)</b>\n\n` +
      `🆔 <b>ইনভয়েস নং:</b> <code>#${invoiceNum}</code>\n` +
      (bookingRes.consignmentId ? `🔢 <b>Consignment ID:</b> <code>${bookingRes.consignmentId}</code>\n` : '') +
      (bookingRes.trackingCode ? `🏷️ <b>Tracking Code:</b> <code>${bookingRes.trackingCode}</code>\n` : '') +
      (trackingLink ? `🔗 <b>লাইভ ট্র্যাকিং লিংক:</b> ${trackingLink}\n` : '') +
      `\n👤 <b>গ্রাহকের নাম:</b> ${escapeHtml(newOrder.customerName)}\n` +
      `📞 <b>মোবাইল:</b> <code>${escapeHtml(newOrder.customerPhone)}</code>\n` +
      `📍 <b>ডেলিভারি ঠিকানা:</b> ${escapeHtml(newOrder.customerAddress)}\n` +
      `💳 <b>পেমেন্ট মোড:</b> ${paymentBadge}\n` +
      `📦 <b>পণ্য:</b> ${escapeHtml(newOrder.productName)}${newOrder.variantColor ? ` (${newOrder.variantColor})` : ''} — ${newOrder.quantity} pcs\n` +
      stockDeductedText + '\n' +
      `👤 <b>বুকিং এন্ট্রি করেছেন:</b> ${escapeHtml(options?.senderName || 'Staff (Telegram)')}\n\n` +
      `✨ <i>লজিস্টিকস টিম পার্সেলটি প্যাকেজিং সম্পন্ন করে কুরিয়ারে হ্যান্ডওভারের জন্য প্রস্তুত করুন।</i>`;

    // Concise, clean reply back in the initiating chat (Order Group)
    const orderGroupReplyMsg =
      `✅ <b>Steadfast কুরিয়ারে বুকিং সফল হয়েছে!</b>\n\n` +
      `🆔 <b>ইনভয়েস:</b> <code>#${invoiceNum}</code>` +
      (bookingRes.consignmentId ? ` | <b>CID:</b> <code>${bookingRes.consignmentId}</code>` : '') +
      `\n👤 <b>গ্রাহক:</b> ${escapeHtml(newOrder.customerName)} (<code>${escapeHtml(newOrder.customerPhone)}</code>)\n` +
      `💳 <b>পেমেন্ট:</b> ${paymentBadge}\n` +
      `📦 <b>পণ্য:</b> ${escapeHtml(newOrder.productName)}${newOrder.variantColor ? ` (${newOrder.variantColor})` : ''} (${newOrder.quantity} pcs)` +
      stockDeductedText + '\n\n' +
      `📢 <i>সম্পূর্ণ কুরিয়ার বুকিং ও ট্র্যাকিং কার্ড <b>লজিস্টিকস ও কুরিয়ার গ্রুপে</b> পুশ করা হয়েছে।</i>`;

    // 12. Push confirmation notification directly to the dedicated Logistics & Courier Group
    if (options?.onNotifySecondaryGroup) {
      options.onNotifySecondaryGroup(logisticsNotificationMsg).catch((e) => console.warn('[Courier Notification Push Error]', e));
    }

    // Cache successful booking for deduplication
    recentBookingsCache.set(bookingFingerprint, {
      timestamp: Date.now(),
      order: newOrder,
      replyText: orderGroupReplyMsg,
      logisticsNotificationMsg,
    });

    return {
      handled: true,
      success: true,
      replyText: orderGroupReplyMsg,
      order: newOrder,
    };
  } finally {
    // Release active lock
    activeBookingLocks.delete(bookingFingerprint);
  }
}
