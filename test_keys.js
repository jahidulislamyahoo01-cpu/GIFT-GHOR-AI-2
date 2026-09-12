import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const envKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY'));
let apiKeys = [];
envKeys.forEach(key => {
  const val = process.env[key];
  if (val) apiKeys.push(...val.split(',').map(k => k.trim()));
});
apiKeys = [...new Set(apiKeys)].filter(k => k && k !== 'MY_GEMINI_API_KEY');

async function run() {
  for (const apiKey of apiKeys) {
    try {
      console.log('Testing key...', apiKey.substring(0, 5) + '...');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hi',
      });
      console.log('Success gemini-2.5-flash!', response.text);
    } catch (e) {
      console.error('gemini-2.5-flash failed:', e.message);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: 'Hi',
        });
        console.log('Success gemini-3.6-flash!', response.text);
      } catch(e2) {
        console.error('gemini-3.6-flash failed:', e2.message);
      }
    }
  }
}
run();
