const fs = require('fs');
let code = fs.readFileSync('server/analyticsService.ts', 'utf8');

code = code.replace(
  "return cachedAnalyticsData || 'Analytics data currently unavailable or API not enabled properly yet.';",
  "return cachedAnalyticsData || 'Analytics Error: ' + (error?.message || error);"
);

fs.writeFileSync('server/analyticsService.ts', code);
console.log("Patched analyticsService");
