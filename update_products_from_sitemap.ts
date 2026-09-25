import * as cheerio from 'cheerio';
import fs from 'fs';

async function run() {
  console.log('Fetching sitemap...');
  const sitemapRes = await fetch('https://giftghor.world/api/sitemaps.xml');
  const sitemapXml = await sitemapRes.text();
  
  const urls = [];
  const regex = /<loc>(https:\/\/giftghor\.world\/products\/\d+)<\/loc>/g;
  let match;
  while ((match = regex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }
  
  console.log(`Found ${urls.length} products to scrape.`);
  
  const scrapedProducts = [];
  
  for (const url of urls) {
    console.log('Scraping', url);
    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      
      let productSchema = null;
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const json = JSON.parse($(el).html());
          if (json['@type'] === 'Product') {
            productSchema = json;
          }
        } catch(e) {}
      });
      
      if (productSchema) {
        const name = productSchema.name || $('title').text();
        const price = productSchema.offers?.price || 'N/A';
        const inStock = productSchema.offers?.availability?.includes('InStock') ? 'In Stock' : 'Check Website';
        // Some simple description extraction, first sentence
        let description = (productSchema.description || '').split('।')[0] + '।';
        if (description === '।') description = '';
        
        scrapedProducts.push({
          id: productSchema.id || url.split('/').pop(),
          title: name.replace(' - Gift Ghor', '').trim(),
          price: price,
          category: 'Accessories',
          customizable: false,
          stockStatus: inStock,
          url: url,
          description: description
        });
      }
    } catch(e) {
      console.error('Error scraping', url, e.message);
    }
  }
  
  console.log(`Successfully scraped ${scrapedProducts.length} products.`);
  
  // Format for the server.ts file
  let dbProductsCode = 'export const products = [\n';
  for (const p of scrapedProducts) {
    dbProductsCode += `  { id: "${p.id}", title: ${JSON.stringify(p.title)}, price: ${p.price}, category: "${p.category}", customizable: false, stockStatus: "${p.stockStatus}", url: "${p.url}", description: ${JSON.stringify(p.description)} },\n`;
  }
  dbProductsCode += '];\n';
  
  fs.writeFileSync('src/db/scraped_products.ts', dbProductsCode);
  console.log('Saved to src/db/scraped_products.ts');
}

run();
