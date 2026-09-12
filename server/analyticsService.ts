import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';

let cachedAnalyticsData: string = '';
let lastFetchTime: number = 0;

export async function fetchAnalyticsData(): Promise<string> {
  // Cache for 1 hour (3600000 ms)
  if (cachedAnalyticsData && Date.now() - lastFetchTime < 3600000) {
    return cachedAnalyticsData;
  }

  try {
    const propertyId = '518576178';
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });

    // Report 1: Page Views & Users
    const [pageResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 10,
    });

    // Report 2: Traffic Source
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [
        {
          metric: { metricName: 'activeUsers' },
          desc: true,
        },
      ],
      limit: 5,
    });

    // Report 3: Device Category
    const [deviceResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [
        {
          metric: { metricName: 'activeUsers' },
          desc: true,
        },
      ],
    });

    let reportStr = '=== Website Analytics (Last 30 Days) ===\n\n';
    
    reportStr += '--- Top 10 Most Visited Pages ---\n';
    if (pageResponse.rows && pageResponse.rows.length > 0) {
      pageResponse.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
           reportStr += `- ${row.dimensionValues[0].value}: ${row.metricValues[1].value} views (${row.metricValues[0].value} users)\n`;
        }
      });
    } else {
      reportStr += 'No data available.\n';
    }

    reportStr += '\n--- Top Traffic Sources ---\n';
    if (trafficResponse.rows && trafficResponse.rows.length > 0) {
      trafficResponse.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
           reportStr += `- ${row.dimensionValues[0].value}: ${row.metricValues[0].value} users\n`;
        }
      });
    } else {
      reportStr += 'No data available.\n';
    }

    reportStr += '\n--- Top Devices Used ---\n';
    if (deviceResponse.rows && deviceResponse.rows.length > 0) {
      deviceResponse.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
           reportStr += `- ${row.dimensionValues[0].value}: ${row.metricValues[0].value} users\n`;
        }
      });
    } else {
      reportStr += 'No data available.\n';
    }

    cachedAnalyticsData = reportStr;
    lastFetchTime = Date.now();
    console.log('[Analytics] Successfully fetched latest GA4 data');
    
    return cachedAnalyticsData;

  } catch (error: any) {
    console.error('[Analytics] Error fetching data:', error?.message || error);
    return cachedAnalyticsData || 'Analytics data currently unavailable or API not enabled properly yet.';
  }
}
