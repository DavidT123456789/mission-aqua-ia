import { GoogleGenAI } from "@google/genai";

export async function onRequestPost({ request, env }) {
  const fallbackImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1024&auto=format&fit=crop";

  try {
    const { title, description } = await request.json();
    
    if (!title || !description) {
      return new Response(JSON.stringify({ error: "Missing title or description" }), { status: 400 });
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
