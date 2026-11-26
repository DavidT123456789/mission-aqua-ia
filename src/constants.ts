export const MISSION_DURATION_MINUTES = 40;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_MINUTES * 60;

export const MAX_LIVES = 3;
export const HEART_COST_POINTS = 150;
export const MISTAKE_SCORE_PENALTY = 30;
export const LAB_REOPEN_PENALTY_POINTS = 50;
export const TERM_DISCOVERY_DELAY_MS = 2500; // 2,5 s de lecture avant validation dans le glossaire
export const TERM_DISCOVERY_POINTS = 15;
export const LOCKOUT_RESTORE_LIVES = 2; // Reprise avec 2 vies sur 3 pour maintenir la tension
export const MID_ACT_TWO_HEAL_LEVEL = 8; // Unique palier intermédiaire (+1 vie) au milieu de l'Acte II (N4–N10)

export interface ActCheckpoint {
  actId: 1 | 2 | 3;
  level: number;
  score: number;
  baseNetworkWater: number;
  elapsedSeconds: number;
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
  1: "Commencez par convertir les 18 L en millilitres (le bouton « Aide calcul » peut vous guider), puis simplifiez les deux nombres par 100 pour rendre la division plus facile de tête !",
  2: "Astuce : toutes les vannes ouvertes totalisent 225 L/s. Plutôt que de tout recalculer, cherchez simplement 2 vannes à fermer dont la somme vaut l'excès de 90 L/s (225 − 135 = 90) !",
  3: "Comparez chaque secteur aux valeurs au repos (~4,3 bar et ~5 L/min) : un usage nocturne prévu augmente le débit sans faire baisser la pression, alors qu'une vraie fuite fait chuter la pression en même temps.",
  4: "Procédez par élimination : la latence ne dépend que de la distance (écartez d'emblée le site > 40 ms). Sur les sites restants, testez les 3 refroidissements pour voir lequel exploite le froid naturel sans évaporer d'eau ni alourdir le PUE.",
  5: "Le seuil de 55 gCO₂/kWh porte sur la moyenne des 6 heures d'affilée : vérifiez sur la courbe quel creux reste suffisamment large sous la ligne pointillée avant la remontée du pic matinal.",
  6: "Calculez l'ordre de grandeur : à 2,5 Wh par requête, le grand LLM (175B) dépasse le plafond de 50 kWh/jour dès qu'un flux excède 20 000 requêtes ! Réservez-le aux tâches rares et complexes, et réutilisez une architecture sobre sur plusieurs flux.",
  7: {
    1: "Une température élevée mais sous la limite maximale (en plein calcul IA) est normale : fiez-vous aux compteurs d'erreurs matérielles dans les journaux plutôt qu'à la chaleur.",
    2: "Principe de réparabilité : fabriquer ou remplacer un serveur entier mobilise beaucoup plus d'eau virtuelle que de n'intervenir que sur le composant défectueux.",
    3: "Une pièce hors service ne doit ni dormir dans une armoire ni transmettre la panne à quelqu'un d'autre : cherchez la filière capable d'en récupérer proprement les matières premières.",
  },
  8: {
    1: "Comparez le principe et la sortie de chaque option : cherchez un circuit étanche où l'eau ne se perd pas et où la chaleur des serveurs devient utile à l'extérieur.",
    2: "Partez de la source de chaleur (les serveurs) et alternez toujours entre un échangeur (qui transfère la chaleur) et une conduite (qui transporte l'eau), jusqu'au retour refroidi.",
  },
  9: {
    1: "Pour passer sous 75 To, passez chaque jeu au crible de 3 questions : concerne-t-il bien notre bassin local ? Est-il déjà couvert par un autre jeu ? Son format est-il vraiment adapté à des calculs ?",
    2: "Observez l'encadré d'audit du Quartier Nord : demandez-vous si l'angle mort vient d'un manque de puissance de calcul ou d'un déficit de mesures réelles sur ce territoire.",
  },
  10: "Il y a exactement 4 articles réellement contraignants à retenir. Une vraie règle impose une obligation locale, vérifiable et appliquée avant déploiement — écartez les promesses floues, symboliques ou sans contrôle.",
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
