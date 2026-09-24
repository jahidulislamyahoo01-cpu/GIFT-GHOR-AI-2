const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetFunction = `async function crawlGiftGhor() {
  console.log('[Crawler] Starting auto-crawl of giftghor.world sitemap...');
  try {
    const sitemapRes = await axios.get('https://giftghor.world/api/sitemaps.xml', { timeout: 15000 });
    const $sm = cheerio.load(sitemapRes.data, { xmlMode: true });
    const urls = [];
    $sm('loc').each((_, el) => {
      urls.push($sm(el).text());
    });
    console.log(\`[Crawler] Found \${urls.length} URLs in sitemap\`);
    
    for (const url of urls) {
      if (url.includes('/categories')) continue;
      try {
        const response = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(response.data);
        
        const title = $('title').text() || 'Gift Ghor';
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        let jsonText = '';
        $('script').each((_, el) => {
          const scriptContent = $(el).html() || '';
          if (scriptContent.includes('self.__next_f.push')) {
            jsonText += scriptContent.replace(/[^a-zA-Z0-9ঀ-৿\\s\\.\\,\\:\\-]/g, ' ') + ' ';
          }
        });
        
        let imageText = '';
        $('img').each((_, el) => {
          const src = $(el).attr('src');
          if (src && src.includes('original.jpg')) {
             imageText += \`Image: \${src}\\n\`;
          }
        });
        const imgRegex = /https:\\/\\/assets\\.zatqeasy\\.com[^\\\\]+?original\\.(jpg|png|jpeg)/g;
        let match;
        while ((match = imgRegex.exec(jsonText)) !== null) {
          imageText += \`Image: \${match[0]}\\n\`;
        }
        
        const bodyText = $('body').text().replace(/\\s+/g, ' ').trim();
        const combinedContent = \`Title: \${title}\\nDescription: \${metaDescription}\\nImages:\\n\${imageText}\\nText: \${bodyText}\\nInternal Data: \${jsonText.substring(0, 5000)}\`;
        
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
          contentSummary: combinedContent.substring(0, 2000) + '... (auto-updated from sitemap)'
        };
        
        if (existingIndex >= 0) {
          DB.crawledPages[existingIndex] = crawledData;
        } else {
          DB.crawledPages.push(crawledData);
        }
      } catch (err) {
        console.error(\`[Crawler] Failed to crawl \${url}:\`, err.message);
      }
    }
    saveDB(DB);
    console.log('[Crawler] Auto-crawl finished successfully.');
  } catch (err) {
    console.error('[Crawler] Failed to fetch sitemap:', err.message);
  }
}`;

const newFunction = `async function crawlGiftGhor() {
  console.log('[Crawler] Starting auto-crawl of giftghor.world sitemap...');
  try {
    const sitemapRes = await axios.get('https://giftghor.world/api/sitemaps.xml', { timeout: 15000 });
    const $sm = cheerio.load(sitemapRes.data, { xmlMode: true });
    const urls: string[] = [];
    $sm('loc').each((_, el) => {
      urls.push($sm(el).text());
    });
    console.log(\`[Crawler] Found \${urls.length} URLs in sitemap\`);
    
    let updatedCount = 0;
    for (const url of urls) {
      if (url.includes('/categories')) continue;
      try {
        const response = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(response.data);
        
        const title = $('title').text() || 'Gift Ghor';
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        let jsonText = '';
        $('script').each((_, el) => {
          const scriptContent = $(el).html() || '';
          if (scriptContent.includes('self.__next_f.push')) {
            jsonText += scriptContent.replace(/[^a-zA-Z0-9ঀ-৿\\s\\.\\,\\:\\-]/g, ' ') + ' ';
          }
        });
        
        let imageText = '';
        $('img').each((_, el) => {
          const src = $(el).attr('src');
          if (src && src.includes('original.jpg')) {
             imageText += \`Image: \${src}\\n\`;
          }
        });
        const imgRegex = /https:\\/\\/assets\\.zatqeasy\\.com[^\\\\]+?original\\.(jpg|png|jpeg)/g;
        let match;
        while ((match = imgRegex.exec(jsonText)) !== null) {
          imageText += \`Image: \${match[0]}\\n\`;
        }
        
        const bodyText = $('body').text().replace(/\\s+/g, ' ').trim();
        const combinedContent = \`Title: \${title}\\nDescription: \${metaDescription}\\nImages:\\n\${imageText}\\nText: \${bodyText}\\nInternal Data: \${jsonText.substring(0, 5000)}\`;
        
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
          contentSummary: combinedContent
        };
        
        if (existingIndex >= 0) {
          DB.crawledPages[existingIndex] = crawledData;
        } else {
          DB.crawledPages.push(crawledData);
        }
        updatedCount++;
      } catch (err: any) {
        console.error(\`[Crawler] Failed to crawl \${url}:\`, err.message);
      }
    }
    saveDB(DB);
    console.log(\`[Crawler] Auto-crawl finished successfully. Updated \${updatedCount} pages.\`);
  } catch (err: any) {
    console.error('[Crawler] Failed to fetch sitemap:', err.message);
  }
}`;

if (code.includes(targetFunction)) {
  code = code.replace(targetFunction, newFunction);
  fs.writeFileSync('server.ts', code);
  console.log('Patched crawlGiftGhor to save full combined content in contentSummary');
} else {
  console.log('Could not find crawlGiftGhor function');
}
