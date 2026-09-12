const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
app.post('/api/admin/ai-assistant', adminAuthMiddleware, async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'Invalid history payload' });
    }

    const envKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY'));
    let apiKeys = [];
    envKeys.forEach(key => {
      const val = process.env[key];
      if (val) apiKeys.push(...val.split(',').map(k => k.trim()));
    });
    apiKeys = [...new Set(apiKeys)].filter(k => k && k !== 'MY_GEMINI_API_KEY');

    if (apiKeys.length === 0) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const systemInstruction = "You are an expert AI Business Assistant, Digital Marketer, and Strategist for 'Gift Ghor'. You are talking directly to the Owner of the business. Do NOT talk like a customer service bot. Your job is to help the owner with ad copy, business strategy, data analysis, and product ideas. Be professional, creative, and proactive. Provide well-formatted answers with emojis where appropriate. Base your knowledge on the following business context:\\n\\n" + buildSystemKnowledgeContext(DB);
    let botReplyText = '';

    for (const apiKey of apiKeys) {
      try {
        const ai = new (require('@google/genai').GoogleGenAI)({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: history,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });
        botReplyText = response.text || '';
        if (botReplyText) break;
      } catch (keyErr) {
        console.error('API key failed for admin AI, trying next:', keyErr);
      }
    }

    if (!botReplyText) {
      return res.status(500).json({ error: 'All API keys failed or no response generated.' });
    }

    res.json({ reply: botReplyText });
  } catch (err) {
    console.error('Admin AI Assistant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
`;

code = code.replace(
  "app.post('/api/admin/branding', adminAuthMiddleware, (req, res) => {",
  routeCode + "\napp.post('/api/admin/branding', adminAuthMiddleware, (req, res) => {"
);

fs.writeFileSync('server.ts', code);
