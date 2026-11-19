import dotenv from 'dotenv';
// Charger les variables d'environnement (.env.local en priorité, puis .env)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { DEV_ANSWERS } from './shared/devAnswers';
import { FALLBACK_PROTOTYPE_DATA_URI } from './shared/fallbackPrototype';
import { evaluateStudentIdea, validateIdeaInput } from './shared/evaluateIdea';

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '64kb' }));

  // API Routes
  app.post('/api/dev-auth', (req, res) => {
    const { password } = req.body || {};
    const expectedPassword = process.env.DEV_PASSWORD?.trim() || 'dev123';

    if (typeof password !== 'string' || !timingSafeStringEqual(password, expectedPassword)) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    return res.json({ answers: DEV_ANSWERS });
  });

  app.post('/api/evaluate', async (req, res) => {
    try {
      const validation = validateIdeaInput(req.body?.idea);
      if (validation.ok === false) {
        return res.status(400).json({ error: validation.error });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Clé API manquante" });
      }

      const data = await evaluateStudentIdea(apiKey, validation.idea);
      return res.json(data);
    } catch (error: unknown) {
      console.error(error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Erreur lors de l'analyse" });
    }
  });

  app.post('/api/generate', async (req, res) => {
    const fallbackImageUrl = FALLBACK_PROTOTYPE_DATA_URI;
    try {
      const rawTitle = req.body?.title;
      const rawDescription = req.body?.description;

      if (typeof rawTitle !== 'string' || typeof rawDescription !== 'string') {
        return res.status(400).json({ error: "Missing title or description" });
      }

      const title = rawTitle.trim().slice(0, 120);
      const description = rawDescription.trim().slice(0, 600);
      if (!title || !description) {
        return res.status(400).json({ error: "Missing title or description" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY absente, utilisation de l'image de secours.");
        return res.json({ imageUrl: fallbackImageUrl });
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const imageModel = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `A futuristic, high-tech, eco-friendly invention called "${title}". Description: ${description}. Style: 3D render, clean, bright, emerald and cyan colors, professional product design, white background, high quality. No text in the image.`,
              },
            ],
          },
        });

        let imageUrl: string | null = null;
        const parts = imageModel.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }

        return res.json({ imageUrl: imageUrl || fallbackImageUrl });
      } catch (genError) {
        console.warn("Gemini image generation failed, using fallback image.", genError);
        return res.json({ imageUrl: fallbackImageUrl });
      }
    } catch(error: unknown) {
      console.error(error);
      return res.json({ imageUrl: fallbackImageUrl });
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
