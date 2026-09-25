const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRoute = `app.get('/api/admin/insights-dashboard', adminAuthMiddleware, async (req, res) => {
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
});`;

const newRoute = `app.get('/api/admin/insights-dashboard', adminAuthMiddleware, async (req, res) => {
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
});`;

if (code.includes(targetRoute)) {
  code = code.replace(targetRoute, newRoute);
  fs.writeFileSync('server.ts', code);
  console.log('Patched insights route');
} else {
  console.log('Route not found');
}
