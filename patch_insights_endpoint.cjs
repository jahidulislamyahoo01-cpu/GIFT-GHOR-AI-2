const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = `// Store Configuration & Branding`;
const endpoint = `
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
  } catch (error: any) {
    console.error('Insights Dashboard Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch insights' });
  }
});

// Store Configuration & Branding`;

if (!code.includes('/api/admin/insights-dashboard')) {
  if (code.includes(anchor)) {
    code = code.replace(anchor, endpoint);
    fs.writeFileSync('server.ts', code);
    console.log('Added endpoint');
  } else {
    console.log('Anchor not found');
  }
} else {
  console.log('Endpoint already exists');
}
