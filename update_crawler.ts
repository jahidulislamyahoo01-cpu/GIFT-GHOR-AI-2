import fs from 'fs';
const serverFile = fs.readFileSync('server.ts', 'utf-8');

const newCrawlerFunc = `async function crawlGiftGhor() {
  console.log('[Crawler] Starting auto-crawl of giftghor.world and subpages...');
  const urls = [
    'https://giftghor.world/',
    'https://giftghor.world/checkout',
    'https://giftghor.world/categories/217915?selected_category=217915&category_id=217915',
    'https://giftghor.world/categories/204464?selected_category=204464&category_id=204464',
    'https://giftghor.world/categories/204461?selected_category=204461&category_id=204461',
    'https://giftghor.world/about-us'
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      const title = $('title').text() || 'Gift Ghor';
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      let jsonText = '';
      $('script').each((i, el) => {
        const scriptContent = $(el).html() || '';
        if (scriptContent.includes('self.__next_f.push')) {
          jsonText += scriptContent.replace(/[^a-zA-Z0-9\u0980-\u09FF\s\\.\\,\\:\\-]/g, ' ') + ' ';
        }
      });

      const bodyText = $('body').text().replace(/\\s+/g, ' ').trim();
      
      const combinedContent = \`Title: \${title}\\nDescription: \${metaDescription}\\nText: \${bodyText}\\nInternal Data: \${jsonText.substring(0, 5000)}\`;

      const id = url === 'https://giftghor.world/' ? 'homepage' : (url.split('/').pop()?.substring(0, 30) || url.substring(0, 30));
      const existingIndex = DB.crawledPages.findIndex((c: any) => c.id === id || c.url === url);
      const crawledData = {
        id: id,
        url: url,
        title: title,
        pageType: 'page' as const,
        status: 'success' as const,
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
      
      if (url === 'https://giftghor.world/') {
        const lowerBody = (bodyText + ' ' + jsonText).toLowerCase();
        if (lowerBody.includes('return') || lowerBody.includes('রিটার্ন')) {
          const sentences = (bodyText + ' ' + jsonText).split(/(?<=[.।])/);
          const returnSentences = sentences.filter(s => s.toLowerCase().includes('return') || s.includes('রিটার্ন'));
          if (returnSentences.length > 0) {
             const foundText = returnSentences.join(' ').replace(/\\s+/g, ' ').substring(0, 200);
             if (foundText.length > 10) {
                 DB.deliveryPolicy.returnPolicyText = foundText + '... (auto-updated from giftghor.world)';
             }
          }
        }
      }
      console.log(\`[Crawler] Successfully updated knowledge base from \${url}\`);
    } catch (err) {
      console.error(\`[Crawler] Failed to crawl \${url}:\`, err);
    }
  }
  saveDB(DB);
}`;

const startIndex = serverFile.indexOf('async function crawlGiftGhor() {');
const endIndex = serverFile.indexOf('// Run crawler on startup', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newServerFile = serverFile.substring(0, startIndex) + newCrawlerFunc + '\n\n' + serverFile.substring(endIndex);
  fs.writeFileSync('server.ts', newServerFile, 'utf-8');
  console.log('Successfully updated crawler function in server.ts');
} else {
  console.log('Could not find crawler function bounds');
}
