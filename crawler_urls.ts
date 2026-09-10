import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const DB_FILE = path.join(process.cwd(), 'data_storage.json');
const dbRaw = fs.readFileSync(DB_FILE, 'utf-8');
const DB = JSON.parse(dbRaw);

const urls = [
  'https://giftghor.world/checkout',
  'https://giftghor.world/categories/217915?selected_category=217915&category_id=217915',
  'https://giftghor.world/categories/204464?selected_category=204464&category_id=204464',
  'https://giftghor.world/categories/204461?selected_category=204461&category_id=204461',
  'https://giftghor.world/about-us'
];

async function crawlUrls() {
  for (const url of urls) {
    try {
      console.log(`Crawling ${url}...`);
      const response = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      const title = $('title').text() || 'Gift Ghor Page';
      let jsonText = '';
      $('script').each((i, el) => {
        const scriptContent = $(el).html() || '';
        if (scriptContent.includes('self.__next_f.push')) {
          jsonText += scriptContent.replace(/[^a-zA-Z0-9\u0980-\u09FF\s\.\,\:\-]/g, ' ') + ' ';
        }
      });
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      const combinedContent = `Title: ${title}\nText: ${bodyText}\nInternal Data: ${jsonText.substring(0, 5000)}`;

      const id = url.split('/').pop()?.substring(0, 30) || url.substring(0, 30);
      const existingIndex = DB.crawledPages.findIndex((c: any) => c.url === url);
      const crawledData = {
        id: id,
        url: url,
        title: title,
        pageType: 'page',
        status: 'success',
        wordCount: combinedContent.split(' ').length,
        itemsFound: 1,
        crawledAt: new Date().toISOString(),
        contentSummary: combinedContent.substring(0, 2000) + '... (auto-updated from giftghor.world)'
      };

      if (existingIndex >= 0) {
        DB.crawledPages[existingIndex] = crawledData;
      } else {
        DB.crawledPages.push(crawledData);
      }
      console.log(`Successfully crawled ${url}`);
    } catch (err) {
      console.error(`Failed to crawl ${url}:`, err);
    }
  }

  // Also modify the welcomeMessage in DB
  DB.branding.welcomeMessage = 'আসসালামু আলাইকুম আপু/ভাইয়া, আপনাকে কীভাবে সাহায্য করতে পারি?';

  fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), 'utf-8');
  console.log('Saved DB');
}

crawlUrls();
