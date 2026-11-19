export const MISSION_DURATION_MINUTES = 40;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_MINUTES * 60;

export const HEART_COST_POINTS = 150;
export const MISTAKE_SCORE_PENALTY = 30;
export const FREE_HINT_COST_POINTS = 10;
export const PAID_HINT_COST_POINTS = 100;
export const TIME_BONUS_COST_POINTS = 100;
export const TIME_BONUS_SECONDS = 180; // +3 minutes
export const TERM_DISCOVERY_DELAY_MS = 2500; // 2,5 s de lecture avant validation dans le glossaire
export const TERM_DISCOVERY_POINTS = 15;
export const LOCKOUT_TIME_PENALTY_SECONDS = 120; // 2 minutes
export const LOCKOUT_MIN_TIME_REMAINING_SECONDS = 60; // Plancher 1 min pour éviter un double Game Over immédiat
export const LOCKOUT_RESTORE_LIVES = 2; // Reprise avec 2 vies sur 3 pour maintenir la tension

export interface Evaluation {
  title: string;
  description: string;
  impact: string;
  feasibility: string;
  precision: string;
  originality: string;
  score: number;
  waterSaved: string;
  feedback: string;
}

export interface LevelHint {
  free: string;
  paid?: string;
  noMistakeUnlock?: boolean;
}

export const HINTS: Record<number, LevelHint> = {
  1: {
    free: "Convertissez les 18 L en millilitres (1 L = 1 000 mL), puis divisez par les 1 500 images pour trouver la consommation d'une seule image."
  },
  2: {
    free: "Le système requiert exactement 135 L/s. Additionnez les débits des vannes que vous gardez ouvertes.",
    paid: "Il faut une combinaison de 3 vannes qui fait 135 L/s : 65 + 45 + 25 ou 45 + 75 + 15."
  },
  3: {
    free: "À 03h00 du matin, un secteur actif (nettoyage) garde une pression normale : cherchez celui où le débit reste anormalement élevé ET la pression chute.",
    paid: "Le capteur C (Zone Industrielle) a une pression qui chute à 3,7 bar et un débit nocturne de 46 L/min."
  },
  4: {
    free: "La latence dépend uniquement du site, tandis que l'Eau et le PUE varient selon le système choisi : écartez d'abord le site hors délai (> 40 ms), puis testez les 3 refroidissements sur les autres.",
    paid: "Choisissez Luleå (Subarctique, 2 °C, 45 L/MWh, PUE 1,08, 28 ms) et couplez-le au système de Free Cooling (Air extérieur)."
  },
  5: {
    free: "L'entraînement dure 6 h d'affilée : ne démarrez pas trop tard dans le creux, sinon la fin du calcul débordera sur le pic carboné du matin !",
    paid: "Glissez le curseur de départ sur 00:00 (40 gCO₂/kWh) ou 01:00 (45 gCO₂/kWh) pour rester sous le seuil de 55 gCO₂/kWh."
  },
  6: {
    free: "Plus un flux reçoit de requêtes par jour, plus le traitement doit être léger (une même architecture peut servir sur plusieurs flux) : réservez les grands modèles aux rares tâches complexes.",
    paid: "1. Alertes seuils → Sans IA (Règles) | 2. Demandes citoyennes → Modèle Spécialisé (1B) | 3. Rapports 80 pages → LLM Généraliste (175B) | 4. Filtrage d'URL → Sans IA (Règles)."
  },
  7: {
    free: "Étape 1 : une chauffe sous le max n'est pas une panne, cherchez une vraie erreur matérielle. Étape 2 : conservez tous les composants qui fonctionnent encore. Étape 3 : évitez l'effet tiroir comme la revente d'une pièce HS.",
    paid: "Étape 1 : Mémoire Vive (RAM ECC, échec EDAC sur DIMM_B2). Étape 2 : Remplacer la RAM. Étape 3 : Filière de recyclage DEEE."
  },
  8: {
    free: "Pour récupérer un maximum d'énergie sans gaspiller d'eau ni réchauffer le milieu naturel, privilégiez une boucle fermée, puis suivez le trajet logique de l'eau étape par étape.",
    paid: "Raccordement : Réseau de chaleur urbain. Ordre : 1. Échangeur côté serveurs → 2. Conduite isolée haute température → 3. Échangeur côté logements → 4. Conduite froide en boucle fermée."
  },
  9: {
    free: "Étape 1 : ne gardez que les données chiffrées utiles à la modélisation locale (climat du bassin, hydrologie, topographie), en restant sous 75 To. Étape 2 : cherchez pourquoi les besoins d'un quartier sont invisibles dans les données.",
    paid: "Étape 1 : Supprimez les relevés d'Australie (hors zone), les vidéos 4K et la copie brute de sauvegarde (1995-2020) → 70 To conservés. Étape 2 : Biais de représentativité → rééquilibrer avec les relevés terrain du Quartier Nord."
  },
  10: {
    free: "Il y a exactement 4 clauses réellement contraignantes pour l'environnement. Méfiez-vous des promesses vagues, des compensations symboliques et des engagements sans contrôle !",
    paid: "Cochez les 4 clauses contraignantes : Transparence obligatoire sur l'eau, Interdiction des LLM géants pour des tâches simples, Réutilisation de la chaleur fatale et Évaluation du coût écologique avant déploiement."
  },
  11: {
    free: "Regardez bien la structure if / else : dans le if, une seule des deux conditions (sol déjà assez humide, ou pluie annoncée) suffit pour couper l'arrosage ; le else gère le cas contraire.",
    paid: "Suivez la logique du programme : d'abord on LIT les données (un capteur et des prévisions), puis on DÉCIDE. Si l'humidité dépasse le seuil OU s'il pleut, on n'arrose pas (False). Sinon, on calcule le besoin en eau, on active (True) et on choisit le meilleur moment."
  },
  12: {
    free: "Respectez les 3 contraintes ensemble : financez au moins 85 U pour Climat (≥ 35 U) + Réseaux (≥ 40 U), maintenez 10 à 15 U pour les Services Citoyens, coupez la Publicité (≤ 5 U) et restez sous 108 MW d'électricité.",
    paid: "Exemple optimal : Climat = 45 U, Réseaux = 45 U, Services Citoyens = 10 U, Ciblage Pub = 0 U (Total = 100 U, Puissance = 105 MW ≤ 108 MW)."
  },
  13: {
    free: "Validez d'abord les 2 réflexes du Prompt Sobre, puis décrivez votre invention en combinant les 4 piliers : problème d'eau ciblé, capteurs/IA sobre, mécanisme concret et ordre de grandeur d'économie.",
    paid: "Calibration : 1) Moteur de recherche classique (Sans IA) | 2) 1 prompt structuré (Problème + Contexte + Données techniques + Format attendu). Pour viser le rang Légendaire (80 %+), incluez des termes techniques précis (IoT, boucle fermée, capteur, économie chiffrée).",
    noMistakeUnlock: true
  },
};

export const FACTS: Record<number, string> = {
  2: "Une requête IA consomme peu d'eau prise isolément (quelques gouttes directement pour refroidir les serveurs, et jusqu'à quelques millilitres en comptant l'eau nécessaire à la production d'électricité). C'est l'effet volume, avec des milliards de requêtes par jour, qui pèse sur les ressources !",
  3: "Dans les datacenters classiques à tours évaporatives, une grande partie de l'eau de refroidissement s'évapore définitivement dans l'atmosphère pour évacuer la chaleur des puces. Réguler précisément le débit des vannes évite de sur-pomper de l'eau potable inutilement !",
  4: "En France, environ 20 % de l'eau potable produite est perdue à cause des fuites dans les réseaux de distribution (données SISPEA / Office français de la biodiversité). C'est 1 litre sur 5 qui n'arrive jamais au robinet !",
  5: "Le « Free Cooling » consiste à utiliser l'air extérieur (souvent dans les régions très froides) pour refroidir les serveurs, évitant ainsi de consommer de l'eau ou de faire tourner de puissantes climatisations.",
  6: "L'intensité carbone représente la quantité de CO₂ émise pour produire l'électricité. Planifier les gros calculs d'IA la nuit permet souvent de profiter d'une électricité plus décarbonée.",
  7: "Entraîner un grand Modèle de Langage (LLM) émet des dizaines à des centaines de tonnes de CO₂ selon sa taille. Un « Petit Modèle Spécialisé » (SLM) est souvent tout aussi performant sur une tâche précise, pour un coût écologique infime.",
  8: "Selon l'ADEME et l'Arcep, la fabrication représente 60 à 80 % de l'empreinte carbone de nos appareils (smartphones, PC) et une part majeure pour les serveurs alimentés par une électricité décarbonée. Réparer plutôt que jeter est le premier geste de sobriété.",
  9: "La « chaleur fatale » (ou chaleur perdue) générée par les serveurs informatiques peut être récupérée ! Plusieurs villes l'utilisent déjà pour chauffer des éco-quartiers ou des piscines municipales.",
  10: "Trier les « données mortes » (doublons, vidéos inutiles) allège les serveurs, mais ce n'est pas tout : si un jeu de données oublie un territoire moins connecté, l'IA reproduit cet angle mort. C'est le biais de représentativité !",
  11: "L'empreinte carbone du secteur numérique mondial représente environ 3,5 à 4 % des émissions globales de gaz à effet de serre (~4,4 % en France selon l'ADEME/Arcep), dépassant celle de l'aviation civile. D'où l'importance de règles éthiques contraignantes.",
  12: "L'IA et le code peuvent aussi aider la planète : des algorithmes d'irrigation intelligente connectés à des capteurs d'humidité permettent de réduire la consommation d'eau agricole jusqu'à 50 % !",
  13: "La sobriété numérique ne consiste pas à renoncer au progrès, mais à arbitrer entre eau, électricité et utilité sociale : préserver les services essentiels tout en coupant les calculs publicitaires superflus !"
};

export interface MissionAct {
  id: 1 | 2 | 3;
  label: string;
  title: string;
  subtitle: string;
  startLevel: number;
  endLevel: number;
}

export const MISSION_ACTS: MissionAct[] = [
  {
    id: 1,
    label: 'ACTE I',
    title: 'Urgence Hydrique',
    subtitle: 'Mesurer la soif d\'HYDRA et stopper les pertes immédiates',
    startLevel: 1,
    endLevel: 3,
  },
  {
    id: 2,
    label: 'ACTE II',
    title: 'IA Sobre',
    subtitle: 'Reconstruire, optimiser et encadrer l\'infrastructure',
    startLevel: 4,
    endLevel: 10,
  },
  {
    id: 3,
    label: 'ACTE III',
    title: 'Mode Symbiose',
    subtitle: 'Mettre l\'IA sobre au service de l\'eau et de l\'éco-innovation',
    startLevel: 11,
    endLevel: 13,
  },
];

export function getActForLevel(level: number): MissionAct | undefined {
  return MISSION_ACTS.find((act) => level >= act.startLevel && level <= act.endLevel);
}

export const LEVEL_NAMES: Record<number, string> = {
  0: "Intro",
  1: "Le Coût Caché",
  2: "Refroidissement",
  3: "Détection de Fuites",
  4: "Stratégie d'Implantation",
  5: "Optimisation Temporelle",
  6: "Sobriété Algorithmique",
  7: "Cycle de Vie du Matériel",
  8: "Valorisation Thermique",
  9: "Hygiène & Équité des Données",
  10: "La Charte Éthique",
  11: "L'Algorithme d'Arrosage",
  12: "L'Équilibre Global",
  13: "L'Innovation Lab",
  14: "Fin"
};
