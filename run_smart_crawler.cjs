const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

async function runCrawler() {
  console.log('=== STARTING GIFT GHOR SMART SITEMAP CRAWLER ===');
  
  // 1. Load existing database safely
  const dbPath = path.join(__dirname, 'data_storage.json');
  const backupPath = path.join(__dirname, 'data_storage.backup.json');
  
  let dbData = {};
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    dbData = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read data_storage.json, starting fresh:', err);
    dbData = { products: [] };
  }
  
  if (!Array.isArray(dbData.products)) {
    dbData.products = [];
  }
  
  // Backup before writing
  try {
    fs.writeFileSync(backupPath, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('✓ Created safety backup data_storage.backup.json');
  } catch (err) {
    console.warn('Backup write warning:', err.message);
  }

  // Create a map of existing products by numeric ID or URL for quick lookup
  const existingMap = new Map();
  for (const p of dbData.products) {
    if (p.id) existingMap.set(String(p.id), p);
    if (p.url) {
      const match = p.url.match(/products\/.*?(\d+)/);
      if (match) existingMap.set(match[1], p);
    }
  }

  console.log(`Currently ${dbData.products.length} products in database.`);

  // 2. Fetch sitemaps to get product URLs
  const sitemapUrls = [
    'https://giftghor.world/api/sitemaps.xml',
    'https://giftghor.world/sitemap.xml',
  ];

  const productUrlSet = new Set();

  for (const sUrl of sitemapUrls) {
    try {
      console.log(`Fetching sitemap from: ${sUrl}`);
      const res = await fetch(sUrl);
      if (!res.ok) continue;
      const xml = await res.text();
      const matches = xml.match(/<loc>(https:\/\/giftghor\.world\/products\/[^<]+)<\/loc>/g) || [];
      for (const m of matches) {
        const cleanUrl = m.replace('<loc>', '').replace('</loc>', '').trim();
        if (cleanUrl) productUrlSet.add(cleanUrl);
      }
    } catch (err) {
      console.warn(`Sitemap fetch error (${sUrl}):`, err.message);
    }
  }

  // Also check homepage for additional product links
  try {
    console.log('Fetching homepage for extra product links...');
    const hpRes = await fetch('https://giftghor.world');
    const hpHtml = await hpRes.text();
    const $hp = cheerio.load(hpHtml);
    $hp('a[href*="/products/"]').each((i, el) => {
      const href = $hp(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://giftghor.world${href.startsWith('/') ? '' : '/'}${href}`;
        productUrlSet.add(fullUrl);
      }
    });
  } catch (err) {
    console.warn('Homepage crawl warning:', err.message);
  }

  const allProductUrls = Array.from(productUrlSet);
  console.log(`Found total ${allProductUrls.length} product URLs across sitemap and website.`);

  let newlyAdded = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const url of allProductUrls) {
    // Extract ID from URL
    const idMatch = url.match(/(\d+)$/);
    const productId = idMatch ? idMatch[1] : url.split('/').pop();

    const existingProduct = existingMap.get(String(productId));

    // Check if we need to scrape or update
    const needsUpdate = !existingProduct || 
                        !existingProduct.imageUrl || 
                        existingProduct.imageUrl.includes('logo.png') ||
                        !existingProduct.description ||
                        existingProduct.description.length < 20;

    if (!needsUpdate) {
      skippedCount++;
      console.log(`[SKIP] Product ID ${productId} is already present with complete image & info.`);
      continue;
    }

    console.log(`[SCRAPING] ${url}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url} - Status ${res.status}`);
        continue;
      }
      const html = await res.text();
      const $ = cheerio.load(html);

      let productSchema = null;
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const json = JSON.parse($(el).html());
          if (json && json['@type'] === 'Product') {
            productSchema = json;
          }
        } catch (e) {}
      });

      // Extract details from Schema or DOM
      let title = '';
      let price = 0;
      let description = '';
      let imageUrl = '';
      let imagesArray = [];
      let inStock = 'in_stock';

      if (productSchema) {
        title = productSchema.name || '';
        price = Number(productSchema.offers?.price) || 0;
        const stockStr = String(productSchema.offers?.availability || '');
        inStock = stockStr.includes('InStock') ? 'in_stock' : 'out_of_stock';
        description = productSchema.description || '';

        if (Array.isArray(productSchema.image)) {
          imagesArray = productSchema.image;
          imageUrl = imagesArray[0] || '';
        } else if (typeof productSchema.image === 'string') {
          imageUrl = productSchema.image;
          imagesArray = [imageUrl];
        }
      }

      // Fallback extraction from HTML DOM if schema missing or incomplete
      if (!title) {
        title = $('meta[property="og:title"]').attr('content') || $('title').text().replace('- Gift Ghor', '').trim();
      }
      if (!price) {
        const priceText = $('.price, .product-price, [data-price]').text().replace(/[^0-9]/g, '');
        if (priceText) price = Number(priceText);
      }
      if (!imageUrl || imageUrl.includes('logo.png')) {
        imageUrl = $('meta[property="og:image"]').attr('content') || '';
      }
      if (!description) {
        description = $('meta[property="og:description"]').attr('content') || $('.product-description, .description').text().trim();
      }

      // Collect any additional images on page
      $('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('svg') && !imagesArray.includes(src)) {
          imagesArray.push(src);
        }
      });

      if (!imageUrl && imagesArray.length > 0) {
        imageUrl = imagesArray[0];
      }

      if (!title) {
        console.warn(`Could not parse title for ${url}, skipping.`);
        continue;
      }

      const cleanProduct = {
        id: String(productId),
        title: title.trim(),
        price: price || 450,
        category: 'Accessories',
        customizable: false,
        stockStatus: inStock,
        imageUrl: imageUrl || 'https://giftghor.world/assets/logo.png',
        images: imagesArray.length > 0 ? imagesArray : [imageUrl],
        url: url,
        description: description.trim() || `${title.trim()} - Gift Ghor প্রিমিয়াম কোয়ালিটি আইটেম।`
      };

      if (existingProduct) {
        // Update existing product
        Object.assign(existingProduct, cleanProduct);
        updatedCount++;
        console.log(`✓ Updated Product #${productId}: "${cleanProduct.title.substring(0, 30)}..." - ৳${cleanProduct.price}`);
      } else {
        // Add new product
        dbData.products.push(cleanProduct);
        existingMap.set(String(productId), cleanProduct);
        newlyAdded++;
        console.log(`+ Added New Product #${productId}: "${cleanProduct.title.substring(0, 30)}..." - ৳${cleanProduct.price}`);
      }

    } catch (err) {
      console.error(`Error processing ${url}:`, err.message);
    }
  }

  // Update training version & last trained timestamp
  dbData.lastTrainedAt = new Date().toISOString();
  dbData.trainingVersion = (dbData.trainingVersion || 1) + 1;

  // 3. Save atomically to data_storage.json
  try {
    const jsonString = JSON.stringify(dbData, null, 2);
    fs.writeFileSync(dbPath, jsonString, 'utf8');
    console.log(`✓ Successfully updated data_storage.json with ${dbData.products.length} total products.`);
  } catch (err) {
    console.error('FATAL ERROR writing data_storage.json:', err);
    return;
  }

  // 4. Also generate src/db/scraped_products.ts for offline/static imports
  let tsCode = `// Auto-generated by smart crawler on ${new Date().toISOString()}\nexport const products = [\n`;
  for (const p of dbData.products) {
    tsCode += `  {\n`;
    tsCode += `    id: ${JSON.stringify(p.id)},\n`;
    tsCode += `    title: ${JSON.stringify(p.title)},\n`;
    tsCode += `    price: ${p.price},\n`;
    tsCode += `    category: ${JSON.stringify(p.category || 'Accessories')},\n`;
    tsCode += `    customizable: ${!!p.customizable},\n`;
    tsCode += `    stockStatus: ${JSON.stringify(p.stockStatus || 'in_stock')},\n`;
    tsCode += `    imageUrl: ${JSON.stringify(p.imageUrl || '')},\n`;
    tsCode += `    url: ${JSON.stringify(p.url || '')},\n`;
    tsCode += `    description: ${JSON.stringify(p.description || '')}\n`;
    tsCode += `  },\n`;
  }
  tsCode += `];\n`;

  try {
    fs.writeFileSync(path.join(__dirname, 'src/db/scraped_products.ts'), tsCode, 'utf8');
    console.log('✓ Successfully sync\'d src/db/scraped_products.ts');
  } catch (err) {
    console.warn('TS file sync error:', err.message);
  }

  console.log('\n=== CRAWL COMPLETE SUMMARY ===');
  console.log(`Newly Added: ${newlyAdded}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (Already Present): ${skippedCount}`);
  console.log(`Total Products in DB: ${dbData.products.length}`);
}

runCrawler();
