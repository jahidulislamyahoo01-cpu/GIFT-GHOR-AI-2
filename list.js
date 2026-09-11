import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const envKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY') && process.env[k]);
const apiKey = process.env[envKeys[0]].split(',')[0].trim();

const ai = new GoogleGenAI({ apiKey });

async function list() {
  const res = await ai.models.list();
  for await (const m of res) {
    console.log(m.name);
  }
}
list().catch(console.error);
