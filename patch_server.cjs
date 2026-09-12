const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix model version
code = code.replace(/gemini-3\.6-flash/g, 'gemini-2.5-flash');

// We need to carefully remove the analytics data insertion from the customer chat endpoint
// which is around line 901 in app.post('/api/chat/message' ... )

// The user is concerned about "analytics r" leaking in customer panel.
// We should remove this block:
/*
      try {
        const analyticsContext = await fetchAnalyticsData();
        if (analyticsContext) {
          systemInstruction += `\n\nREAL-TIME WEBSITE ANALYTICS DATA:\n${analyticsContext}\nUse this data to answer questions about which pages or products are most viewed or popular.`;
        }
      } catch (e) {
        console.warn('Could not fetch analytics data', e);
      }
*/

const analyticsLeak = `      try {
        const analyticsContext = await fetchAnalyticsData();
        if (analyticsContext) {
          systemInstruction += \`\\n\\nREAL-TIME WEBSITE ANALYTICS DATA:\\n\${analyticsContext}\\nUse this data to answer questions about which pages or products are most viewed or popular.\`;
        }
      } catch (e) {
        console.warn('Could not fetch analytics data', e);
      }`;

if (code.includes(analyticsLeak)) {
    code = code.replace(analyticsLeak, '');
    console.log("Successfully removed analytics leak from API");
} else {
    // maybe it is slightly different formatted
    code = code.replace(/try\s*\{\s*const analyticsContext = await fetchAnalyticsData\(\);\s*if \(analyticsContext\)\s*\{\s*systemInstruction \+= [^}]*\}\s*catch\s*\(e\)\s*\{\s*console\.warn\('Could not fetch analytics data', e\);\s*\}/g, '');
    console.log("Replaced with regex");
}

fs.writeFileSync('server.ts', code);
