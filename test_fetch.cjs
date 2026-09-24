const { fetchAnalyticsData } = require('./server/analyticsService.ts');
fetchAnalyticsData().then(console.log).catch(console.error);
