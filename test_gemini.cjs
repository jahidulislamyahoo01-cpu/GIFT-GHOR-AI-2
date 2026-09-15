require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: "Hello" }] }],
      config: {
        systemInstruction: "You are a test bot",
        temperature: 0.8,
      },
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
