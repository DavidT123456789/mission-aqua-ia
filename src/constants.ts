export const HINTS: Record<number, { free: string, paid: string }> = {
  1: {
    free: "L'IA générative consomme beaucoup d'eau. Regardez le rapport d'analyse.",
    paid: "Divise la consommation totale (500 mL) par le nombre d'images (100) pour trouver la consommation d'une seule image."
  },
  2: {
    free: "Le système requiert exactement 150 L/s. Additionnez les débits des vannes.",
    paid: "Cherche une combinaison de 3 vannes qui fait exactement 150 L/s. Par exemple : 50 + 75 + ... ?"
  },
  3: {
    free: "Une pression normale est de 4.5 bar. Cherchez l'anomalie.",
    paid: "La fuite se trouve là où la pression est anormalement basse (en rouge)."
  },
  4: {
    free: "Le 'Free Cooling' utilise l'air froid extérieur pour refroidir les serveurs sans climatisation.",
    paid: "Le Cercle Arctique offre des températures glaciales toute l'année, idéal pour refroidir naturellement."
  },
  5: {
    free: "Regardez l'intensité carbone de chaque bloc. Plus elle est basse, plus l'énergie est propre.",
    paid: "Le bloc 1 (00:00 - 06:00) a l'intensité carbone la plus faible (50 gCO2/kWh)."
  },
  6: {
    free: "Comparez le ratio Précision / Coût environnemental. Le plus gros modèle n'est pas toujours le meilleur.",
    paid: "Le Modèle Spécialisé offre 95% de précision pour un coût très faible. C'est le choix le plus sobre."
  },
  7: {
    free: "La fabrication d'un serveur neuf pollue énormément. Privilégiez toujours la réparation quand c'est possible.",
    paid: "Seule la RAM est défectueuse. Il suffit de la réparer pour prolonger la durée de vie du serveur."
  },
  8: {
    free: "La chaleur fatale des serveurs est une ressource précieuse si elle est réutilisée localement.",
    paid: "Connecter le datacenter au réseau de chaleur urbain permet de chauffer les bâtiments voisins."
  },
  9: {
    free: "Plus il y a de données, plus l'entraînement pollue. Ne gardez que les données strictement nécessaires à la prédiction des sécheresses.",
    paid: "Supprimez les images de chats, l'historique des mèmes et les vidéos virales. Gardez le climat, l'hydrologie et la topographie."
  },
  10: {
    free: "Il y a exactement 4 clauses bénéfiques pour l'environnement à sélectionner pour adopter cette loi.",
    paid: "Coche en priorité la Transparence obligatoire (clause 1) et la Réutilisation de la chaleur fatale (clause 5). Il t'en reste 2 à trouver !"
  },
  11: {
    free: "Lisez attentivement le code. Il faut vérifier l'humidité, et si elle est trop élevée, arrêter l'arrosage.",
    paid: "Suivez la logique du programme : d'abord on LIT les données (un capteur et des prévisions), puis on DÉCIDE — si l'humidité dépasse le seuil OU s'il pleut, on n'arrose pas (False). Sinon, on calcule le besoin en eau, on active (True) et on choisit le meilleur moment."
  },
  12: {
    free: "Trouvez le juste milieu. L'IA doit rester utile sans pour autant détruire nos ressources.",
    paid: "Priorisez les missions vitales : la Modélisation Climatique et la Gestion de l'Eau méritent la majorité du budget. Les Vidéos de Chats et le Ciblage Pub ? Réduisez-les au strict minimum."
  },
  13: {
    free: "Définissez un concept innovant en combinant IA, capteurs IoT et recyclage d'eau pour stopper le gaspillage d'HYDRA.",
    paid: "Détaillez le fonctionnement de votre solution (ex: récupération de chaleur fatale des datacenters pour chauffer des serres d'arrosage en circuit fermé). Plus vous serez précis, plus le brevet sera légendaire !"
  },
};

export const FACTS: Record<number, string> = {
  2: "La génération d'images demande beaucoup de calculs. Une intelligence artificielle générative peut consommer environ un demi-litre d'eau douce (pour le refroidissement des serveurs) rien que pour créer 100 images !",
  3: "Pour acheminer l'eau potable dans nos villes, il faut des millions de kilomètres de tuyaux. Une gestion intelligente de la pression diminue la contrainte sur ces conduites et permet d'éviter les ruptures.",
  4: "En France, on estime qu'environ 20 % de l'eau potable produite est perdue à cause des fuites dans les réseaux de distribution (données de l'Observatoire, 2021). C'est 1 litre sur 5 qui n'arrive jamais au robinet !",
  5: "Le 'Free Cooling' est une technique astucieuse qui utilise l'air extérieur (souvent dans les régions très froides) pour refroidir les serveurs, évitant ainsi d'utiliser de l'eau ou de puissantes climatisations.",
  6: "L'intensité carbone représente la quantité de CO2 émise pour produire l'électricité. Planifier les gros calculs d'IA la nuit permet souvent de profiter d'une électricité 'plus verte'.",
  7: "Entraîner un immense Modèle de Langage (LLM) peut émettre autant de CO2 que 5 voitures sur toute leur vie. Un 'Petit Modèle Spécialisé' (SLM) est souvent tout aussi performant, pour un coût écologique infime.",
  8: "La fabrication du matériel informatique représente plus de 70 % de son empreinte carbone totale. Réparer la pièce défectueuse (comme la RAM) plutôt que de tout jeter est l'acte numérique le plus écologique.",
  9: "La 'chaleur fatale' (ou chaleur perdue) générée par les serveurs informatiques peut être récupérée ! Plusieurs villes l'utilisent déjà pour chauffer des éco-quartiers ou des piscines municipales.",
  10: "Le stockage de 'données mortes' (fichiers inutilisés, doublons) encombre d'immenses serveurs fonctionnant en permanence. Filtrer et supprimer les données inutiles est la base de la sobriété numérique.",
  11: "L'empreinte carbone du secteur numérique mondial représente près de 4 % des émissions globales de gaz à effet de serre, dépassant celle de l'aviation civile (avant COVID). Les chartes éthiques deviennent vitales.",
  12: "L'IA et le code peuvent aussi aider la planète : des algorithmes d'irrigation intelligente connectés à des capteurs d'humidité permettent de réduire la consommation d'eau agricole jusqu'à 50 % !",
  13: "L'éco-conception d'un logiciel consiste à optimiser son code informatique. Un programme bien optimisé est non seulement plus rapide, mais il peut réduire la consommation d'énergie du serveur de 50 à 90 % !"
};
