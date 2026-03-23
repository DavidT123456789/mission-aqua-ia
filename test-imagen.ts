import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A futuristic water saving device',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png'
      }
    });
    console.log("Success! Generated.");
  } catch (error: any) {
    console.error("Content generation error:", error.message || error);
  }
}
test();
