import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const envKeys = Object.keys(process.env).filter(k => k.startsWith('GEMINI_API_KEY') && process.env[k]);
let apiKeys = [];
envKeys.forEach(key => {
  apiKeys.push(...process.env[key].split(',').map(k => k.trim()));
});

async function fix() {
  const content = fs.readFileSync('server.ts', 'utf8');
  console.log('Original length:', content.length);
  
  let fixed = null;
  for (const apiKey of apiKeys) {
    try {
      console.log('Trying key...', apiKey.substring(0, 5));
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `The following TypeScript file had every single lowercase 'i' accidentally deleted. Please restore all the missing 'i's. Output ONLY the raw fixed code. Do not use markdown blocks.

${content}`,
        config: {
          temperature: 0,
        }
      });
      fixed = response.text;
      break;
    } catch (e) {
      console.log('Failed:', e.message);
    }
  }

  if (fixed) {
    if (fixed.startsWith('\`\`\`typescript')) {
      fixed = fixed.replace(/^\`\`\`typescript/, '').replace(/\`\`\`$/, '');
    }
    if (fixed.startsWith('\`\`\`')) {
      fixed = fixed.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '');
    }
    fs.writeFileSync('server.ts', fixed.trim() + '\n');
    console.log('Fixed length:', fixed.length);
  } else {
    console.log('All keys failed.');
  }
}

fix().catch(console.error);
