/**
 * Gift Ghor Automated Stock & Conversational Inventory Engine
 * Full Gemini AI-Level Intelligent Store Agent for Telegram:
 * - Understands natural human questions, typos, Banglish, Bengali, English
 * - Handles typos in colors: balcj/blck/kalo -> Black, pnk/pik/golapi -> Pink, etc.
 * - Handles aliases: bucket tote/tote bag/hobo -> Bucket Bag, trifold/2in1 -> Trifold Wallet, etc.
 * - Natural Stock Queries: "bucket tote balcj koi piece ache", "daisy pink koyta ache?", "wallet gular stock koto"
 * - Multi-item Category Summaries: "wallet gulaw koi piece ache", "bag gular stock koto"
 * - Restock & Add: "bucket 10 piece add koro", "trifold black 10 ta stock baraw"
 * - Sales Deductions & Orders: "bucket tote balcj 1 piece minus", "daisy 2 pcs sell hoise", "sweetbow 1"
 * - Gemini AI Fallback for open-ended advice, recommendations, and conversational chat
 */

import {
  getSteadfastCredentials,
  getSteadfastBalance,
  querySteadfastTracking,
} from './steadfastService.js';

// Mapping of Bengali numerals to English digits
const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

// Comprehensive bilingual color mapping with common typos and romanizations
export const COLOR_MAP: Record<string, string> = {
  // Black
  black: 'Black',
  balcj: 'Black',
  blck: 'Black',
  blak: 'Black',
  blk: 'Black',
  blackk: 'Black',
  kalo: 'Black',
  calo: 'Black',
  কালো: 'Black',
  ব্ল্যাক: 'Black',

  // Pink
  pink: 'Pink',
  pnk: 'Pink',
  pik: 'Pink',
  pinck: 'Pink',
  pnkk: 'Pink',
  golapi: 'Pink',
  gulapi: 'Pink',
  গোলাপি: 'Pink',
  গোলাপী: 'Pink',
  পিংঙ্ক: 'Pink',
  পিঙ্ক: 'Pink',

  // Blue
  blue: 'Blue',
  blu: 'Blue',
  blew: 'Blue',
  ble: 'Blue',
  nil: 'Blue',
  neel: 'Blue',
  নীল: 'Blue',
  ব্লু: 'Blue',

  // Red
  red: 'Red',
  rd: 'Red',
  lal: 'Red',
  laal: 'Red',
  লাল: 'Red',
  রেড: 'Red',

  // Green
  green: 'Green',
  gren: 'Green',
  grin: 'Green',
  shobuj: 'Green',
  soboj: 'Green',
  sobuj: 'Green',
  সবুজ: 'Green',
  গ্রিন: 'Green',

  // Brown
  brown: 'Brown',
  brwn: 'Brown',
  brwon: 'Brown',
  badami: 'Brown',
  বাদামি: 'Brown',
  বাদামী: 'Brown',
  ব্রাউন: 'Brown',

  // White
  white: 'White',
  wht: 'White',
  whte: 'White',
  shada: 'White',
  sada: 'White',
  সাদা: 'White',
  হোয়াইট: 'White',

  // Purple
  purple: 'Purple',
  purpl: 'Purple',
  beguni: 'Purple',
  baiguni: 'Purple',
  বেগুনি: 'Purple',
  বেগুনী: 'Purple',
  পার্পল: 'Purple',

  // Yellow
  yellow: 'Yellow',
  yello: 'Yellow',
  ylw: 'Yellow',
  holud: 'Yellow',
  হলুদ: 'Yellow',
  ইয়েলো: 'Yellow',

  // Beige
  beige: 'Beige',
  beij: 'Beige',
  biez: 'Beige',
  biej: 'Beige',
  বেইজ: 'Beige',

  // Khaki
  khaki: 'Khaki',
  kaki: 'Khaki',
  khakhi: 'Khaki',
  খাকি: 'Khaki',

  // Grey
  grey: 'Grey',
  gray: 'Grey',
  gry: 'Grey',
  dhusor: 'Grey',
  ধূসর: 'Grey',
  গ্রে: 'Grey',
};

// Special high-priority product keyword mapping table
export const PRODUCT_SPECIAL_KEYWORDS: Array<{ keywords: string[]; productId: string }> = [
  {
    productId: '1015779',
    keywords: [
      'bucket bag', 'bucket', 'bucket tote', 'bucket tote bag', 'buckettote',
      'tote bag', 'tote', 'hobo', 'hobo bag',
      'হবো ব্যাগ', 'হোবো', 'বাকেট', 'বাকেট ব্যাগ', 'টোট ব্যাগ', 'টোট', 'বাকেট টোট'
    ],
  },
  {
    productId: '1015780',
    keywords: [
      'curved flap', 'curved bag', 'curved', 'curv flap',
      'কার্ভড', 'কার্ভড ফ্ল্যাপ', 'কার্ভড ব্যাগ', 'কার্ভ'
    ],
  },
  {
    productId: '945885',
    keywords: [
      'trifold', 'tri fold', '2in1', '2 in 1', '2-in-1', 'trifol', 'trifild',
      'ট্রাইফোল্ড', 'ট্রাই ফোল্ড', '২ইন১', 'টু ইন ওয়ান', 'টুইনওয়ান'
    ],
  },
  {
    productId: '1333107',
    keywords: [
      'daisy', 'daisy wallet', 'daisy flower', 'daisywallet', 'deji',
      'ডেইজি', 'ডেজি', 'ডেইজী'
    ],
  },
  {
    productId: '1333100',
    keywords: [
      'sweet bow', 'sweetbow', 'sweet bo', 'sweetbow wallet',
      'সুইট বো', 'সুইটবো'
    ],
  },
  {
    productId: '1328434',
    keywords: [
      'golden bow', 'goldenbow', 'gold bow', 'metal buckle bow',
      'গোল্ডেন বো', 'মেটাল বো'
    ],
  },
  {
    productId: '1328410',
    keywords: [
      'rabbit', 'bunny', 'rabit', 'rabbit wallet', 'bunny wallet',
      'খরগোশ', 'র‍্যাবিট', 'রাবিট', 'বানি'
    ],
  },
  {
    productId: '1330754',
    keywords: [
      'sunflower', 'sun flower', 'sunflower wallet',
      'সূর্যমুখী', 'সানফ্লাওয়ার', 'সানফ্লাওয়ার', 'সান ফ্লাওয়ার'
    ],
  },
  {
    productId: '1333092',
    keywords: [
      'cat', 'cat embroidery', 'cat wallet',
      'বিড়াল', 'ক্যাট', 'কেট'
    ],
  },
  {
    productId: '1337015',
    keywords: [
      'bear and bunny', 'bear & bunny', 'bear bunny',
      'ভাল্লুক খরগোশ', 'বেয়ার বানি'
    ],
  },
  {
    productId: '1330560',
    keywords: [
      'bear & paw', 'bear and paw', 'bear paw', 'paw print',
      'প', 'ভাল্লুক', 'বেয়ার প'
    ],
  },
  {
    productId: '1337004',
    keywords: [
      'vanity bag', 'vanity', 'sling bag', 'casual sling',
      'ভ্যানিটি', 'ভ্যানিটি ব্যাগ', 'স্লিং ব্যাগ'
    ],
  },
  {
    productId: '1330759',
    keywords: [
      'baguette', 'baguette handbag', 'vintage leather shoulder bag',
      'ব্যাগুট', 'শোল্ডার ব্যাগ'
    ],
  },
  {
    productId: '1337043',
    keywords: [
      'embossed floral', 'embossed', 'long leather', 'clutch purse',
      'লং ওয়ালেট', 'এমবসড'
    ],
  },
  {
    productId: '1330748',
    keywords: [
      'flower print', 'flower mini', 'cute flower print',
      'ফ্লাওয়ার প্রিন্ট', 'ফ্লাওয়ার প্রিন্ট'
    ],
  },
  {
    productId: '1328420',
    keywords: [
      'removable card', 'removable card holder', 'card holder wallet',
      'রিমুভেবল কার্ড'
    ],
  },
  {
    productId: 'love_forever',
    keywords: [
      'love forever', 'wish pearl gift box', 'pearl gift box', 'red rose box', 'rose box', 'pearl box',
      'উইশ পার্ল', 'পার্ল গিফট বক্স', 'রোজ বক্স', 'লাভ ফরএভার'
    ],
  },
  {
    productId: 'pearl_3467',
    keywords: [
      'wish pearl', 'love pearl', 'oyster pearl', 'pearl necklace', 'pearl set',
      'পার্ল নেকলেস', 'উইশ পার্ল নেকলেস'
    ],
  },
];

export function convertBengaliDigits(text: string): string {
  return (text || '').replace(/[০-৯]/g, (match) => BENGALI_TO_ENGLISH_DIGITS[match] || match);
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
    const lineDigits = line.replace(/[^0-9]/g, '');
    const normalizedLineDigits = lineDigits.startsWith('880') ? lineDigits.slice(2) : (lineDigits.startsWith('88') ? lineDigits.slice(2) : lineDigits);
    if (normalizedLineDigits.length === 11 && normalizedLineDigits.startsWith('01')) {
      return normalizedLineDigits;
    }

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

export function cleanText(str: string): string {
  return convertBengaliDigits(str || '')
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts color token and returns the normalized English color name
 * along with the text stripped of the color token
 */
export function extractColor(rawText: string): { color: string | null; textWithoutColor: string } {
  if (!rawText) return { color: null, textWithoutColor: '' };

  const tokens = rawText.split(/[\s,.:;_\-\/]+/);
  let foundColor: string | null = null;
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    const cleanToken = token.trim().toLowerCase();
    if (!foundColor && COLOR_MAP[cleanToken]) {
      foundColor = COLOR_MAP[cleanToken];
    } else {
      remainingTokens.push(token);
    }
  }

  return {
    color: foundColor,
    textWithoutColor: remainingTokens.join(' ').trim(),
  };
}

export interface StockDeductionResult {
  success: boolean;
  product?: any;
  variantColor?: string;
  previousVariantStock?: number;
  newVariantStock?: number;
  previousStock: number;
  newStock: number;
  deductedQuantity: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  message: string;
  alertText?: string;
  orderNumber?: string;
}

/**
 * Smart product matching algorithm:
 * 1. Checks special high-priority keyword table (e.g. 'bucket tote', 'trifold', 'daisy', 'sunflower')
 * 2. Checks direct Product ID
 * 3. Checks exact title match
 * 4. Checks substring & token overlap
 */
export function matchProduct(query: string, products: any[]): { product: any; score: number } | null {
  if (!query || !products || products.length === 0) return null;

  // Extract color if present in the query and strip it for product matching
  const { textWithoutColor } = extractColor(query);
  const targetQuery = textWithoutColor || query;

  let cleanQuery = cleanText(targetQuery);
  if (!cleanQuery) return null;

  cleanQuery = cleanQuery.replace(/^(?:product|prod|item|আইটেম|পণ্য)\s+/i, '').trim();

  // 1. Check special keywords table first
  for (const entry of PRODUCT_SPECIAL_KEYWORDS) {
    if (entry.keywords.some((kw) => cleanQuery.includes(kw) || cleanQuery.replace(/\s+/g, '').includes(kw.replace(/\s+/g, '')))) {
      const p = products.find((prod) => String(prod.id) === entry.productId || (entry.productId === 'love_forever' && prod.id.includes('love')) || (entry.productId === 'pearl_3467' && prod.id.includes('pearl')));
      if (p) return { product: p, score: 100 };
    }
  }

  // 2. Direct ID match
  const idMatch = products.find((p) => String(p.id) === cleanQuery.trim());
  if (idMatch) return { product: idMatch, score: 100 };

  const queryNoSpace = cleanQuery.replace(/\s+/g, '');
  const queryWords = cleanQuery.split(' ').filter((w) => w.length > 1);

  let bestProduct: any = null;
  let highestScore = 0;

  for (const prod of products) {
    const cleanTitle = cleanText(prod.title || '');
    const titleNoSpace = cleanTitle.replace(/\s+/g, '');
    let score = 0;

    // Exact title match
    if (cleanTitle === cleanQuery || titleNoSpace === queryNoSpace) {
      return { product: prod, score: 100 };
    }

    // Direct substring in title
    if (cleanTitle.includes(cleanQuery)) {
      score = Math.max(score, 85 + (cleanQuery.length / Math.max(cleanTitle.length, 1)) * 15);
    }

    // No-space substring in title (handles 'daisy' in 'cutedaisyflower...')
    if (titleNoSpace.includes(queryNoSpace)) {
      score = Math.max(score, 80 + (queryNoSpace.length / Math.max(titleNoSpace.length, 1)) * 20);
    }

    // Title keywords inside query
    const titleWords = cleanTitle.split(' ').filter((w) => w.length > 2);
    let matchedKeywords = 0;
    for (const tWord of titleWords) {
      if (cleanQuery.includes(tWord) || queryNoSpace.includes(tWord)) {
        if (['wallet', 'bag', 'purse', 'cute', 'mini', 'ladies', 'women', 'for', 'leather'].includes(tWord)) {
          matchedKeywords += 1;
        } else {
          matchedKeywords += 3;
        }
      }
    }

    if (matchedKeywords >= 3) {
      score = Math.max(score, 70 + matchedKeywords * 6);
    }

    // Query words matching title words
    let matchedWordCount = 0;
    for (const qWord of queryWords) {
      if (titleWords.some((tWord) => tWord.includes(qWord) || qWord.includes(tWord))) {
        matchedWordCount++;
      }
    }
    if (matchedWordCount > 0) {
      score = Math.max(score, (matchedWordCount / Math.max(queryWords.length, 1)) * 75);
    }

    if (score > highestScore && score >= 40) {
      highestScore = score;
      bestProduct = prod;
    }
  }

  if (bestProduct && highestScore >= 40) {
    return { product: bestProduct, score: highestScore };
  }

  return null;
}

/**
 * Deducts stock for a product (and specific color variant if specified),
 * updates stockStatus, saves to DB, and generates low stock alerts.
 */
export function deductStock(
  productIdOrTitle: string,
  quantityToDeduct: number,
  db: any,
  saveDB: (db: any) => void,
  meta?: {
    variantColor?: string;
    source?: 'telegram_group' | 'website' | 'chatbot' | 'admin_manual';
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    senderName?: string;
  }
): StockDeductionResult {
  const qty = Math.max(1, Math.floor(quantityToDeduct || 1));
  const products = db.products || [];

  // If color not in meta, check if it was in the query
  let color = meta?.variantColor;
  if (!color) {
    const extracted = extractColor(productIdOrTitle);
    if (extracted.color) {
      color = extracted.color;
    }
  }

  const match = matchProduct(productIdOrTitle, products);
  if (!match || !match.product) {
    return {
      success: false,
      previousStock: 0,
      newStock: 0,
      deductedQuantity: qty,
      isLowStock: false,
      isOutOfStock: false,
      message: `পণ্য "${productIdOrTitle}" খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক পণ্যের নাম দিন।`,
    };
  }

  const product = match.product;
  const previousTotalStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 25;
  const threshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 3;

  let prevVariantStock: number | undefined;
  let newVariantStock: number | undefined;

  // Handle color variant deduction if specified
  if (color) {
    if (!product.colorVariants) {
      product.colorVariants = {};
    }

    let matchedColorKey = Object.keys(product.colorVariants).find(
      (k) => k.toLowerCase() === color!.toLowerCase()
    );

    if (!matchedColorKey) {
      matchedColorKey = color;
      product.colorVariants[matchedColorKey] = Math.max(0, Math.floor(previousTotalStock / 2));
    }

    prevVariantStock = product.colorVariants[matchedColorKey] ?? 0;
    newVariantStock = Math.max(0, prevVariantStock - qty);
    product.colorVariants[matchedColorKey] = newVariantStock;

    // Recalculate total stock from all variants
    let totalFromVariants = 0;
    for (const vQty of Object.values(product.colorVariants)) {
      totalFromVariants += Number(vQty) || 0;
    }
    product.stockQuantity = totalFromVariants;
  } else {
    product.stockQuantity = Math.max(0, previousTotalStock - qty);
  }

  const newTotalStock = product.stockQuantity;

  // Sync stockStatus
  if (newTotalStock === 0) {
    product.stockStatus = 'out_of_stock';
  } else if (newTotalStock <= threshold) {
    product.stockStatus = 'low_stock';
  } else {
    product.stockStatus = 'in_stock';
  }

  // Create captured order record so order appears in Admin Dashboard
  let orderNumber: string | undefined;
  if (meta) {
    orderNumber = 'GG-' + Math.floor(10000 + Math.random() * 90000);
    const orderId = 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const productNameWithVariant = color ? `${product.title} (${color})` : product.title;

    if (!db.orders) db.orders = {};
    db.orders[orderId] = {
      id: orderId,
      orderNumber,
      customerName: meta.customerName || `Customer (${meta.senderName || 'Team Order'})`,
      customerPhone: meta.customerPhone || 'N/A',
      customerAddress: meta.customerAddress || 'Direct / Group Order',
      productName: productNameWithVariant,
      quantity: qty,
      codAmount: (product.price || 0) * qty,
      deliveryLocation: 'inside_dhaka',
      deliveryCharge: db.deliveryPolicy?.insideDhakaCost || 70,
      totalAmount: (product.price || 0) * qty + (db.deliveryPolicy?.insideDhakaCost || 70),
      status: 'confirmed',
      source: meta.source || 'telegram_group',
      notes: `অর্ডার এন্ট্রি করেছেন: ${meta.senderName || 'Staff'} (Telegram)${color ? ` | Color: ${color}` : ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Save changes synchronously to disk & async Firestore
  saveDB(db);

  const isLowStock = newTotalStock > 0 && newTotalStock <= threshold;
  const isOutOfStock = newTotalStock === 0;
  const isVariantLow = color && prevVariantStock !== undefined && newVariantStock !== undefined && newVariantStock <= 2;

  let alertText: string | undefined;
  if (isOutOfStock) {
    alertText =
      `🚨 <b>আউট অব স্টক অ্যালার্ট (OUT OF STOCK)!</b>\n\n` +
      `📦 <b>প্রোডাক্ট:</b> ${product.title}\n` +
      `❌ <b>বর্তমান অবশিষ্ট মোট স্টক:</b> <b>০ (শূন্য) পিস!</b>\n` +
      `💰 <b>মূল্য:</b> ৳${product.price} BDT\n\n` +
      `⚠️ <i>এই পণ্যটির স্টক সম্পূর্ণ শেষ হয়ে গেছে। ওয়েবসাইট চ্যাটবট এখন এটিকে আউট অব স্টক হিসেবে প্রদর্শন করবে। দ্রুত নতুন স্টক রিস্টক করুন!</i>`;
  } else if (isVariantLow) {
    alertText =
      `⚠️ <b>কালার ভ্যারিয়েন্ট লো-স্টক অ্যালার্ট!</b>\n\n` +
      `📦 <b>প্রোডাক্ট:</b> ${product.title}\n` +
      `🎨 <b>কালার:</b> <b>${color}</b>\n` +
      `🔢 <b>এই কালারের অবশিষ্ট স্টক:</b> মাত্র <b>${newVariantStock}টি</b> বাকি আছে!\n` +
      `📊 <b>মোট প্রোডাক্ট স্টক:</b> ${newTotalStock} pcs\n\n` +
      `📢 <i>${color} ভ্যারিয়েন্টের স্টক শেষের পথে। দ্রুত রিস্টক করুন।</i>`;
  } else if (isLowStock) {
    alertText =
      `⚠️ <b>লো-স্টক সতর্কবার্তা (LOW STOCK ALERT)!</b>\n\n` +
      `📦 <b>প্রোডাক্ট:</b> ${product.title}\n` +
      `🔢 <b>বর্তমান অবশিষ্ট মোট স্টক:</b> মাত্র <b>${newTotalStock}টি</b> বাকি আছে!\n` +
      `📉 <b>সতর্কবার্তা সীমা:</b> ${threshold} pcs\n` +
      `💰 <b>মূল্য:</b> ৳${product.price} BDT\n\n` +
      `📢 <i>স্টক খুব শীঘ্রই শেষ হতে চলেছে। এখনই সাপ্লায়ার থেকে রিস্টক করুন।</i>`;
  }

  return {
    success: true,
    product,
    variantColor: color,
    previousVariantStock: prevVariantStock,
    newVariantStock,
    previousStock: previousTotalStock,
    newStock: newTotalStock,
    deductedQuantity: qty,
    isLowStock,
    isOutOfStock,
    message: `সফলভাবে স্টক মাইনাস হয়েছে। পূর্ববর্তী স্টক: ${previousTotalStock}, বর্তমান স্টক: ${newTotalStock}${color ? ` (${color}: ${newVariantStock} pcs)` : ''}`,
    alertText,
    orderNumber,
  };
}

/**
 * Adds or sets stock quantity directly (including color variants)
 */
export function updateStockQuantity(
  productIdOrTitle: string,
  quantity: number,
  mode: 'add' | 'set',
  db: any,
  saveDB: (db: any) => void,
  color?: string
): {
  success: boolean;
  product?: any;
  variantColor?: string;
  previousVariantStock?: number;
  newVariantStock?: number;
  previousStock: number;
  newStock: number;
  message: string;
} {
  const products = db.products || [];
  const match = matchProduct(productIdOrTitle, products);

  if (!match || !match.product) {
    return {
      success: false,
      previousStock: 0,
      newStock: 0,
      message: `প্রোডাক্ট "${productIdOrTitle}" খুঁজে পাওয়া যায়নি।`,
    };
  }

  const product = match.product;
  const previousTotalStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 25;
  const threshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 3;

  let prevVarQty: number | undefined;
  let newVarQty: number | undefined;

  if (color) {
    if (!product.colorVariants) product.colorVariants = {};
    let matchedColorKey = Object.keys(product.colorVariants).find(
      (k) => k.toLowerCase() === color.toLowerCase()
    );
    if (!matchedColorKey) {
      matchedColorKey = color;
      product.colorVariants[matchedColorKey] = 0;
    }

    prevVarQty = product.colorVariants[matchedColorKey] || 0;
    newVarQty = mode === 'add' ? Math.max(0, prevVarQty + quantity) : Math.max(0, quantity);
    product.colorVariants[matchedColorKey] = newVarQty;

    let totalFromVariants = 0;
    for (const vQty of Object.values(product.colorVariants)) {
      totalFromVariants += Number(vQty) || 0;
    }
    product.stockQuantity = totalFromVariants;
  } else {
    product.stockQuantity = mode === 'add' ? Math.max(0, previousTotalStock + quantity) : Math.max(0, quantity);
  }

  const newTotalStock = product.stockQuantity;

  if (newTotalStock === 0) {
    product.stockStatus = 'out_of_stock';
  } else if (newTotalStock <= threshold) {
    product.stockStatus = 'low_stock';
  } else {
    product.stockStatus = 'in_stock';
  }

  saveDB(db);

  return {
    success: true,
    product,
    variantColor: color,
    previousVariantStock: prevVarQty,
    newVariantStock: newVarQty,
    previousStock: previousTotalStock,
    newStock: newTotalStock,
    message: `স্টক আপডেট হয়েছে। বর্তমান মোট স্টক: ${newTotalStock} pcs${color ? ` (${color}: ${newVarQty} pcs)` : ''}।`,
  };
}

/**
 * Returns formatted executive stock query details for a specific product & color
 */
export function formatProductStockQuery(product: any, requestedColor?: string): string {
  const totalStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 25;
  const threshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 3;
  const variants = product.colorVariants || {};

  let text = `📦 <b>${product.title}</b>-এর লাইভ স্টক হিসাব:\n\n`;

  if (requestedColor) {
    let matchedKey = Object.keys(variants).find((k) => k.toLowerCase() === requestedColor.toLowerCase());
    const varQty = matchedKey ? (variants[matchedKey] ?? 0) : null;

    if (varQty !== null) {
      const isOut = varQty === 0;
      const isLow = varQty > 0 && varQty <= 2;
      text += `🎨 <b>কালার ভ্যারিয়েন্ট:</b> <b>${requestedColor}</b>\n`;
      text += `🔢 <b>স্টক পরিমাণ:</b> ${isOut ? '❌ <b>০ (স্টক নেই)</b>' : (isLow ? `⚠️ <b>মাত্র ${varQty}টি বাকি!</b>` : `🟢 <b>${varQty} pcs স্টকে আছে</b>`)}\n\n`;
    }
  }

  text += `📊 <b>মোট প্রোডাক্ট স্টক:</b> <b>${totalStock} pcs</b>\n`;

  if (Object.keys(variants).length > 0) {
    text += `🎨 <b>কালার অনুযায়ী লাইভ স্টক:</b>\n`;
    for (const [col, cQty] of Object.entries(variants)) {
      const icon = Number(cQty) === 0 ? '🔴' : (Number(cQty) <= 2 ? '🟠' : '🟢');
      text += `  ${icon} ${col}: <b>${cQty} pcs</b>\n`;
    }
  }

  text += `\n💰 <b>মূল্য:</b> ৳${product.price} BDT\n`;
  text += `📈 <b>স্ট্যাটাস:</b> ${totalStock === 0 ? '❌ আউট অব স্টক' : (totalStock <= threshold ? '⚠️ স্টক শেষের পথে' : '🟢 পর্যাপ্ত স্টকে আছে')}`;

  return text;
}

/**
 * Formats a category overview report (e.g. all wallets or all bags)
 */
export function formatCategoryOverview(categoryType: 'wallet' | 'bag' | 'gift', products: any[]): string {
  const isWallet = categoryType === 'wallet';
  const isBag = categoryType === 'bag';

  const matched = products.filter((p) => {
    const title = p.title.toLowerCase();
    if (isWallet) return title.includes('wallet') || title.includes('purse') || title.includes('clutch') || title.includes('trifold');
    if (isBag) return title.includes('bag') || title.includes('bucket') || title.includes('tote') || title.includes('vanity') || title.includes('baguette') || title.includes('flap');
    return title.includes('gift') || title.includes('pearl') || title.includes('rose');
  });

  const catName = isWallet ? '👛 সমস্ত ওয়ালেট (Wallets)' : (isBag ? '👜 সমস্ত ব্যাগ (Bags)' : '🎁 গিফট বক্স ও সেট');
  let text = `📊 <b>GIFT GHOR ${catName} লাইভ স্টক হিসাব:</b>\n`;
  text += `⏰ <i>${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })} BST</i>\n\n`;

  for (const p of matched) {
    const qty = typeof p.stockQuantity === 'number' ? p.stockQuantity : 25;
    const variants = p.colorVariants || {};
    let varStr = '';
    if (Object.keys(variants).length > 0) {
      varStr = ' [' + Object.entries(variants).map(([c, q]) => `${c}: ${q}`).join(', ') + ']';
    }
    const icon = qty === 0 ? '🔴' : (qty <= 3 ? '🟠' : '🟢');
    text += `${icon} <b>${p.title}</b>: <b>${qty} pcs</b> | ৳${p.price}${varStr}\n\n`;
  }

  return text;
}

/**
 * Generates an executive live inventory report for Telegram with color variant breakdown
 */
export function generateStockReport(products: any[]): string {
  if (!products || products.length === 0) {
    return '📦 ক্যাটালগে বর্তমানে কোনো প্রোডাক্ট সংরক্ষিত নেই।';
  }

  const inStock: any[] = [];
  const lowStock: any[] = [];
  const outOfStock: any[] = [];

  for (const p of products) {
    const qty = typeof p.stockQuantity === 'number' ? p.stockQuantity : 25;
    const threshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 3;

    if (qty === 0) {
      outOfStock.push({ ...p, qty, threshold });
    } else if (qty <= threshold) {
      lowStock.push({ ...p, qty, threshold });
    } else {
      inStock.push({ ...p, qty, threshold });
    }
  }

  let text = `📊 <b>GIFT GHOR লাইভ ইনভেন্টরি ও কালার স্টক রিপোর্ট</b>\n`;
  text += `⏰ <i>${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST</i>\n\n`;

  if (lowStock.length > 0) {
    text += `⚠️ <b>স্টক শেষের পথে (LOW STOCK ALERTS):</b>\n`;
    for (const p of lowStock) {
      let varStr = '';
      if (p.colorVariants && Object.keys(p.colorVariants).length > 0) {
        varStr = ' [' + Object.entries(p.colorVariants).map(([c, q]) => `${c}: ${q}`).join(', ') + ']';
      }
      text += `• <b>${p.title}</b>: <b>${p.qty} pcs</b> (সীমা: ${p.threshold})${varStr} - ৳${p.price}\n`;
    }
    text += `\n`;
  }

  if (outOfStock.length > 0) {
    text += `❌ <b>আউট অব স্টক (স্টক শূন্য):</b>\n`;
    for (const p of outOfStock) {
      text += `• ${p.title}: <b>০ পিস</b> ❌\n`;
    }
    text += `\n`;
  }

  text += `🟢 <b>ইন-স্টক প্রোডাক্ট (${inStock.length}টি):</b>\n`;
  for (const p of inStock) {
    let varStr = '';
    if (p.colorVariants && Object.keys(p.colorVariants).length > 0) {
      varStr = ' [' + Object.entries(p.colorVariants).map(([c, q]) => `${c}: ${q}`).join(', ') + ']';
    }
    text += `• ${p.title}: <b>${p.qty} pcs</b>${varStr} | ৳${p.price}\n`;
  }

  text += `\n💡 <i>স্টক জানতে লিখুন: <code>bucket tote balcj koi piece ache</code> বা <code>trifold black stock koto?</code> | মাইনাস করতে: <code>daisy 2 pcs</code></i>`;

  return text;
}

const STOCK_QUERY_STOPWORDS = [
  'er', 'ar', 'এর', 'stock', 'স্টক', 'koto', 'কত', 'ache', 'আছে', 'kina', 'কিনা',
  'koyta', 'কয়টা', 'কয়টা', 'koi', 'koi piece', 'koita', 'koi ta', 'koy piece', 'koto piece',
  'baki', 'বাকি', 'piece', 'pcs', 'pic', 'pis', 'পিস', 'ta', 'টা', 'ti', 'টি', 'n', 'ki',
  'check', 'চেক', 'bolo', 'বল', 'বলো', 'dekho', 'দেখো', 'koto gulo', 'how many', 'available', 'status'
];

/**
 * Strips stock query noise words to isolate the product and color query
 */
export function cleanStockQueryTarget(text: string): string {
  let cleaned = text.replace(/[?.,!]+/g, ' ');
  for (const sw of STOCK_QUERY_STOPWORDS) {
    const reg = new RegExp('(?:^|[\\s_\\-])' + sw + '(?:$|[\\s_\\-])', 'gi');
    cleaned = cleaned.replace(reg, ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Master Human-Like Conversational Message Parser & Processor
 * Acts like a full chatbot (Gemini-style):
 * - Understands natural questions ("bucket tote balcj koi piece ache", "wallet gular stock koto")
 * - Handles typos seamlessly
 * - Performs instant stock deductions and adds
 * - Provides conversational chatbot replies for general queries
 */
export async function processConversationalStockMessage(
  rawText: string,
  products: any[],
  db: any,
  saveDB: (db: any) => void,
  meta: { senderName: string },
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
): Promise<{
  handled: boolean;
  replyText?: string;
}> {
  let text = convertBengaliDigits(rawText || '').trim();
  if (!text) return { handled: false };

  // Strip leading slash if not a reserved command like /help, /start, etc.
  if (
    text.startsWith('/') &&
    !text.match(/^\/(?:stock|stocklist|inventory|addstock|setstock|help|start|reply|r)\b/i)
  ) {
    text = text.substring(1).trim();
  }

  // 1. Live stock report command (/stock, /inventory)
  if (text.match(/^\/(?:stock|stocklist|inventory)\b/i)) {
    return {
      handled: true,
      replyText: generateStockReport(products),
    };
  }

  // 2. Direct /addstock or /setstock command
  const explicitStockCmd = text.match(/^\/(addstock|setstock)(?:@\w+)?\s+(.+?)\s+(\d+)\s*$/i);
  if (explicitStockCmd) {
    const mode = explicitStockCmd[1].toLowerCase() === 'addstock' ? 'add' : 'set';
    const query = explicitStockCmd[2].trim();
    const qty = parseInt(explicitStockCmd[3], 10);
    const { color, textWithoutColor } = extractColor(query);

    const res = updateStockQuantity(textWithoutColor || query, qty, mode, db, saveDB, color || undefined);
    if (res.success) {
      return {
        handled: true,
        replyText:
          `✅ <b>স্টক আপডেট সম্পন্ন!</b>\n\n` +
          `📦 <b>প্রোডাক্ট:</b> ${res.product.title}\n` +
          (color ? `🎨 <b>কালার:</b> <b>${color}</b> (${res.newVariantStock} pcs)\n` : '') +
          `🔢 <b>${mode === 'add' ? 'যোগ করা পরিমাণ' : 'নতুন নির্ধারিত স্টক'}:</b> ${qty} pcs\n` +
          `📊 <b>বর্তমান মোট স্টক:</b> <b>${res.newStock} pcs</b>\n` +
          `👤 <b>আপডেট করেছেন:</b> ${meta.senderName}\n\n` +
          `💾 <i>ডাটাবেজ ও ক্লাউডে সফলভাবে সেভ হয়েছে।</i>`,
      };
    } else {
      return { handled: true, replyText: `⚠️ <b>স্টক আপডেট করা যায়নি:</b> ${res.message}` };
    }
  }

  // Detect Conversational Intent
  const lowerText = text.toLowerCase();

  // 0. Courier & Tracking Intent (Steadfast Courier Integration)
  if (/(?:courier|tracking|track|steadfast|কুরিয়ার|ট্র্যাকিং|পার্সেল)/i.test(lowerText)) {
    const creds = getSteadfastCredentials(db.adminSettings);
    // If asking about balance or general status
    if (
      /(?:balance|ব্যালেন্স|status|update|আপডেট|রিপোর্ট|overview)/i.test(lowerText) ||
      lowerText.trim() === 'courier' ||
      lowerText.trim() === 'steadfast' ||
      lowerText.trim() === 'tracking'
    ) {
      const orders = Object.values(db.orders || {}) as any[];
      const bookedOrders = orders.filter(
        (o) => o.status === 'steadfast_booked' || o.steadfastConsignmentId || o.steadfastTrackingCode
      );
      const deliveredOrders = orders.filter((o) => o.status === 'delivered');
      let balanceText = 'ব্যালেন্স দেখতে এপিআই কি প্রয়োজন';
      if (creds) {
        const balRes = await getSteadfastBalance(creds);
        if (balRes.success) balanceText = `৳${balRes.balance} BDT`;
      }
      return {
        handled: true,
        replyText:
          `🚚 <b>Steadfast Courier লাইভ স্ট্যাটাস ও ট্র্যাকিং:</b>\n\n` +
          `💰 <b>কুরিয়ার ব্যালেন্স:</b> <b>${balanceText}</b>\n` +
          `📦 <b>মোট কুরিয়ারে বুকড অর্ডার:</b> <b>${bookedOrders.length}টি</b>\n` +
          `✅ <b>ডেলিভারি সম্পন্ন:</b> <b>${deliveredOrders.length}টি</b>\n\n` +
          `💡 <i>যেকোনো অর্ডার ট্র্যাক করতে লিখুন: <code>track GG-1001</code> বা <code>courier &lt;TrackingCode&gt;</code></i>`,
      };
    }

    // Specific order tracking
    const codeMatch =
      text.match(/(?:track|courier|steadfast)\s+([a-zA-Z0-9\-_]+)/i) ||
      text.match(/(GG-\d+)/i) ||
      text.match(/(01[3-9]\d{8})/);

    if (codeMatch) {
      const targetQuery = codeMatch[1].trim();
      const orders = Object.values(db.orders || {}) as any[];
      const matchedOrder = orders.find(
        (o) =>
          o.orderNumber?.toLowerCase() === targetQuery.toLowerCase() ||
          o.steadfastConsignmentId === targetQuery ||
          o.steadfastTrackingCode?.toLowerCase() === targetQuery.toLowerCase() ||
          o.customerPhone === targetQuery
      );

      if (matchedOrder) {
        let liveTracking = matchedOrder.steadfastDeliveryStatus || matchedOrder.status;
        if (
          creds &&
          (matchedOrder.steadfastConsignmentId || matchedOrder.steadfastTrackingCode || matchedOrder.orderNumber)
        ) {
          const res = await querySteadfastTracking(
            {
              consignmentId: matchedOrder.steadfastConsignmentId,
              trackingCode: matchedOrder.steadfastTrackingCode,
              invoice: matchedOrder.orderNumber,
            },
            creds
          );
          if (res.success) {
            liveTracking = res.statusTextBangla;
          }
        }
        const trackingTarget = matchedOrder.steadfastTrackingCode || matchedOrder.steadfastConsignmentId;
        const trackingUrl = trackingTarget
          ? `https://steadfast.com.bd/tracking?q=${encodeURIComponent(trackingTarget)}`
          : 'https://steadfast.com.bd/tracking';

        return {
          handled: true,
          replyText:
            `🚚 <b>Steadfast Courier অর্ডার ট্র্যাকিং:</b>\n\n` +
            `🆔 <b>অর্ডার নম্বর:</b> <code>${matchedOrder.orderNumber}</code>\n` +
            `👤 <b>গ্রাহক:</b> ${matchedOrder.customerName} (${matchedOrder.customerPhone})\n` +
            `📦 <b>পণ্য:</b> ${matchedOrder.productName} (Qty: ${matchedOrder.quantity})\n` +
            `💵 <b>COD পরিমাণ:</b> ৳${matchedOrder.totalAmount || matchedOrder.codAmount} BDT\n` +
            `📍 <b>লাইভ কুরিয়ার স্ট্যাটাস:</b> <b>${liveTracking}</b>\n` +
            (matchedOrder.steadfastTrackingCode
              ? `🔢 <b>Tracking ID:</b> <code>${matchedOrder.steadfastTrackingCode}</code>\n`
              : '') +
            `🔗 <b>লাইভ ট্র্যাকিং লিংক:</b> ${trackingUrl}`,
        };
      }
    }
  }

  // Multi-item category check: "wallet gulaw koi piece ache", "wallet gular stock koto", "bag gular stock koto"
  if (
    /(?:wallet|wallets|ওয়ালেট|ওয়ালেট).*(?:gula|gulaw|gulo|সব|সকল|list|stock|কয়টা|কয়টা|কত)/i.test(lowerText) ||
    /(?:সব|সকল|list|stock|কয়টা|কয়টা|কত).*(?:wallet|wallets|ওয়ালেট|ওয়ালেট)/i.test(lowerText)
  ) {
    return {
      handled: true,
      replyText: formatCategoryOverview('wallet', products),
    };
  }

  if (
    /(?:bag|bags|ব্যাগ).*(?:gula|gulaw|gulo|সব|সকল|list|stock|কয়টা|কয়টা|কত)/i.test(lowerText) ||
    /(?:সব|সকল|list|stock|কয়টা|কয়টা|কত).*(?:bag|bags|ব্যাগ)/i.test(lowerText)
  ) {
    return {
      handled: true,
      replyText: formatCategoryOverview('bag', products),
    };
  }

  const isAddIntent = /(?:add|যোগ|যোগ\s*করো|baraw|barao|barano|বাড়াও|বাড়বে|প্লাস|plus|\+|restock|রিস্টক|duklo|dhuklo|ঢুকলো|আসলো|এসেছে)/i.test(lowerText);
  const isDeductIntent = /(?:minus|মাইনাস|bad|বাদ|বাদ\s*দাও|komaw|komao|koman|komano|কমবে|কমাও|gelo|geche|গেছে|গেলো|sell|সেল|order|অর্ডার|বিক্রি|deduct)/i.test(lowerText);

  // If text asks question OR simply mentions a product/color without add/minus action -> It is a Stock Query!
  const hasQueryPhrases = /(?:stock\s*koto|koto\s*ache|koto\s*piece|koyta\s*ache|koyta\s*baki|koi\s*piece|koi\s*ta|koita|koi\s*baki|koy\s*piece|koto\s*piece|ache\s*kina|baki\s*ache|check\s*stock|stock\s*check|স্টক\s*কত|কয়টা\s*আছে|কয়টা\s*আছে|কয়টা\s*বাকি|কত\s*পিস|কয়\s*পিস|কয়\s*পিস|স্টক\s*আছে|কয়টা\s*স্টক|কত\s*আছে|কতো\s*আছে|\?)/i.test(lowerText);
  const isQueryIntent =
    hasQueryPhrases ||
    (!isAddIntent && !isDeductIntent && matchProduct(cleanStockQueryTarget(text), products) !== null);

  // -------------------------------------------------------------
  // ACTION 1: STOCK QUERY (নির্দিষ্ট প্রোডাক্ট বা কালারের স্টক জানতে চাওয়া)
  // e.g. "bucket tote balcj koi piece ache", "bucket tote bag koi piece ache", "daisy pink koyta ache?"
  // -------------------------------------------------------------
  if (isQueryIntent && !isAddIntent && !isDeductIntent) {
    const { color: queryColor, textWithoutColor } = extractColor(text);
    const cleanedTarget = cleanStockQueryTarget(textWithoutColor || text);

    const match = matchProduct(cleanedTarget, products);
    if (match && match.product) {
      return {
        handled: true,
        replyText: formatProductStockQuery(match.product, queryColor || undefined),
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 2: STOCK ADD / RESTOCK (স্টক বাড়ানো বা যোগ করা)
  // e.g. "daisy 20 piece add koro", "trifold black 10 ta stock baraw", "bucket 10 add"
  // -------------------------------------------------------------
  if (isAddIntent && !isDeductIntent) {
    const { color, textWithoutColor } = extractColor(text);
    const qtyMatch = text.match(/(\d+)\s*(?:pcs|pc|টা|টি|পিস)?/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    let prodText = (textWithoutColor || text)
      .replace(/(\d+)\s*(?:pcs|pc|টা|টি|পিস)?/, ' ')
      .replace(/(?:add|যোগ|যোগ\s*করো|baraw|barao|barano|বাড়াও|বাড়বে|প্লাস|plus|\+|restock|রিস্টক|duklo|dhuklo|ঢুকলো|আসলো|এসেছে|koro|করো|te|তে|aro|আরো|stock|স্টক)/gi, ' ')
      .trim();

    const match = matchProduct(prodText, products);
    if (match && match.product) {
      const res = updateStockQuantity(match.product.id, qty, 'add', db, saveDB, color || undefined);
      return {
        handled: true,
        replyText:
          `✅ <b>স্টক সফলভাবে বৃদ্ধি করা হয়েছে! (Stock Restocked)</b>\n\n` +
          `📦 <b>প্রোডাক্ট:</b> ${res.product.title}\n` +
          (color ? `🎨 <b>কালার ভ্যারিয়েন্ট:</b> <b>${color}</b> (+${qty} pcs)\n🔢 <b>${color}-এর নতুন স্টক:</b> <b>${res.newVariantStock} pcs</b>\n` : `➕ <b>যোগ করা পরিমাণ:</b> ${qty} pcs\n`) +
          `📊 <b>মোট প্রোডাক্ট স্টক:</b> <b>${res.newStock} pcs</b>\n` +
          `👤 <b>আপডেট করেছেন:</b> ${meta.senderName}\n\n` +
          `💾 <i>ক্লাউড ও ডাটাবেজে রিয়েল-টাইমে সংরক্ষিত হয়েছে।</i>`,
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 3: STOCK DEDUCT / ORDER (অর্ডার কাটা বা স্টক মাইনাস করা)
  // Handles:
  // - "bucket tote balcj 1 piece minus"
  // - "sweet bow blue 2 ta sell hoise"
  // - "daisy wallet 2 piece minus koro"
  // - "trifold black 1 ta komaw"
  // - "2 in 1 trifold wallet black 2 pcs"
  // -------------------------------------------------------------
  const parsedOrder = await parseTelegramOrderMessage(text, products, callAI);
  if (parsedOrder.isOrder && parsedOrder.items && parsedOrder.items.length > 0) {
    const deductions: Array<{ res: StockDeductionResult; item: any }> = [];
    let allSuccess = true;

    for (const it of parsedOrder.items) {
      const deductRes = deductStock(
        it.productQuery,
        it.quantity || 1,
        db,
        saveDB,
        {
          variantColor: it.variantColor,
          source: 'telegram_group',
          customerName: parsedOrder.customerName,
          customerPhone: parsedOrder.customerPhone,
          customerAddress: parsedOrder.customerAddress,
          senderName: meta.senderName,
        }
      );

      deductions.push({ res: deductRes, item: it });
      if (!deductRes.success) allSuccess = false;
    }

    if (deductions.length > 0 && deductions.some((d) => d.res.success)) {
      let confirmation = `✅ <b>অর্ডার এন্ট্রি ও স্টক মাইনাস সম্পন্ন!</b>\n\n`;

      for (const d of deductions) {
        if (d.res.success) {
          confirmation += `📦 <b>পণ্য:</b> ${d.res.product.title}\n`;
          if (d.res.variantColor) {
            confirmation += `🎨 <b>কালার ভ্যারিয়েন্ট:</b> <b>${d.res.variantColor}</b> (অবশিষ্ট: ${d.res.newVariantStock} pcs)\n`;
          }
          confirmation += `➖ <b>মাইনাস পরিমাণ:</b> ${d.res.deductedQuantity} pcs\n`;
          confirmation += `📊 <b>অবশিষ্ট মোট স্টক:</b> <b>${d.res.newStock} pcs</b>\n`;
        } else {
          confirmation += `⚠️ <b>${d.item.productQuery}:</b> ${d.res.message}\n`;
        }
      }

      const firstSuccess = deductions.find((d) => d.res.success);
      if (firstSuccess?.res.orderNumber) {
        confirmation += `\n🆔 <b>অর্ডার আইডি:</b> <code>#${firstSuccess.res.orderNumber}</code>\n`;
      }

      if (parsedOrder.customerName || parsedOrder.customerPhone || parsedOrder.customerAddress) {
        confirmation += `👤 <b>গ্রাহক:</b> ${parsedOrder.customerName || 'N/A'}${parsedOrder.customerPhone ? ` (${parsedOrder.customerPhone})` : ''}\n`;
        if (parsedOrder.customerAddress) {
          confirmation += `📍 <b>ঠিকানা:</b> ${parsedOrder.customerAddress}\n`;
        }
        if (parsedOrder.codAmount !== undefined) {
          confirmation += `💵 <b>বিল / COD:</b> ${parsedOrder.isPaid ? '🟢 পেইড (Paid in Advance)' : `৳${parsedOrder.codAmount}`}\n`;
        }
      }

      confirmation += `👤 <b>এন্ট্রি করেছেন:</b> ${meta.senderName}\n\n`;
      confirmation += `🚚 <b>কুরিয়ার বুকিং:</b>\nএই অর্ডারটি সরাসরি Steadfast কুরিয়ারে এন্ট্রি করতে চাইলে এই মেসেজে রিপ্লাই করে লিখুন: <code>courier e entry koro</code> বা <code>steadfast e book koro</code>`;

      // Check for low stock alerts
      const alerts = deductions.map((d) => d.res.alertText).filter(Boolean).join('\n\n');
      if (alerts) {
        confirmation += `\n\n${alerts}`;
      }

      return {
        handled: true,
        replyText: confirmation,
      };
    } else {
      const firstFail = deductions[0]?.res;
      return {
        handled: true,
        replyText: `⚠️ <b>স্টক মাইনাস করা যায়নি:</b> ${firstFail?.message || 'পণ্য সনাক্ত করা সম্ভব হয়নি।'}`,
      };
    }
  }

  // -------------------------------------------------------------
  // ACTION 4: Natural Gemini AI Conversational Assistant Fallback
  // Full conversational chatbot experience for team inquiries, recommendations, advice
  // -------------------------------------------------------------
  if (callAI && text.length >= 3) {
    try {
      const productCatalogSummary = products
        .slice(0, 20)
        .map((p) => {
          const varStr = p.colorVariants
            ? Object.entries(p.colorVariants).map(([c, q]) => `${c}: ${q}`).join(', ')
            : 'Standard';
          return `- [${p.id}] "${p.title}" | Price: ৳${p.price} | Stock: ${p.stockQuantity ?? 25} pcs | Colors: [${varStr}]`;
        })
        .join('\n');

      const systemPrompt = `You are the master intelligent operations manager and conversational co-worker for the Gift Ghor store staff Telegram group.
You think, reason, and chat naturally like Gemini AI itself.
You understand Bengali, Banglish, and English effortlessly.

Gift Ghor Products & Live Inventory:
${productCatalogSummary}

User is a staff member or manager writing to you in the Telegram group.
Understand what they want. If they ask about stock, products, recommendations, pricing, delivery, or general help, provide an accurate, polite, and helpful answer in Bengali with emojis.
Be concise, clear, and executive.`;

      const aiReply = await callAI(
        [{ role: 'user', parts: [{ text }] }],
        systemPrompt,
        350
      );

      if (aiReply && aiReply.trim().length > 5) {
        return {
          handled: true,
          replyText: `🤖 <b>Gift Ghor AI সহকারী:</b>\n\n${aiReply.trim()}`,
        };
      }
    } catch (e) {
      // AI fallback handled
    }
  }

  return { handled: false };
}

export interface ParsedTelegramOrderItem {
  productQuery: string;
  variantColor?: string;
  quantity: number;
}

export interface ParsedTelegramOrderResult {
  isOrder: boolean;
  items: ParsedTelegramOrderItem[];
  productQuery?: string; // backward compat
  variantColor?: string; // backward compat
  quantity?: number; // backward compat
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  codAmount?: number;
  isPaid?: boolean;
}

/**
 * Parses an incoming Telegram message to extract manual orders or stock deductions
 * Supports one-line, multiline pastes, Banglish, Bengali, and Gemini AI natural understanding.
 */
export async function parseTelegramOrderMessage(
  rawText: string,
  products: any[],
  callAI?: (contents: any[], systemPrompt: string, maxTokens?: number) => Promise<string>
): Promise<ParsedTelegramOrderResult> {
  let text = convertBengaliDigits(rawText || '').trim();
  if (!text) return { isOrder: false, items: [] };

  // Strip leading slash if not a reserved command like /stock, /help, etc.
  if (
    text.startsWith('/') &&
    !text.match(/^\/(?:stock|stocklist|inventory|addstock|setstock|help|start|reply|r)\b/i)
  ) {
    text = text.substring(1).trim();
  }

  // Extract color first!
  const { color: detectedColor, textWithoutColor } = extractColor(text);

  // 1. /order <rest>
  let workingText = textWithoutColor;
  const orderCmdMatch = workingText.match(/^order\s+([\s\S]+)$/i);
  if (orderCmdMatch) {
    workingText = orderCmdMatch[1].trim();
  }

  // Extract phone number or address if attached
  let extraPhone = extractBangladeshPhone(workingText);
  if (extraPhone) {
    workingText = workingText.replace(extraPhone, ' ').trim();
  }

  // 2. Pattern: (minus/বাদ/মাইনাস/কমাও/-) <prod> <qty>
  const prefixMinus = workingText.match(
    /^(?:minus|মাইনাস|bad|বাদ|বাদ\s*দাও|komaw|komao|koman|কমাও|-)\s+([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s+(\d+)(?:\s*(?:pcs|pc|টা|টি|পিস|ta|ti|piece|pieces))?$/i
  );
  if (prefixMinus) {
    const q = parseInt(prefixMinus[2], 10);
    const prod = prefixMinus[1].trim();
    return {
      isOrder: true,
      productQuery: prod,
      variantColor: detectedColor || undefined,
      quantity: q,
      customerPhone: extraPhone,
      items: [{ productQuery: prod, variantColor: detectedColor || undefined, quantity: q }],
    };
  }

  // 3. Pattern: <prod> (minus/মাইনাস/বাদ/কমাও/-/:/=) <qty>
  // e.g. 2 in 1 trifold wallet black minus 1, daisywallet minus 1
  const infixMinus = workingText.match(
    /^([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s*(?:minus|মাইনাস|bad|বাদ|komaw|komao|koman|কমাও|[-:=])\s*(\d+)(?:\s*(?:pcs|pc|টা|টি|পিস|ta|ti|piece|pieces|মাইনাস|minus))?$/i
  );
  if (infixMinus) {
    const q = parseInt(infixMinus[2], 10);
    const prod = infixMinus[1].trim();
    return {
      isOrder: true,
      productQuery: prod,
      variantColor: detectedColor || undefined,
      quantity: q,
      customerPhone: extraPhone,
      items: [{ productQuery: prod, variantColor: detectedColor || undefined, quantity: q }],
    };
  }

  // 4. Pattern: <prod> <qty> (টা/টি/পিস/pcs/pc/ta/ti) (মাইনাস/minus/বাদ/কমবে)
  const suffixMinus = workingText.match(
    /^([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s+(\d+)\s*(?:pcs|pc|টা|টি|পিস|ta|ti|piece|pieces)?\s*(?:minus|মাইনাস|bad|বাদ|komaw|komao|কমবে|কমাও)$/i
  );
  if (suffixMinus) {
    const q = parseInt(suffixMinus[2], 10);
    const prod = suffixMinus[1].trim();
    return {
      isOrder: true,
      productQuery: prod,
      variantColor: detectedColor || undefined,
      quantity: q,
      customerPhone: extraPhone,
      items: [{ productQuery: prod, variantColor: detectedColor || undefined, quantity: q }],
    };
  }

  // 5. Pattern: <prod> <qty> (টা/টি/পিস/pcs/ta/ti) (সেল/sell/হলো/হল/গেলো/গেছে)
  const sellPattern = workingText.match(
    /^([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s+(\d+)\s*(?:pcs|pc|টা|টি|পিস|ta|ti|piece|pieces)?\s*(?:sell\s*hoise|sell|সেল|hoise|হয়েছে|হল|হলো|gelo|geche|গেলো|গেছে|বাদ|মাইনাস|minus)$/i
  );
  if (sellPattern) {
    const q = parseInt(sellPattern[2], 10);
    const prod = sellPattern[1].trim();
    return {
      isOrder: true,
      productQuery: prod,
      variantColor: detectedColor || undefined,
      quantity: q,
      customerPhone: extraPhone,
      items: [{ productQuery: prod, variantColor: detectedColor || undefined, quantity: q }],
    };
  }

  // 6. Pattern: <prod> <qty> (pcs/pc/টা/টি/পিস/ta/ti)
  // e.g. 2 in 1 trifold wallet 2 pcs, trifold 1টা
  const withUnits = workingText.match(
    /^([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s+(\d+)\s*(?:pcs|pc|টা|টি|পিস|ta|ti|piece|pieces)(?:\s*,\s*([\s\S]*))?$/i
  );
  if (withUnits) {
    const q = parseInt(withUnits[2], 10);
    const prod = withUnits[1].trim();
    return {
      isOrder: true,
      productQuery: prod,
      variantColor: detectedColor || undefined,
      quantity: q,
      customerPhone: extraPhone,
      customerAddress: withUnits[3]?.trim(),
      items: [{ productQuery: prod, variantColor: detectedColor || undefined, quantity: q }],
    };
  }

  // 7. Pattern: <prod> <qty> (plain number at the end)
  // e.g. 2 in 1 trifold wallet 2, daisywallet 1
  const plainNum = workingText.match(/^([a-zA-Z0-9\s\u0980-\u09FF\-_]+?)\s+(\d+)$/i);
  if (plainNum) {
    const candidate = plainNum[1].trim();
    const match = matchProduct(candidate, products);
    if (match && match.score >= 40) {
      const q = parseInt(plainNum[2], 10);
      return {
        isOrder: true,
        productQuery: candidate,
        variantColor: detectedColor || undefined,
        quantity: q,
        customerPhone: extraPhone,
        items: [{ productQuery: candidate, variantColor: detectedColor || undefined, quantity: q }],
      };
    }
  }

  // 8. Pattern: <qty> <prod>
  // e.g. 2 trifold wallet
  const numPrefix = workingText.match(/^(\d+)(?:\s*(?:pcs|pc|টা|টি|পিস))?\s+([a-zA-Z0-9\s\u0980-\u09FF\-_]+)$/i);
  if (numPrefix) {
    const candidate = numPrefix[2].trim();
    const match = matchProduct(candidate, products);
    if (match && match.score >= 40) {
      const q = parseInt(numPrefix[1], 10);
      return {
        isOrder: true,
        productQuery: candidate,
        variantColor: detectedColor || undefined,
        quantity: q,
        customerPhone: extraPhone,
        items: [{ productQuery: candidate, variantColor: detectedColor || undefined, quantity: q }],
      };
    }
  }

  // 9. Multiline or Complex Conversational Order Extraction using Gemini AI
  if (callAI && (text.includes('\n') || text.length > 15 || /(?:order|অর্ডার|sell|সেল|customer|কাস্টমার|name|নাম|phone|ফোন|address|ঠিকানা|cod|বিল|টাকা|মাইনাস|বাদ|stock)/i.test(text))) {
    try {
      const productCatalog = products
        .map((p) => `- ${p.title} (ID: ${p.id}, Price: ৳${p.price})`)
        .join('\n');

      const aiPrompt = `You are an intelligent order and stock deduction extractor for an e-commerce store in Bangladesh.
The staff has posted an order or stock deduction instruction in the Telegram Order Group.

Store Product Catalog:
${productCatalog}

Text to analyze:
"""
${text}
"""

Instructions:
1. Determine if this message is recording a new customer order or instructing to deduct/minus stock.
2. Extract all items ordered (productQuery, variantColor, quantity).
3. Extract customerName, customerPhone (11-digit mobile like 017xxxxxxxx), customerAddress, and COD amount (if Paid or 00, set isPaid: true and codAmount: 0).
4. Output STRICT JSON ONLY (no markdown code blocks, no other text):
{
  "isOrder": true,
  "items": [
    {
      "productQuery": "Product Title",
      "variantColor": "Color",
      "quantity": 1
    }
  ],
  "customerName": "Customer Name",
  "customerPhone": "01712345678",
  "customerAddress": "Delivery Address",
  "codAmount": 450,
  "isPaid": false
}`;

      const aiResponse = await callAI(
        [{ role: 'user', parts: [{ text: aiPrompt }] }],
        aiPrompt,
        400
      );

      if (aiResponse) {
        const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && parsed.isOrder && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const firstItem = parsed.items[0];
          return {
            isOrder: true,
            items: parsed.items,
            productQuery: firstItem.productQuery,
            variantColor: firstItem.variantColor,
            quantity: firstItem.quantity || 1,
            customerName: parsed.customerName,
            customerPhone: parsed.customerPhone,
            customerAddress: parsed.customerAddress,
            codAmount: parsed.codAmount,
            isPaid: parsed.isPaid,
          };
        }
      }
    } catch (err) {
      // Fallback below
    }
  }

  // 10. Regex fallback for structured multiline order pastes
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    let name: string | undefined;
    let phone: string | undefined = extractBangladeshPhone(text);
    let address: string | undefined;
    let itemsFound: ParsedTelegramOrderItem[] = [];
    let codAmt: number | undefined;
    let isPaidOrder = false;

    for (const l of lines) {
      const linePhone = extractBangladeshPhone(l);
      if (linePhone && !phone) {
        phone = linePhone;
      }

      const nMatch = l.match(/(?:name|customer|নাম|গ্রাহক)\s*[:=-]\s*([^\n,]+)/i);
      if (nMatch && !name) {
        name = nMatch[1].trim();
      }

      const aMatch = l.match(/(?:address|ঠিকানা|লোকেশন|location)\s*[:=-]\s*([^\n]+)/i);
      if (aMatch && !address) {
        address = aMatch[1].trim();
      }

      if (/\b(?:paid|full\s*paid|advance|00|০|পেইড|পরিশোধিত)\b/i.test(l)) {
        isPaidOrder = true;
        codAmt = 0;
      } else {
        const cMatch = l.match(/(?:cod|বিল|টাকা|bill|amount)\s*[:=-]?\s*৳?\s*(\d+)/i);
        if (cMatch && codAmt === undefined) {
          codAmt = parseInt(cMatch[1], 10);
        }
      }

      // Check for product match
      const pMatched = matchProduct(l, products);
      if (pMatched && pMatched.product) {
        const { color } = extractColor(l);
        const qMatch = l.match(/(\d+)\s*(?:pcs|pc|টা|টি|পিস|ta|ti)/i);
        const q = qMatch ? parseInt(qMatch[1], 10) : 1;
        itemsFound.push({
          productQuery: pMatched.product.title,
          variantColor: color || undefined,
          quantity: q,
        });
      }
    }

    if (itemsFound.length > 0) {
      return {
        isOrder: true,
        items: itemsFound,
        productQuery: itemsFound[0].productQuery,
        variantColor: itemsFound[0].variantColor,
        quantity: itemsFound[0].quantity,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        codAmount: codAmt,
        isPaid: isPaidOrder,
      };
    }
  }

  return { isOrder: false, items: [] };
}
