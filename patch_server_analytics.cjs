const fs = require('fs');

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

if (!code.includes('import { fetchAnalyticsData }')) {
  code = code.replace(
    "import {",
    "import { fetchAnalyticsData } from './server/analyticsService.js';\nimport {"
  );
}

if (!code.includes('REAL-TIME WEBSITE ANALYTICS DATA:')) {
  code = code.replace(
    "let systemInstruction = buildSystemKnowledgeContext(DB);",
    "let systemInstruction = buildSystemKnowledgeContext(DB);\n      try {\n        const analyticsContext = await fetchAnalyticsData();\n        if (analyticsContext) {\n          systemInstruction += `\\n\\nREAL-TIME WEBSITE ANALYTICS DATA:\\n${analyticsContext}\\nUse this data to answer questions about which pages or products are most viewed or popular.`;\n        }\n      } catch (e) {\n        console.warn('Could not fetch analytics data', e);\n      }"
  );
}

fs.writeFileSync(serverFile, code);
console.log('Successfully patched server.ts with analytics data context.');
