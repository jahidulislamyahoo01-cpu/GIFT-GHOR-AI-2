const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const creds = require('./ga-credentials.json');
const client = new BetaAnalyticsDataClient({
    credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key
    }
});
client.runReport({
    property: `properties/518576178`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pageTitle' }],
    metrics: [{ name: 'activeUsers' }],
    limit: 1
}).then(res => console.log('Success')).catch(err => console.error(err));
