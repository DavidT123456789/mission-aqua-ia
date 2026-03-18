import dotenv from 'dotenv';
// Charger les variables d'environnement (.env.local en priorité, puis .env)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/evaluate', async (req, res) => {
    try {
      const { idea } = req.body;

      if (!idea || idea.length < 20) {
        return res.status(400).json({ error: "L'idée doit contenir au moins 20 caractères." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API Key mancante" });
      }

      const ai = new GoogleGenAI({ apiKey });
        
      const modelResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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

      return res.json(data);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || "Erreur lors de l'analyse" });
    }
  });

  app.post('/api/generate', async (req, res) => {
    try {
      const { title, description } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: "Missing title or description" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API key" });
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

      return res.json({ imageUrl });
    } catch(error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || "Erreur de génération d'image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
