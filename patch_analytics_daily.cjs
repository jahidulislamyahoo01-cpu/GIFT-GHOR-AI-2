const fs = require('fs');
let code = fs.readFileSync('server/analyticsService.ts', 'utf8');

// Update cache time
code = code.replace(/3600000/g, '300000'); // 5 minutes cache

const injectionTarget = `    // Report 3: Device Category`;
const newReportBlock = `    // Report 4: Daily Traffic (Last 7 Days)
    const [dailyResponse] = await analyticsDataClient.runReport({
      property: \`properties/\${propertyId}\`,
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

    // Report 3: Device Category`;

code = code.replace(injectionTarget, newReportBlock);

const appendTarget = `    reportStr += '\\n--- Top Devices Used ---\\n';`;
const newAppendBlock = `    reportStr += '\\n--- Daily Traffic (Last 7 Days) ---\\n';
    if (dailyResponse.rows && dailyResponse.rows.length > 0) {
      dailyResponse.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
           const dateStr = row.dimensionValues[0].value;
           const formattedDate = dateStr ? (dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8)) : 'Unknown';
           reportStr += \`- \${formattedDate}: \${row.metricValues[1].value} views (\${row.metricValues[0].value} users)\\n\`;
        }
      });
    } else {
      reportStr += 'No data available.\\n';
    }
    
    reportStr += '\\n--- Top Devices Used ---\\n';`;

code = code.replace(appendTarget, newAppendBlock);

fs.writeFileSync('server/analyticsService.ts', code);
console.log("Patched daily reports");
