<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mission Aqua IA 🌊🤖

Un escape game éducatif sur l'intelligence artificielle et la consommation d'eau, conçu pour les collégiens.

**Développé par David Trafial**

## ⏱️ Organisation en classe & Kit Enseignant

- **Chronomètre de mission (40 min)** : couvre les **Niveaux 1 à 12** hors écrans de transition (le chrono se met automatiquement en pause pendant chaque transition et pendant tout le Niveau 13).
- **Durée réelle du parcours complet** : compter **55 à 75 minutes** en incluant les lectures, les 12 écrans de transition, l'Innovation Lab (Niveau 13), les 2 défis bonus de fin et l'export du dossier A4, soit idéalement **2 séances de 55 min** (progression sauvegardée automatiquement sur le poste + bouton **Pause** classe dans le HUD).
- **Kit Enseignant intégré (sans corrigés)** : déroulé 1 h / 2 h, ancrage programmes (Maths, Techno, SVT, EMI, SNT, Pix) et pistes de débat oral sur les biais et le greenwashing, consultable dans [KIT_ENSEIGNANT.md](./KIT_ENSEIGNANT.md) ou directement dans l'application via `Alt+Shift+P` (ou double-clic sur le pied de page) et le **Menu Enseignant** (avec export **Imprimer / PDF A4**).

## 🚀 Lancer en local

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- Une clé API Gemini gratuite ([obtenir ici](https://aistudio.google.com/apikey))

### Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/VOTRE_USERNAME/mission-aqua-ia.git
   cd mission-aqua-ia
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   Créez un fichier `.env.local` à la racine du projet :
   ```env
   GEMINI_API_KEY=votre_clé_api_ici
   DEV_PASSWORD=votre_mot_de_passe_enseignant
   ```
   *(Optionnel : si `DEV_PASSWORD` est omis, le mot de passe par défaut côté serveur est utilisé. Pour ouvrir la fenêtre enseignant dans l'application : double-clic sur le crédit en pied de page ou raccourci `Alt+Shift+P`.)*

4. **Lancer l'application :**
   ```bash
   npm run dev
   ```
   Ou sur Windows, double-cliquez sur `run_local.bat`

   L'application sera accessible sur **http://localhost:3000**

## 🏗️ Architecture

- **Frontend** : React + TypeScript + Tailwind CSS
- **Backend** : Express.js (serveur proxy pour l'API Gemini)
- **IA** : Google Gemini API (évaluation d'idées + génération d'images)
- **Déploiement** : Cloudflare Pages (via `functions/api/`)

## 📁 Structure

```
├── src/                    # Code source React
│   ├── components/         # Composants réutilisables
│   ├── levels/             # Niveaux du jeu (Level1-12, Bonus, etc.)
│   ├── utils/              # Utilitaires (son, etc.)
│   ├── constants.ts        # Constantes (indices, faits)
│   ├── App.tsx             # Composant principal
│   └── main.tsx            # Point d'entrée
├── functions/api/          # API Cloudflare Workers (déploiement)
├── server.ts               # Serveur Express (développement local)
├── run_local.bat           # Script de lancement Windows
├── .env.example            # Modèle de configuration
└── vite.config.ts          # Configuration Vite
```

## 🌍 Déploiement

L'application est déployable sur **Cloudflare Pages** :
- Les fichiers dans `functions/api/` servent d'endpoints serverless
- La variable d'environnement `GEMINI_API_KEY` doit être configurée dans les paramètres Cloudflare (et `DEV_PASSWORD` en option pour personnaliser le mot de passe du mode enseignant)
