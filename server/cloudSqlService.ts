import { eq, ilike, or, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../src/db/index.ts';
import {
  products as productsTable,
  orders as ordersTable,
  branding as brandingTable,
  deliveryPolicy as deliveryPolicyTable,
  adminSettings as adminSettingsTable,
  teamMembers as teamMembersTable,
  crawledPages as crawledPagesTable,
  chatSessions as chatSessionsTable,
} from '../src/db/schema.ts';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SqlProduct {
  id: string;
  title: string;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  description?: string | null;
  customizable?: boolean | null;
  stockStatus?: string | null;
  stock?: number | null;
}

export interface SqlOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  deliveryLocation?: string | null;
  totalAmount: number;
  codAmount?: number | null;
  isPaid?: boolean | null;
  items?: any;
  status?: string | null;
  steadfastConsignmentId?: string | null;
  steadfastTrackingCode?: string | null;
  steadfastDeliveryStatus?: string | null;
  steadfastLastCheckedAt?: Date | null;
  notes?: string | null;
  source?: string | null;
}

// ----------------- PRODUCTS -----------------

export async function getProductsFromCloudSql(): Promise<SqlProduct[]> {
  try {
    return await db.select().from(productsTable);
  } catch (error) {
    console.error('[CloudSQL] Error fetching products:', error);
    return [];
  }
}

export async function upsertProductInCloudSql(prod: SqlProduct): Promise<void> {
  try {
    await db
      .insert(productsTable)
      .values({
        id: String(prod.id),
        title: prod.title,
        price: prod.price,
        category: prod.category || 'Accessories',
        imageUrl: prod.imageUrl || '',
        url: prod.url || '',
        description: prod.description || '',
        customizable: !!prod.customizable,
        stockStatus: prod.stockStatus || 'in_stock',
        stock: prod.stock !== undefined && prod.stock !== null ? prod.stock : 50,
      })
      .onConflictDoUpdate({
        target: productsTable.id,
        set: {
          title: prod.title,
          price: prod.price,
          category: prod.category || 'Accessories',
          imageUrl: prod.imageUrl || '',
          url: prod.url || '',
          description: prod.description || '',
          stockStatus: prod.stockStatus || 'in_stock',
          stock: prod.stock !== undefined && prod.stock !== null ? prod.stock : 50,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('[CloudSQL] Error upserting product:', error);
  }
}

// ----------------- ORDERS -----------------

export async function getOrdersFromCloudSql(): Promise<SqlOrder[]> {
  try {
    return await db.select().from(ordersTable);
  } catch (error) {
    console.error('[CloudSQL] Error fetching orders:', error);
    return [];
  }
}

export async function upsertOrderInCloudSql(ord: SqlOrder): Promise<void> {
  try {
    await db
      .insert(ordersTable)
      .values({
        id: ord.id,
        orderNumber: ord.orderNumber,
        customerName: ord.customerName,
        customerPhone: ord.customerPhone,
        customerAddress: ord.customerAddress || null,
        deliveryLocation: ord.deliveryLocation || null,
        totalAmount: ord.totalAmount,
        codAmount: ord.codAmount !== undefined ? ord.codAmount : ord.totalAmount,
        isPaid: !!ord.isPaid,
        items: ord.items || [],
        status: ord.status || 'pending',
        steadfastConsignmentId: ord.steadfastConsignmentId || null,
        steadfastTrackingCode: ord.steadfastTrackingCode || null,
        steadfastDeliveryStatus: ord.steadfastDeliveryStatus || null,
        notes: ord.notes || null,
        source: ord.source || 'chat',
      })
      .onConflictDoUpdate({
        target: ordersTable.id,
        set: {
          orderNumber: ord.orderNumber,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          customerAddress: ord.customerAddress || null,
          deliveryLocation: ord.deliveryLocation || null,
          totalAmount: ord.totalAmount,
          codAmount: ord.codAmount !== undefined ? ord.codAmount : ord.totalAmount,
          isPaid: !!ord.isPaid,
          items: ord.items || [],
          status: ord.status || 'pending',
          steadfastConsignmentId: ord.steadfastConsignmentId || null,
          steadfastTrackingCode: ord.steadfastTrackingCode || null,
          steadfastDeliveryStatus: ord.steadfastDeliveryStatus || null,
          notes: ord.notes || null,
          source: ord.source || 'chat',
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('[CloudSQL] Error upserting order:', error);
  }
}

// ----------------- DEEP SQL SEARCH & GROUNDING FOR AI -----------------

export async function deepSearchDatabaseForAI(searchQuery: string): Promise<{
  matchedProducts: SqlProduct[];
  matchedOrders: SqlOrder[];
  shopPolicy: any;
}> {
  try {
    const clean = searchQuery.trim().toLowerCase();
    const words = clean.split(/\s+/).filter((w) => w.length > 2);

    // 1. Search products
    let matchedProducts: SqlProduct[] = [];
    if (words.length > 0) {
      const conditions = words.map((w) =>
        or(
          ilike(productsTable.title, `%${w}%`),
          ilike(productsTable.description, `%${w}%`),
          ilike(productsTable.category, `%${w}%`)
        )
      );
      matchedProducts = await db
        .select()
        .from(productsTable)
        .where(or(...conditions))
        .limit(10);
    }

    if (matchedProducts.length === 0) {
      matchedProducts = await db.select().from(productsTable).limit(8);
    }

    // 2. Search orders (if query contains phone or invoice or consignment)
    let matchedOrders: SqlOrder[] = [];
    const digitsOnly = searchQuery.replace(/\D/g, '');
    if (digitsOnly.length >= 6) {
      matchedOrders = await db
        .select()
        .from(ordersTable)
        .where(
          or(
            ilike(ordersTable.customerPhone, `%${digitsOnly}%`),
            ilike(ordersTable.orderNumber, `%${digitsOnly}%`),
            ilike(ordersTable.steadfastConsignmentId, `%${digitsOnly}%`)
          )
        )
        .limit(5);
    }

    // 3. Shop policy
    const policyRows = await db.select().from(deliveryPolicyTable).limit(1);
    const shopPolicy = policyRows[0] || {
      insideDhakaRate: 70,
      outsideDhakaRate: 130,
      estimatedDhaka: '24-48 hours',
      estimatedOutside: '2-4 days',
    };

    return {
      matchedProducts,
      matchedOrders,
      shopPolicy,
    };
  } catch (err) {
    console.error('[CloudSQL] Error in deepSearchDatabaseForAI:', err);
    return {
      matchedProducts: [],
      matchedOrders: [],
      shopPolicy: null,
    };
  }
}

// ----------------- SITEMAP CRAWLER & SYNC -----------------

export async function crawlSitemapToCloudSql(sitemapUrl = 'https://giftghor.world/sitemap.xml'): Promise<{
  success: boolean;
  pagesCrawled: number;
  productsUpdated: number;
  urls: string[];
}> {
  console.log(`[CloudSQL Crawler] Fetching sitemap: ${sitemapUrl}`);
  try {
    let sitemapXml = '';
    try {
      const res = await axios.get(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GiftGhorBot/2.0' },
        timeout: 10000,
      });
      sitemapXml = res.data;
    } catch (e: any) {
      console.warn(`[CloudSQL Crawler] ${sitemapUrl} direct fetch error: ${e.message}, trying fallback...`);
      const fallbackUrl = 'https://giftghor.world/sitemap.xml';
      const fallbackRes = await axios.get(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GiftGhorBot/2.0' },
        timeout: 10000,
      });
      sitemapXml = fallbackRes.data;
    }

    const sitemapUrls: string[] = [];
    if (sitemapXml) {
      const $xml = cheerio.load(sitemapXml, { xmlMode: true });
      $xml('url loc').each((_, el) => {
        const u = $xml(el).text().trim();
        if (u) sitemapUrls.push(u);
      });
    }

    console.log(`[CloudSQL Crawler] Found ${sitemapUrls.length} URLs in sitemap.`);
    let pagesCrawled = 0;
    let productsUpdated = 0;

    for (let i = 0; i < sitemapUrls.length; i++) {
      const pageUrl = sitemapUrls[i];
      try {
        const pageRes = await axios.get(pageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GiftGhorCrawler/2.0' },
          timeout: 12000,
        });

        const $ = cheerio.load(pageRes.data);
        const title = $('title').text().trim() || $('h1').first().text().trim() || '';

        $('script, style, noscript, nav, footer, header').remove();
        const mainText = $('main, body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

        const category = pageUrl.includes('/products/')
          ? 'product'
          : pageUrl.includes('/collections/')
          ? 'collection'
          : 'policy_page';

        await db
          .insert(crawledPagesTable)
          .values({
            url: pageUrl,
            title,
            content: mainText,
            category,
          })
          .onConflictDoUpdate({
            target: crawledPagesTable.url,
            set: {
              title,
              content: mainText,
              category,
              crawledAt: new Date(),
            },
          });
        pagesCrawled++;

        if (pageUrl.includes('/products/')) {
          const slugParts = pageUrl.split('-').pop()?.split('/').pop();
          const prodId = slugParts && /^\d+$/.test(slugParts) ? slugParts : `prod-${i + 1000}`;

          let price = 0;
          let imageUrl = '';
          let description = '';

          $('script[type="application/ld+json"]').each((_, el) => {
            try {
              const ld = JSON.parse($(el).html() || '{}');
              if (ld['@type'] === 'Product' || ld.name) {
                if (ld.offers?.price) price = parseInt(ld.offers.price, 10);
                if (ld.image) imageUrl = Array.isArray(ld.image) ? ld.image[0] : ld.image;
                if (ld.description) description = ld.description;
              }
            } catch (_) {}
          });

          if (!imageUrl) {
            imageUrl = $('meta[property="og:image"]').attr('content') || '';
          }

          if (!price) {
            const priceText = $('body').text().match(/(?:৳|Tk|BDT|price)\s*([\d,]+)/i);
            if (priceText) {
              price = parseInt(priceText[1].replace(/,/g, ''), 10);
            }
          }

          const cleanTitle = title.replace(/\s*-\s*Gift\s*Ghor.*$/i, '').trim();

          if (!description) {
            description = $('meta[name="description"]').attr('content') || mainText.substring(0, 1000);
          }

          if (cleanTitle) {
            await db
              .insert(productsTable)
              .values({
                id: prodId,
                title: cleanTitle,
                price: price || 450,
                category: 'Gift & Accessories',
                imageUrl,
                url: pageUrl,
                description,
                customizable: false,
                stockStatus: 'in_stock',
                stock: 50,
              })
              .onConflictDoUpdate({
                target: productsTable.id,
                set: {
                  title: cleanTitle,
                  price: price || 450,
                  imageUrl: imageUrl || undefined,
                  url: pageUrl,
                  description: description || undefined,
                  updatedAt: new Date(),
                },
              });
            productsUpdated++;
          }
        }
      } catch (err: any) {
        console.warn(`[CloudSQL Crawler] Error crawling ${pageUrl}:`, err.message);
      }
    }

    return {
      success: true,
      pagesCrawled,
      productsUpdated,
      urls: sitemapUrls,
    };
  } catch (err: any) {
    console.error('[CloudSQL Crawler] Failed:', err);
    return {
      success: false,
      pagesCrawled: 0,
      productsUpdated: 0,
      urls: [],
    };
  }
}

export async function upsertChatSessionInCloudSql(sess: any): Promise<void> {
  if (!sess || !sess.id) return;
  try {
    await db
      .insert(chatSessionsTable)
      .values({
        id: sess.id,
        customerName: sess.customerName || null,
        customerPhone: sess.customerPhone || null,
        status: sess.status || 'active',
        messages: sess.messages || [],
        orderExtracted: sess.orderExtracted || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: chatSessionsTable.id,
        set: {
          customerName: sess.customerName || null,
          customerPhone: sess.customerPhone || null,
          status: sess.status || 'active',
          messages: sess.messages || [],
          orderExtracted: sess.orderExtracted || null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('[CloudSQL] Error upserting chat session:', error);
  }
}

export async function getChatSessionsFromCloudSql(): Promise<Record<string, any>> {
  try {
    const rows = await db.select().from(chatSessionsTable);
    const sessionsMap: Record<string, any> = {};
    for (const r of rows) {
      sessionsMap[r.id] = {
        id: r.id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        status: r.status || 'active',
        messages: r.messages || [],
        orderExtracted: r.orderExtracted,
        lastActivity: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      };
    }
    return sessionsMap;
  } catch (error) {
    console.error('[CloudSQL] Error fetching chat sessions:', error);
    return {};
  }
}

// ----------------- FULL BIDIRECTIONAL SYNC & LOAD -----------------

export async function syncDbToCloudSql(dbData: any): Promise<void> {
  if (!dbData) return;

  try {
    // 1. Sync orders
    if (dbData.orders && typeof dbData.orders === 'object') {
      const ordersList = Object.values(dbData.orders);
      for (const ord of ordersList as any[]) {
        if (!ord.id) continue;
        await upsertOrderInCloudSql({
          id: ord.id,
          orderNumber: ord.orderNumber || ord.invoice || ord.id,
          customerName: ord.customerName || ord.recipientName || 'Customer',
          customerPhone: ord.customerPhone || ord.recipientPhone || '',
          customerAddress: ord.customerAddress || ord.recipientAddress || '',
          deliveryLocation: ord.deliveryLocation || 'outside_dhaka',
          totalAmount: parseInt(ord.totalAmount || ord.codAmount || 0, 10),
          codAmount: parseInt(ord.codAmount || ord.totalAmount || 0, 10),
          isPaid: !!ord.isPaid,
          items: ord.items || [],
          status: ord.status || 'pending',
          steadfastConsignmentId: ord.steadfastConsignmentId || null,
          steadfastTrackingCode: ord.steadfastTrackingCode || null,
          steadfastDeliveryStatus: ord.steadfastDeliveryStatus || null,
          notes: ord.notes || null,
          source: ord.source || 'chat',
        });
      }
    }

    // 2. Sync products
    if (Array.isArray(dbData.products)) {
      for (const p of dbData.products) {
        if (!p.id || !p.title) continue;
        await upsertProductInCloudSql({
          id: String(p.id),
          title: p.title,
          price: parseInt(p.price || 0, 10),
          category: p.category || 'Accessories',
          imageUrl: p.imageUrl || '',
          url: p.url || '',
          description: p.description || '',
          customizable: !!p.customizable,
          stockStatus: p.stockStatus || 'in_stock',
          stock: p.stockQuantity || p.stock || 50,
        });
      }
    }
    // 3. Sync chat sessions
    if (dbData.sessions && typeof dbData.sessions === 'object') {
      const sessionsList = Object.values(dbData.sessions);
      for (const sess of sessionsList as any[]) {
        if (!sess.id) continue;
        await upsertChatSessionInCloudSql(sess);
      }
    }
  } catch (err) {
    console.error('[CloudSQL] syncDbToCloudSql error:', err);
  }
}

export async function loadDataFromCloudSql(): Promise<{
  products: SqlProduct[];
  orders: SqlOrder[];
  sessions: Record<string, any>;
}> {
  try {
    const products = await getProductsFromCloudSql();
    const orders = await getOrdersFromCloudSql();
    const sessions = await getChatSessionsFromCloudSql();
    return { products, orders, sessions };
  } catch (err) {
    console.error('[CloudSQL] loadDataFromCloudSql error:', err);
    return { products: [], orders: [], sessions: {} };
  }
}

