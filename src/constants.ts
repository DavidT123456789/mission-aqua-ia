export const MISSION_DURATION_MINUTES = 40;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_MINUTES * 60;

export const HINTS: Record<number, { free: string, paid: string }> = {
  1: {
    free: "Pensez à convertir les litres en millilitres (1 L = 1 000 mL) avant de diviser par le nombre d'images.",
    paid: "18 L = 18 000 mL. Divisez 18 000 mL par 1 500 images pour trouver la consommation d'une seule image."
  },
  2: {
    free: "Le système requiert exactement 135 L/s. Additionnez les débits des vannes que vous gardez ouvertes.",
    paid: "Il faut une combinaison de 3 vannes qui fait 135 L/s : par exemple 65 + 45 + 25 (ou 45 + 75 + 15)."
  },
  3: {
    free: "À 03h00 du matin, un secteur actif (nettoyage) garde une pression normale : cherchez celui où le débit reste anormalement élevé ET la pression chute.",
    paid: "Le capteur C (Zone Industrielle) a une pression qui chute à 3,7 bar et un débit nocturne de 46 L/min."
  },
  4: {
    free: "Vérifiez les 3 critères du cahier des charges : Eau < 100 L/MWh, PUE < 1.15 et Latence ≤ 40 ms une fois le système de refroidissement sélectionné.",
    paid: "Choisissez Luleå (Subarctique, 2°C, 45 L/MWh, PUE 1.08, 28 ms) et couplez-le au système de Free Cooling (Air extérieur)."
  },
  5: {
    free: "Observez la courbe 24h : les centrales à gaz tournent à plein régime en journée et en soirée, tandis que l'éolien domine la nuit.",
    paid: "Glissez le curseur de départ sur 00:00 (40 gCO₂/kWh) ou 01:00 (45 gCO₂/kWh) pour rester sous le seuil de 55 gCO₂/kWh."
  },
  6: {
    free: "N'utilisez l'IA générative géante que lorsque le raisonnement complexe l'exige. Des règles simples suffisent pour une liste noire !",
    paid: "1. URLs connues → Sans IA (Règles) | 2. Tickets citoyens → Modèle Spécialisé (1B) | 3. Rapports 80 pages → LLM Généraliste (175B)."
  },
  7: {
    free: "Étape 1 : lisez les journaux système pour repérer le seul composant qui remonte des erreurs matérielles (EDAC / parité). Ensuite, réparez au plus sobre et recyclez.",
    paid: "Étape 1 : Mémoire Vive (RAM ECC). Étape 2 : Remplacer la RAM (15 L). Étape 3 : Filière de recyclage DEEE."
  },
  8: {
    free: "Pour éviter toute évaporation d'eau, il faut un circuit fermé raccordé à un besoin de chauffage local, en suivant le trajet logique de la chaleur.",
    paid: "Raccordement : Réseau de chaleur urbain. Ordre : 1. Captage thermique → 2. Acheminement isolé → 3. Transfert aux logements → 4. Retour en boucle fermée."
  },
  9: {
    free: "Plus il y a de données, plus l'entraînement pollue. Supprimez les doublons, les vidéos lourdes et les traces publicitaires pour ne garder que les séries scientifiques utiles.",
    paid: "Supprimez les traces GPS/pubs, les vidéos HD de rivières et les doublons 1995-2020. Gardez les données climatiques, les séries numériques d'hydrologie et la topographie."
  },
  10: {
    free: "Il y a exactement 4 clauses réellement contraignantes pour protéger l'eau locale. Méfiez-vous du greenwashing (compensation ailleurs, labels auto-déclarés) !",
    paid: "Coche en priorité la Transparence obligatoire sur l'eau et la Réutilisation de la chaleur fatale. Il t'en reste 2 à trouver !"
  },
  11: {
    free: "Lisez attentivement le code. Il faut vérifier l'humidité, et si elle est trop élevée, arrêter l'arrosage.",
    paid: "Suivez la logique du programme : d'abord on LIT les données (un capteur et des prévisions), puis on DÉCIDE — si l'humidité dépasse le seuil OU s'il pleut, on n'arrose pas (False). Sinon, on calcule le besoin en eau, on active (True) et on choisit le meilleur moment."
  },
  12: {
    free: "Trouvez le juste milieu. L'IA doit rester utile sans pour autant détruire nos ressources.",
    paid: "Priorisez les missions vitales : la Modélisation Climatique et la Gestion des Réseaux méritent la majorité du budget. Le Streaming 4K & Filtres IA et le Ciblage Publicitaire ? Réduisez-les au strict minimum."
  },
  13: {
    free: "Définissez un concept innovant en combinant IA, capteurs IoT et recyclage d'eau pour préserver durablement nos ressources.",
    paid: "Détaillez le fonctionnement de votre solution (ex: récupération de chaleur fatale des datacenters pour chauffer des serres d'arrosage en circuit fermé). Plus vous serez précis, plus le brevet sera légendaire !"
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

export const DEV_ANSWERS: Record<number, string> = {
  1: "12 (mL)",
  2: "65 + 45 + 25 = 135 (ou 45 + 75 + 15)",
  3: "Segment C",
  4: "Luleå + Free Cooling",
  5: "Départ 00:00 ou 01:00",
  6: "1:Règles, 2:Spécialisé, 3:LLM",
  7: "1:RAM → 2:Changer RAM → 3:DEEE",
  8: "Réseau urbain\nOrdre : Captage → Acheminement → Transfert → Retour",
  9: "Climat, Hydrologie, Topographie",
  10: "Transparence eau, Interdiction LLMs géants, Chaleur fatale, Coût écologique",
  11: "1:capteur, 2:previsions, 3:seuil, 4:or, 5:False, 6:eau, 7:True, 8:aube",
  12: "Total <= 100\nClimat >= 40, Eau >= 40\nDivert. <= 10, Pub <= 10",
  13: "Saisie libre (Bouton d'auto-remplissage)"
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
