export const MISSION_DURATION_MINUTES = 40;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_MINUTES * 60;

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
    paid: "Choisissez Luleå (Subarctique, 2°C, 45 L/MWh, PUE 1.08, 28 ms) et couplez-le au système de Free Cooling (Air extérieur)."
  },
  5: {
    free: "L'entraînement dure 6 h d'affilée : ne démarrez pas trop tard dans le creux, sinon la fin du calcul débordera sur le pic carboné du matin !",
    paid: "Glissez le curseur de départ sur 00:00 (40 gCO₂/kWh) ou 01:00 (45 gCO₂/kWh) pour rester sous le seuil de 55 gCO₂/kWh."
  },
  6: {
    free: "Plus un flux reçoit de requêtes par jour, plus le traitement doit être léger : réservez les grands modèles aux rares tâches que des règles fixes ou un petit modèle ne peuvent pas résoudre.",
    paid: "1. URLs connues → Sans IA (Règles) | 2. Tickets citoyens → Modèle Spécialisé (1B) | 3. Rapports 80 pages → LLM Généraliste (175B)."
  },
  7: {
    free: "Étape 1 : une chauffe sous le max n'est pas une panne — cherchez une vraie erreur matérielle. Étape 2 : conservez tous les composants qui fonctionnent encore. Étape 3 : évitez les ordures courantes comme le stockage inutile.",
    paid: "Étape 1 : Mémoire Vive (RAM ECC — échec EDAC sur DIMM_B2). Étape 2 : Remplacer la RAM. Étape 3 : Filière de recyclage DEEE."
  },
  8: {
    free: "Pour récupérer un maximum d'énergie sans gaspiller d'eau ni réchauffer le milieu naturel, privilégiez une boucle fermée, puis suivez le trajet logique de l'eau étape par étape.",
    paid: "Raccordement : Réseau de chaleur urbain. Ordre : 1. Captage thermique → 2. Acheminement isolé → 3. Transfert aux logements → 4. Retour en boucle fermée."
  },
  9: {
    free: "Ne gardez que les données chiffrées utiles à la modélisation physique (climat, débits d'eau, relief). Chaque jeu superflu alourdit inutilement l'entraînement.",
    paid: "Supprimez les traces GPS/pubs, les vidéos HD de rivières et les doublons 1995-2020. Gardez les données climatiques, les séries numériques d'hydrologie et la topographie."
  },
  10: {
    free: "Il y a exactement 4 clauses réellement contraignantes pour l'environnement. Méfiez-vous des promesses vagues, des compensations symboliques et des engagements sans contrôle !",
    paid: "Cochez les 4 clauses contraignantes : Transparence obligatoire sur l'eau, Interdiction des LLMs géants pour des tâches simples, Réutilisation de la chaleur fatale et Évaluation du coût écologique avant déploiement."
  },
  11: {
    free: "Regardez bien la structure if / else : dans le if, une seule des deux conditions (sol déjà assez humide, ou pluie annoncée) suffit pour couper l'arrosage ; le else gère le cas contraire.",
    paid: "Suivez la logique du programme : d'abord on LIT les données (un capteur et des prévisions), puis on DÉCIDE — si l'humidité dépasse le seuil OU s'il pleut, on n'arrose pas (False). Sinon, on calcule le besoin en eau, on active (True) et on choisit le meilleur moment."
  },
  12: {
    free: "Consacrez l'essentiel des 100 unités aux deux missions vitales (Climat et Réseaux d'eau) et bridez fortement les usages récréatifs ou publicitaires.",
    paid: "Allouez au moins 40 U à la Modélisation Climatique et au moins 40 U à la Gestion des Réseaux (sans dépasser 100 U au total), et gardez le Streaming 4K et le Ciblage Publicitaire à 10 U maximum chacun."
  },
  13: {
    free: "Définissez un concept innovant en combinant IA sobre, capteurs IoT et réemploi ou économie d'eau pour préserver durablement nos ressources.",
    paid: "Pour viser le rang Légendaire (80 %+), structurez votre prompt en 4 points : 1) le problème d'eau ciblé, 2) les capteurs ou l'IA sobre utilisés, 3) le mécanisme concret (boucle fermée, réemploi, récupération) et 4) un ordre de grandeur d'économie attendue.",
    noMistakeUnlock: true
  },
};

export const FACTS: Record<number, string> = {
  2: "Une requête IA consomme peu d'eau prise isolément (quelques gouttes directement pour refroidir les serveurs, et jusqu'à quelques millilitres en comptant l'eau nécessaire à la production d'électricité). C'est l'effet volume — des milliards de requêtes par jour — qui pèse sur les ressources !",
  3: "Pour acheminer l'eau potable dans nos villes, il faut des millions de kilomètres de tuyaux. Une gestion intelligente de la pression diminue la contrainte sur ces conduites et permet d'éviter les ruptures.",
  4: "En France, environ 20 % de l'eau potable produite est perdue à cause des fuites dans les réseaux de distribution (données SISPEA / Office français de la biodiversité). C'est 1 litre sur 5 qui n'arrive jamais au robinet !",
  5: "Le 'Free Cooling' est une technique astucieuse qui utilise l'air extérieur (souvent dans les régions très froides) pour refroidir les serveurs, évitant ainsi d'utiliser de l'eau ou de puissantes climatisations.",
  6: "L'intensité carbone représente la quantité de CO2 émise pour produire l'électricité. Planifier les gros calculs d'IA la nuit permet souvent de profiter d'une électricité plus décarbonée.",
  7: "Entraîner un grand Modèle de Langage (LLM) émet de dizaines à des centaines de tonnes de CO2 selon sa taille. Un 'Petit Modèle Spécialisé' (SLM) est souvent tout aussi performant sur une tâche précise, pour un coût écologique infime.",
  8: "Selon l'ADEME et l'Arcep, la fabrication représente 60 à 80 % de l'empreinte carbone de nos appareils (smartphones, PC) et une part majeure pour les serveurs alimentés par une électricité décarbonée. Réparer plutôt que jeter est le premier geste de sobriété.",
  9: "La 'chaleur fatale' (ou chaleur perdue) générée par les serveurs informatiques peut être récupérée ! Plusieurs villes l'utilisent déjà pour chauffer des éco-quartiers ou des piscines municipales.",
  10: "Le stockage de 'données mortes' (fichiers inutilisés, doublons) encombre d'immenses serveurs fonctionnant en permanence. Filtrer et supprimer les données inutiles est la base de la sobriété numérique.",
  11: "L'empreinte carbone du secteur numérique mondial représente environ 3,5 à 4 % des émissions globales de gaz à effet de serre (~4,4 % en France selon l'ADEME/Arcep), dépassant celle de l'aviation civile. Les chartes éthiques deviennent vitales.",
  12: "L'IA et le code peuvent aussi aider la planète : des algorithmes d'irrigation intelligente connectés à des capteurs d'humidité permettent de réduire la consommation d'eau agricole jusqu'à 50 % !",
  13: "La sobriété numérique ne consiste pas à renoncer au progrès, mais à réserver l'eau et la puissance de calcul aux usages essentiels — climat, santé, gestion des ressources — tout en stimulant l'éco-innovation !"
};

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
  9: "Hygiène des Données",
  10: "La Charte Éthique",
  11: "L'Algorithme d'Arrosage",
  12: "L'Équilibre Global",
  13: "L'Innovation Lab",
  14: "Fin"
};
