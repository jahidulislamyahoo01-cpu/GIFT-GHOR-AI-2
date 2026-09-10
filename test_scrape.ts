import * as cheerio from 'cheerio';

async function testScrape() {
  const url = 'https://giftghor.world/products/1333107';
  console.log('Fetching', url);
  const res = await fetch(url);
  const text = await res.text();
  
  // Look for any obvious JSON or script tags that might contain the product data
  const $ = cheerio.load(text);
  
  // Print page title
  console.log('Title:', $('title').text());
  
  // Let's see if there is a nextjs state or similar
  const scriptTags = $('script').map((i, el) => $(el).html()).get();
  const productData = scriptTags.find(s => s.includes('1333107') && (s.includes('price') || s.includes('variant')));
  
  if (productData) {
    console.log('Found product data in a script tag! Length:', productData.length);
    console.log(productData.substring(0, 500));
  } else {
    console.log('No obvious JSON found. Trying to extract from DOM...');
    console.log('H1:', $('h1').text());
    console.log('Price elements:', $('[class*="price"], [class*="Price"]').text().substring(0, 200));
  }
}

testScrape();
