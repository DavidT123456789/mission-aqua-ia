export const MISSION_DURATION_MINUTES = 40;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_MINUTES * 60;

export const HEART_COST_POINTS = 150;
export const MISTAKE_SCORE_PENALTY = 30;
export const FREE_HINT_COST_POINTS = 10;
export const TIME_BONUS_COST_POINTS = 100;
export const TIME_BONUS_SECONDS = 180; // +3 minutes
export const TERM_DISCOVERY_DELAY_MS = 2500; // 2,5 s de lecture avant validation dans le glossaire
export const TERM_DISCOVERY_POINTS = 15;
export const LOCKOUT_TIME_PENALTY_SECONDS = 120; // 2 minutes
export const LOCKOUT_MIN_TIME_REMAINING_SECONDS = 60; // Plancher 1 min pour éviter un double Game Over immédiat
export const LOCKOUT_RESTORE_LIVES = 2; // Reprise avec 2 vies sur 3 pour maintenir la tension

// Plancher de temps garanti (en secondes) lors d'une reprise au début d'un acte après Game Over
export const ACT_CHECKPOINT_MIN_TIME_SECONDS: Record<1 | 2 | 3, number> = {
  1: MISSION_DURATION_SECONDS,
  2: 15 * 60,
  3: 8 * 60,
};

export interface ActCheckpoint {
  actId: 1 | 2 | 3;
  level: number;
  score: number;
  baseNetworkWater: number;
  timeLeft: number;
  extraTimeBought: number;
  unlockedFreeHints: number[];
}

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

export const HINTS: Record<number, string | Record<number, string>> = {
  1: "Astuce de calcul mental : une fois les 18 L convertis en millilitres (18 000 mL), simplifiez par 100 les deux nombres. Diviser 18 000 par 1 500 revient à diviser 180 par 15 !",
  2: "Astuce : toutes les vannes ouvertes totalisent 225 L/s. Plutôt que de tout recalculer, cherchez simplement 2 vannes à fermer dont la somme vaut l'excès de 90 L/s (225 − 135 = 90) !",
  3: "Comparez chaque relevé aux secteurs au repos (~4,3 bar et ~5 L/min) : un nettoyage prévu la nuit tire de l'eau mais maintient la pression (> 4 bar), tandis qu'une vraie rupture fait chuter la pression dans une zone censée être à l'arrêt.",
  4: "Procédez par élimination : la latence ne dépend que de la distance (écartez d'emblée le site > 40 ms). Sur les sites restants, testez les 3 refroidissements pour voir lequel exploite le froid naturel sans évaporer d'eau ni alourdir le PUE.",
  5: "Méfiez-vous du creux solaire de midi : il ne dure que 2 h, alors que l'entraînement dure 6 h d'affilée ! Placez toute la fenêtre de 6 h dans la longue période éolienne de la nuit, avant le réveil des centrales à gaz à 06h00.",
  6: "Calculez l'ordre de grandeur : à 2,5 Wh par requête, le grand LLM (175B) dépasse le plafond de 50 kWh/jour dès qu'un flux excède 20 000 requêtes ! Réservez-le aux tâches rares et complexes, et réutilisez une architecture sobre sur plusieurs flux.",
  7: {
    1: "Une température élevée mais sous la limite maximale (comme en plein calcul IA) est normale : cherchez dans les journaux une véritable erreur matérielle critique impossible à corriger.",
    2: "Principe de réparabilité : conservez tous les composants qui fonctionnent encore et limitez l'intervention à la seule pièce réellement défaillante.",
    3: "Évitez autant l'effet tiroir (garder une pièce HS « au cas où ») que de déplacer la panne en revendant un module défectueux : privilégiez la récupération des métaux critiques.",
  },
  8: {
    1: "Pour éviter tout gaspillage d'eau et ne pas réchauffer le milieu naturel, écartez les systèmes ouverts (vapeur ou rejet en rivière) et choisissez la boucle fermée qui valorise la chaleur.",
    2: "Suivez le trajet de la chaleur dans la boucle : l'eau capte d'abord la chaleur près des serveurs, part vers le quartier, la cède aux logements, puis revient refroidie au point de départ.",
  },
  9: {
    1: "Pour passer sous 75 To, écartez les jeux qui n'aident pas à modéliser notre bassin local : données d'un autre continent, format vidéo disproportionné et copie en doublon.",
    2: "Regardez pourquoi le Quartier Nord n'a que 15 % de besoins visibles : ajouter des calculs ou copier les données d'un autre quartier ne corrige jamais un manque de mesures locales.",
  },
  10: "Il y a exactement 4 articles réellement contraignants à retenir. Une vraie règle impose une obligation locale, mesurable et appliquée avant déploiement : méfiez-vous des compensations lointaines, des auto-déclarations sans contrôle et des bilans repoussés.",
  11: "Aidez-vous de l'accordéon « Fonctionnement de l'algorithme » et du bouton « Aide Scratch → Python ». Dans le bloc if, on regroupe les deux cas où l'on coupe l'arrosage (opérateur logique OU) ; dans le else, on calcule le besoin et on arrose au moment le plus frais.",
  12: "Comparez le coût électrique (MW/U) de chaque secteur : la Publicité pèse plus de 3 fois plus lourd que les Réseaux d'eau ! Réduisez d'abord les usages les plus énergivores au strict minimum autorisé, puis répartissez le reste entre Climat et Réseaux.",
};

export function getLevelHint(level: number, step?: number): string | null {
  const entry = HINTS[level];
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return step !== undefined ? entry[step] ?? null : null;
}

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
