import { GoogleGenAI } from "@google/genai";

export async function onRequestPost({ request, env }) {
  try {
    const { title, description } = await request.json();
    
    if (!title || !description) {
      return new Response(JSON.stringify({ error: "Missing title or description" }), { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
      
    const imageModel = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A futuristic, high-tech, eco-friendly invention called "${title}". 
            Description: ${description}. 
            Style: 3D render, clean, bright, emerald and cyan colors, professional product design, 
            white background, high quality, 4k. No text in the image.`,
          },
        ],
      },
    });

    let imageUrl = null;
    for (const part of imageModel.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    return new Response(JSON.stringify({ imageUrl }), {
        headers: { "Content-Type": "application/json" }
    });
  } catch(error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || "Erreur de génération d'image" }), { status: 500 });
  }
}
