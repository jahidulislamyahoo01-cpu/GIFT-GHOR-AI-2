import fs from 'fs';
import path from 'path';
import { searchconsole, auth } from '@googleapis/searchconsole';

let cachedSearchData: string = '';
let lastFetchTime: number = 0;

export async function fetchSearchConsoleData(): Promise<string> {
  // Cache for 15 minutes (900000 ms)
  if (cachedSearchData && Date.now() - lastFetchTime < 900000) {
    return cachedSearchData;
  }

  try {
    let authClient: any = null;
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters',
    ];

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        authClient = new auth.GoogleAuth({
          credentials: {
            client_email: creds.client_email,
            private_key: creds.private_key.replace(/\\n/g, '\n'),
          },
          scopes,
        });
      } catch (e) {
        console.error('[SearchConsole] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', e);
        return 'Search Console configuration error (Invalid JSON).';
      }
    } else if (fs.existsSync(credentialsPath)) {
      authClient = new auth.GoogleAuth({
        keyFilename: credentialsPath,
        scopes,
      });
    } else {
      console.warn('[SearchConsole] Credentials missing. Skipping Search Console data.');
      return '';
    }

    const sc = searchconsole({ version: 'v1', auth: authClient });

    // Step 1: Detect available verified sites
    let siteUrl = process.env.GSC_SITE_URL || '';

    if (!siteUrl) {
      try {
        const sitesRes = await sc.sites.list({});
        const siteEntries = sitesRes.data.siteEntry || [];
        if (siteEntries.length > 0) {
          const match = siteEntries.find((s) => s.siteUrl?.includes('giftghor')) || siteEntries[0];
          siteUrl = match.siteUrl || '';
          console.log(`[SearchConsole] Auto-detected site property: ${siteUrl}`);
        }
      } catch (siteErr: any) {
        console.warn('[SearchConsole] Could not list sites automatically:', siteErr?.message || siteErr);
      }
    }

    // Fallbacks if auto-detection didn't find any or siteUrl is empty
    const candidateUrls = siteUrl
      ? [siteUrl]
      : ['sc-domain:giftghor.world', 'https://giftghor.world/', 'https://giftghor.world'];

    const endDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let queryRes: any = null;
    let pagesRes: any = null;
    let selectedSite = '';

    for (const testUrl of candidateUrls) {
      try {
        queryRes = await sc.searchanalytics.query({
          siteUrl: testUrl,
          requestBody: {
            startDate,
            endDate,
            dimensions: ['query'],
            rowLimit: 15,
          },
        });
        selectedSite = testUrl;
        break;
      } catch (err: any) {
        console.warn(`[SearchConsole] Query failed for ${testUrl}: ${err?.message || err}`);
      }
    }

    if (!selectedSite || !queryRes) {
      console.warn('[SearchConsole] Could not retrieve search data for any site candidate.');
      return 'Google Search Console: Data currently unavailable or permission not yet active.';
    }

    // Also fetch top pages
    try {
      pagesRes = await sc.searchanalytics.query({
        siteUrl: selectedSite,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 10,
        },
      });
    } catch (e: any) {
      console.warn('[SearchConsole] Could not fetch top pages:', e?.message || e);
    }

    // Format output
    let reportStr = `=== Google Search Console (Organic Search & SEO) ===\n`;
    reportStr += `Property: ${selectedSite}\n`;
    reportStr += `Period: ${startDate} to ${endDate} (Last ~28 Days)\n\n`;

    reportStr += `--- Top 15 Search Queries (Keywords driving Google traffic) ---\n`;
    const queryRows = queryRes.data?.rows || [];
    if (queryRows.length > 0) {
      queryRows.forEach((row: any) => {
        const keyword = row.keys?.[0] || 'Unknown';
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;
        const ctr = ((row.ctr || 0) * 100).toFixed(1);
        const position = (row.position || 0).toFixed(1);
        reportStr += `- "${keyword}": ${clicks} clicks, ${impressions} impressions (CTR: ${ctr}%, Avg Rank: #${position})\n`;
      });
    } else {
      reportStr += `No search query data recorded in this period.\n`;
    }

    reportStr += `\n--- Top 10 Google Search Landing Pages ---\n`;
    const pageRows = pagesRes?.data?.rows || [];
    if (pageRows.length > 0) {
      pageRows.forEach((row: any) => {
        const page = row.keys?.[0] || 'Unknown';
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;
        const ctr = ((row.ctr || 0) * 100).toFixed(1);
        const position = (row.position || 0).toFixed(1);
        reportStr += `- ${page}: ${clicks} clicks, ${impressions} impressions (CTR: ${ctr}%, Avg Rank: #${position})\n`;
      });
    } else {
      reportStr += `No search landing page data recorded in this period.\n`;
    }

    cachedSearchData = reportStr;
    lastFetchTime = Date.now();
    console.log(`[SearchConsole] Successfully fetched GSC data for ${selectedSite}`);

    return cachedSearchData;
  } catch (error: any) {
    console.error('[SearchConsole] Error fetching data:', error?.message || error);
    return cachedSearchData || `Search Console Error: ${error?.message || error}`;
  }
}
