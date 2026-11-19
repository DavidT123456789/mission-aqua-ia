import { GoogleGenAI } from "@google/genai";
import { FALLBACK_PROTOTYPE_DATA_URI } from "../../shared/fallbackPrototype";

export async function onRequestPost({ request, env }) {
  const fallbackImageUrl = FALLBACK_PROTOTYPE_DATA_URI;

  try {
    const body = await request.json();
    const rawTitle = body?.title;
    const rawDescription = body?.description;

    if (typeof rawTitle !== 'string' || typeof rawDescription !== 'string') {
      return new Response(JSON.stringify({ error: "Missing title or description" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const title = rawTitle.trim().slice(0, 120);
    const description = rawDescription.trim().slice(0, 600);

    if (!title || !description) {
      return new Response(JSON.stringify({ error: "Missing title or description" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ imageUrl: fallbackImageUrl }), {
        headers: { "Content-Type": "application/json" }
      });
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
    const parts = imageModel.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    return new Response(JSON.stringify({ imageUrl: imageUrl || fallbackImageUrl }), {
        headers: { "Content-Type": "application/json" }
    });
  } catch(error) {
    console.error("Image generation failed, using fallback image:", error);
    return new Response(JSON.stringify({ imageUrl: fallbackImageUrl }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
