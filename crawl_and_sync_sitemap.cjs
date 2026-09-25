const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetchText(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(
        urlStr,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const nextUrl = new URL(res.headers.location, urlStr).toString();
            return resolve(fetchText(nextUrl));
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: data, url: urlStr }));
        }
      );
      req.on('error', (err) => resolve({ status: 500, body: '', url: urlStr, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 508, body: '', url: urlStr, error: 'Timeout' });
      });
    } catch (e) {
      resolve({ status: 500, body: '', url: urlStr, error: e.message });
    }
  });
}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  console.log('=== STARTING SITEMAP CRAWL & SYNC ===');
  const sitemapUrl = 'https://giftghor.world/api/sitemaps.xml';
  console.log('Fetching sitemap from:', sitemapUrl);

  const sitemapRes = await fetchText(sitemapUrl);
  if (!sitemapRes.body) {
    console.error('Failed to fetch sitemap xml');
    process.exit(1);
  }

  const urls = [];
  const matches = sitemapRes.body.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) {
    const u = match[1].trim();
    if (u && u.includes('/products/')) {
      urls.push(u);
    }
  }

  console.log(`Found ${urls.length} product URLs in sitemap.`);

  // Load existing database
  let dbData = { products: [] };
  if (fs.existsSync('data_storage.json')) {
    try {
      dbData = JSON.parse(fs.readFileSync('data_storage.json', 'utf8'));
    } catch (e) {
      console.warn('Could not parse data_storage.json:', e.message);
    }
  }

  const existingProducts = dbData.products || [];
  console.log(`Current DB contains ${existingProducts.length} products.`);

  // Build index of existing product IDs/URLs/Titles
  const existingKeys = new Set();
  existingProducts.forEach((p) => {
    if (p.id) existingKeys.add(String(p.id));
    if (p.productUrl) existingKeys.add(p.productUrl);
    if (p.title) existingKeys.add(p.title.trim().toLowerCase());
  });

  let newProductsAdded = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const matchId = url.match(/\/products\/([0-9a-zA-Z_\-]+)/);
    const prodId = matchId ? matchId[1] : `prod-${Date.now()}-${i}`;

    console.log(`\n[${i + 1}/${urls.length}] Crawling: ${url}`);
    const pageRes = await fetchText(url);

    if (pageRes.status !== 200 || !pageRes.body) {
      console.warn(`Could not fetch page ${url} (Status ${pageRes.status})`);
      continue;
    }

    const html = pageRes.body;

    // Extract Title
    let title = '';
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                         html.match(/<title>(.*?)<\/title>/i);
    if (ogTitleMatch) {
      title = cleanHtml(ogTitleMatch[1]).replace(/ \| Gift Ghor.*$/i, '').trim();
    }

    // Extract Price
    let price = 550;
    const ogPriceMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([0-9\.]+)["']/i) ||
                        html.match(/"price":\s*"?([0-9\.]+)"?/i) ||
                        html.match(/৳\s*([0-9,]+)/i);
    if (ogPriceMatch) {
      const rawPrice = parseFloat(ogPriceMatch[1].replace(/,/g, ''));
      if (!isNaN(rawPrice) && rawPrice > 0) {
        price = rawPrice;
      }
    }

    // Extract Image
    let imageUrl = 'https://giftghor.world/logo.png';
    const ogImgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                       html.match(/<img\s+[^>]*src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
    if (ogImgMatch) {
      imageUrl = ogImgMatch[1].trim();
    }

    // Extract Description
    let description = title;
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    if (ogDescMatch) {
      const cleanDesc = cleanHtml(ogDescMatch[1]);
      if (cleanDesc.length > 10) description = cleanDesc;
    }

    // Check if duplicate
    const titleKey = title.toLowerCase().trim();
    if (existingKeys.has(prodId) || existingKeys.has(url) || (titleKey && existingKeys.has(titleKey))) {
      console.log(`Skipping duplicate product: "${title || prodId}"`);
      continue;
    }

    // Create product record
    const newProduct = {
      id: prodId,
      title: title || `Gift Ghor Product #${prodId}`,
      price: price,
      originalPrice: Math.round(price * 1.25),
      imageUrl: imageUrl,
      category: title.toLowerCase().includes('wallet') ? 'Wallets & Purses' : 'Ladies Handbags',
      description: description,
      inStock: true,
      stockCount: 15,
      features: [
        'প্রিমিয়াম কোয়ালিটি ম্যাটেরিয়াল',
        'স্টাইলিশ ও আধুনিক ডিজাইন',
        'ক্যাশ অন ডেলিভারি সার্ভিস'
      ],
      productUrl: url,
    };

    existingProducts.push(newProduct);
    existingKeys.add(prodId);
    existingKeys.add(url);
    if (titleKey) existingKeys.add(titleKey);

    newProductsAdded++;
    console.log(`+ ADDED NEW PRODUCT: "${newProduct.title}" (৳${newProduct.price})`);
  }

  dbData.products = existingProducts;

  // Save updated databases
  fs.writeFileSync('data_storage.json', JSON.stringify(dbData, null, 2), 'utf8');
  fs.writeFileSync('data_storage.backup.json', JSON.stringify(dbData, null, 2), 'utf8');

  if (fs.existsSync('system_db.json')) {
    try {
      const sysDb = JSON.parse(fs.readFileSync('system_db.json', 'utf8'));
      sysDb.products = existingProducts;
      fs.writeFileSync('system_db.json', JSON.stringify(sysDb, null, 2), 'utf8');
    } catch (e) {
      console.warn('Failed updating system_db.json:', e.message);
    }
  }

  // Generate updated src/db/scraped_products.ts
  const tsContent = `// Auto-generated scraped products catalog from sitemap
export interface ScrapedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  description: string;
  inStock: boolean;
  stockCount: number;
  features: string[];
  productUrl: string;
}

export const SCRAPED_PRODUCTS: ScrapedProduct[] = ${JSON.stringify(existingProducts, null, 2)};
`;
  fs.writeFileSync('src/db/scraped_products.ts', tsContent, 'utf8');

  console.log(`\n=== SITEMAP SYNC COMPLETE ===`);
  console.log(`Total Products in DB Now: ${existingProducts.length}`);
  console.log(`New Products Added: ${newProductsAdded}`);
}

run();
