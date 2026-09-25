const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    const systemInstruction = "You are an expert AI Business Assistant, Digital Marketer, and Strategist for 'Gift Ghor'. You are talking directly to the Owner of the business. Do NOT talk like a customer service bot. Your job is to help the owner with ad copy, business strategy, data analysis, and product ideas. Be professional, creative, and proactive. Provide well-formatted answers with emojis where appropriate. Base your knowledge on the following business context:\\n\\n" + buildSystemKnowledgeContext(DB);`;

const newStr = `    let systemInstruction = "You are an expert AI Business Assistant, Digital Marketer, and Strategist for 'Gift Ghor'. You are talking directly to the Owner of the business. Do NOT talk like a customer service bot. Your job is to help the owner with ad copy, business strategy, data analysis, and product ideas. Be professional, creative, and proactive. Provide well-formatted answers with emojis where appropriate. Base your knowledge on the following business context:\\n\\n" + buildSystemKnowledgeContext(DB);
    try {
      const analyticsContext = await fetchAnalyticsData();
      if (analyticsContext) {
        systemInstruction += \`\\n\\nREAL-TIME WEBSITE ANALYTICS DATA:\\n\${analyticsContext}\\nUse this data to answer questions about which pages or products are most viewed or popular.\`;
      }
    } catch (e) {
      console.warn('Could not fetch analytics data', e);
    }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    console.log('Successfully patched admin AI with analytics context');
} else {
    console.log('Could not find target string in admin AI');
}

fs.writeFileSync('server.ts', code);
