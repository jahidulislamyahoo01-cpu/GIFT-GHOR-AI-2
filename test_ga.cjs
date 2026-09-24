const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function test() {
  try {
    const propertyId = '518576178';
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });
    const [pageResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      limit: 2,
    });
    console.log("Success:", JSON.stringify(pageResponse));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
