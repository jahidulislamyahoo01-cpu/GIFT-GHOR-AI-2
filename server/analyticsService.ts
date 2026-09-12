import fs from 'fs';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';

let cachedAnalyticsData: string = '';
let lastFetchTime: number = 0;

export async function fetchAnalyticsData(): Promise<string> {
  // Cache for 1 hour (300000 ms)
  if (cachedAnalyticsData && Date.now() - lastFetchTime < 300000) {
    return cachedAnalyticsData;
  }

  try {
    const propertyId = '518576178';
    
    let authOptions = {};
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        authOptions = { 
          credentials: { 
            client_email: creds.client_email, 
            private_key: creds.private_key 
          } 
        };
      } catch (e) {
        console.error('[Analytics] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', e);
        return 'Analytics configuration error (Invalid JSON).';
      }
    } else if (fs.existsSync(credentialsPath)) {
      authOptions = { keyFilename: credentialsPath };
    } else {
      console.warn('[Analytics] GA credentials missing. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON env var or provide ga-credentials.json');
      return 'Analytics data currently unavailable.';
    }

    const analyticsDataClient = new BetaAnalyticsDataClient(authOptions);

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

    // Report 4: Daily Traffic (Last 7 Days)
    const [dailyResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: true,
        },
      ],
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

    reportStr += '\n--- Daily Traffic (Last 7 Days) ---\n';
    if (dailyResponse.rows && dailyResponse.rows.length > 0) {
      dailyResponse.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
           const dateStr = row.dimensionValues[0].value;
           const formattedDate = dateStr ? (dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8)) : 'Unknown';
           reportStr += `- ${formattedDate}: ${row.metricValues[1].value} views (${row.metricValues[0].value} users)\n`;
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
    return cachedAnalyticsData || 'Analytics Error: ' + (error?.message || error);
  }
}
