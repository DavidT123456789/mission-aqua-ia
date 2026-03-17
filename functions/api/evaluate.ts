import { GoogleGenAI } from "@google/genai";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { idea } = body;

    if (!idea || idea.length < 20) {
      return new Response(JSON.stringify({ error: "L'idée doit contenir au moins 20 caractères." }), { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key mancante" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
      
    const modelResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash", // We fallback securely to latest 2.5 if 3 is experimental on edge
      contents: `Analyse cette idée d'innovation pour économiser l'eau : "${idea}". 
      Évalue la selon ces critères : impact écologique, faisabilité technique, précision technique, cohérence et originalité.
      
      DIRECTIVES D'ÉVALUATION :
      - Cohérence et Clarté : Une idée logique, bien expliquée et réaliste doit obtenir un bon score (60-75%), même sans jargon technique.
      - Précision Technique : Récompense l'utilisation judicieuse de termes techniques (ex: FFT, capteurs, IoT, IA spécialisée). C'est ce qui permet de passer d'un bon score à l'EXCELLENCE (80-100%).
      - PÉNALITÉ DE BRIÈVETÉ : Si la description est trop vague (ex: "une appli pour les fuites") ou fait moins de 2 phrases, le score global ne doit PAS dépasser 40-50%, car l'innovation n'est pas assez documentée.
      - Équilibre : Ne punis pas l'absence de termes techniques si l'explication est brillante, mais valorise leur présence s'ils sont bien utilisés.
      - Sois encourageant : L'objectif est de valoriser l'effort de réflexion et la créativité scientifique.
      
      Réponds au format JSON avec les champs suivants : 
      title (nom de l'outil), 
      description (résumé technique), 
      impact (note sur 10), 
      feasibility (note sur 10), 
      precision (note sur 10 du niveau de détail et de rigueur),
      originality (note sur 10),
      score (note globale sur 100),
      waterSaved (estimation de litres sauvés par an),
      feedback (conseil constructif pour améliorer l'idée).`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(modelResponse.text);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || "Erreur lors de l'analyse" }), { status: 500 });
  }
}
