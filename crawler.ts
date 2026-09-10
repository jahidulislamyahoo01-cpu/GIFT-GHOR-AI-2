// -------------------------------------------------------------
// Auto Web Crawler Job (Updates Knowledge twice a day)
// -------------------------------------------------------------
async function crawlGiftGhor() {
  console.log('[Crawler] Starting auto-crawl of giftghor.world...');
  try {
    const response = await axios.get('https://giftghor.world/', { timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Extract metadata
    const title = $('title').text() || 'Gift Ghor';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract text from next data
    let jsonText = '';
    $('script').each((i, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.includes('self.__next_f.push')) {
        jsonText += scriptContent.replace(/[^a-zA-Z0-9\u0980-\u09FF\s\.\,\:\-]/g, ' ') + ' ';
      }
    });

    // Extract visible body text (headings, paragraphs)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    const combinedContent = `Title: ${title}\nDescription: ${metaDescription}\nText: ${bodyText}\nInternal Data: ${jsonText.substring(0, 5000)}`;

    const existingIndex = DB.crawledPages.findIndex(c => c.id === 'homepage');
    const crawledData = {
      id: 'homepage',
      url: 'https://giftghor.world/',
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
    
    // Also try to find return policy and delivery text
    const lowerBody = (bodyText + ' ' + jsonText).toLowerCase();
    if (lowerBody.includes('return') || lowerBody.includes('রিটার্ন')) {
      const sentences = (bodyText + ' ' + jsonText).split(/(?<=[.।])/);
      const returnSentences = sentences.filter(s => s.toLowerCase().includes('return') || s.includes('রিটার্ন'));
      if (returnSentences.length > 0) {
         const foundText = returnSentences.join(' ').replace(/\s+/g, ' ').substring(0, 200);
         if (foundText.length > 10) {
             DB.deliveryPolicy.returnPolicyText = foundText + '... (auto-updated from giftghor.world)';
         }
      }
    }

    saveDB(DB);
    console.log('[Crawler] Successfully updated knowledge base from giftghor.world');
  } catch (err) {
    console.error('[Crawler] Failed to crawl giftghor.world:', err);
  }
}

// Run crawler on startup, then every 12 hours
crawlGiftGhor();
cron.schedule('0 */12 * * *', () => {
  crawlGiftGhor();
});
