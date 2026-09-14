const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importAnalytics = `import { fetchAnalyticsData } from './server/analyticsService.js';
import { fetchSearchConsoleData } from './server/searchConsoleService.js';`;
const newImportAnalytics = `import { fetchAnalyticsData } from './server/analyticsService.js';
import { fetchSearchConsoleData } from './server/searchConsoleService.js';
import { fetchFacebookInsights } from './server/facebookInsightsService.js';`;

code = code.replace(importAnalytics, newImportAnalytics);

const searchConsoleContextBlock = `    try {
      const searchConsoleContext = await fetchSearchConsoleData();
      if (searchConsoleContext) {
        systemInstruction += \`\\n\\nGOOGLE SEARCH CONSOLE (SEO & ORGANIC SEARCH) DATA:\\n\${searchConsoleContext}\\nUse this data to answer questions about Google search keywords, clicks, impressions, CTR, SEO ranking positions, and organic search optimization recommendations.\`;
      }
    } catch (e) {
      console.warn('Could not fetch search console data', e);
    }`;

const facebookContextBlock = `    try {
      const searchConsoleContext = await fetchSearchConsoleData();
      if (searchConsoleContext) {
        systemInstruction += \`\\n\\nGOOGLE SEARCH CONSOLE (SEO & ORGANIC SEARCH) DATA:\\n\${searchConsoleContext}\\nUse this data to answer questions about Google search keywords, clicks, impressions, CTR, SEO ranking positions, and organic search optimization recommendations.\`;
      }
    } catch (e) {
      console.warn('Could not fetch search console data', e);
    }
    try {
      const fbContext = await fetchFacebookInsights();
      if (fbContext && !fbContext.includes('currently unavailable')) {
        systemInstruction += \`\\n\\nFACEBOOK PAGE INSIGHTS:\\n\${fbContext}\\nUse this data to answer questions about social media performance, Facebook page reach, engagement, and impressions.\`;
      }
    } catch (e) {
      console.warn('Could not fetch facebook insights', e);
    }`;

if(code.includes(searchConsoleContextBlock)) {
   code = code.replace(searchConsoleContextBlock, facebookContextBlock);
} else {
   console.log("Could not find search console block for injection.");
}

const endpointsBlock = `// --- API ROUTES ---`;
const insightsEndpoint = `// --- API ROUTES ---

// Admin Insights Dashboard
app.get('/api/admin/insights-dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const analyticsContext = await fetchAnalyticsData();
    const searchConsoleContext = await fetchSearchConsoleData();
    const fbContext = await fetchFacebookInsights();
    
    res.json({
      analytics: analyticsContext,
      searchConsole: searchConsoleContext,
      facebook: fbContext
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});
`;

code = code.replace(endpointsBlock, insightsEndpoint);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts with insights');
