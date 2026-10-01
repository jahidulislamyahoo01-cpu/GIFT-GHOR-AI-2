import { DB } from '../server.js';

let cachedFbData: string = '';
let lastFetchTime: number = 0;

export async function fetchFacebookInsights(): Promise<string> {
  // Cache for 1 hour
  if (cachedFbData && Date.now() - lastFetchTime < 3600000) {
    return cachedFbData;
  }

  try {
    // Check ENV variables or Admin DB settings
    const pageId = process.env.FACEBOOK_PAGE_ID || DB.adminSettings?.facebookPageId;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || DB.adminSettings?.facebookAccessToken;

    if (!pageId || !accessToken) {
      console.warn('[Facebook] Credentials missing. Skipping Facebook Insights.');
      return 'Facebook Insights currently unavailable (No Access Token).';
    }

    // Graph API endpoints
    // Reference: https://developers.facebook.com/docs/graph-api/reference/v19.0/page/insights
    const url = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_impressions_unique,page_engaged_users,page_views_total&period=day&date_preset=last_30d&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.error) {
      console.error('[Facebook] API Error:', data.error.message);
      return `Facebook Error: ${data.error.message}`;
    }

    let reportStr = `=== Facebook Page Insights (Last 30 Days) ===\n\n`;

    const metrics = data.data || [];
    
    const extractTotal = (metricName: string) => {
      const metric = metrics.find((m: any) => m.name === metricName);
      if (!metric || !metric.values) return 0;
      return metric.values.reduce((sum: number, val: any) => sum + (val.value || 0), 0);
    };

    const totalReach = extractTotal('page_impressions_unique');
    const totalEngagement = extractTotal('page_engaged_users');
    const totalViews = extractTotal('page_views_total');

    reportStr += `* Total Reach (Unique Impressions): ${totalReach}\n`;
    reportStr += `* Total Engaged Users: ${totalEngagement}\n`;
    reportStr += `* Total Page Views: ${totalViews}\n\n`;
    reportStr += `These metrics represent the 30-day aggregated performance of the Facebook page.\n`;

    cachedFbData = reportStr;
    lastFetchTime = Date.now();
    console.log('[Facebook] Successfully fetched Facebook insights');
    return cachedFbData;

  } catch (error: any) {
    console.error('[Facebook] Error fetching data:', error?.message || error);
    return cachedFbData || `Facebook Insights Error: ${error?.message || error}`;
  }
}
