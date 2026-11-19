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

export const HINTS: Record<number, string> = {
  1: "Astuce de calcul mental : une fois les 18 L convertis en millilitres (18 000 mL), simplifiez par 100 les deux nombres — diviser 18 000 par 1 500 revient à diviser 180 par 15 !",
  2: "Astuce : toutes les vannes ouvertes totalisent 225 L/s. Plutôt que de tout recalculer, cherchez simplement 2 vannes à fermer dont la somme vaut l'excès de 90 L/s (225 − 135 = 90) !",
  3: "Comparez chaque relevé aux secteurs au repos (~4,3 bar et ~5 L/min) : un nettoyage prévu la nuit tire de l'eau mais maintient la pression (> 4 bar), tandis qu'une vraie rupture fait chuter la pression dans une zone censée être à l'arrêt.",
  4: "Procédez par élimination : la latence ne dépend que de la distance (écartez d'emblée le site > 40 ms). Sur les sites restants, seul un climat très froid (< 5 °C) permet d'utiliser l'air extérieur sans évaporer d'eau ni alourdir le PUE électrique.",
  5: "Méfiez-vous du creux solaire de midi : il ne dure que 2 h, alors que l'entraînement dure 6 h d'affilée ! Placez toute la fenêtre de 6 h dans la longue période éolienne de la nuit, avant le réveil des centrales à gaz à 06h00.",
  6: "Regardez l'ordre de grandeur : à 2,5 Wh/requête, le grand LLM (175B) ne peut traiter qu'un flux à faible volume (quelques milliers/jour). Utilisez les règles sans IA dès que le critère est fixe (seuil chiffré ou liste noire) et le modèle 1B pour classer des textes courts.",
  7: "Une température élevée mais sous sa limite max (comme le GPU en plein calcul) n'est pas une panne : cherchez l'erreur matérielle non corrigée dans les logs, ne remplacez que ce composant, puis orientez la pièce HS vers l'extraction des métaux (DEEE).",
  8: "Privilégiez la boucle fermée qui chauffe la ville sans évaporer d'eau. Pour l'ordre du circuit, suivez la chaleur : l'eau capte d'abord les 65 °C côté serveurs, circule dans la conduite chaude isolée, cède ses calories aux logements, puis revient refroidie au datacenter.",
  9: "Étape 1 : écartez les données hors zone géographique, les vidéos 4K trop lourdes et la copie en doublon pour ne garder que les 3 relevés scientifiques locaux (70 To). Étape 2 : un quartier sous-équipé en capteurs nécessite d'intégrer ses propres relevés terrain plutôt qu'une moyenne.",
  10: "Il y a exactement 4 articles réellement contraignants à retenir. Écartez les 4 pièges de greenwashing : compensation ailleurs qu'en local, pompage sur simple déclaration, bilan repoussé de 3 ans ou label auto-déclaré sans contrôle.",
  11: "Repérez les indices dans les noms de fonctions : lire_capteur(\"humidité\"), lire_previsions(\"pluie_demain\") et calcul_eau(plante). Dans le if, combinez plante.seuil et la pluie avec « or » pour couper la pompe (False) ; dans le else, activez-la (True) à l'heure la plus fraîche.",
  12: "Pour rester sous les 108 MW tout en atteignant 100 U d'eau : coupez la Publicité à 0 U (très énergivore à 2,5 MW/U), fixez les Services Citoyens au minimum requis (10 U), puis donnez un léger avantage aux Réseaux d'eau (0,8 MW/U) par rapport au Climat (1,2 MW/U).",
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
