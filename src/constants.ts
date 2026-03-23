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
    free: "Une charte éthique doit promouvoir la transparence, la sobriété et le bon sens écologique.",
    paid: "Sélectionnez les clauses 1 (Transparence), 4 (Interdiction des LLMs géants pour des tâches simples) et 5 (Réutilisation de la chaleur)."
  },
  11: {
    free: "Lisez attentivement le code. Il faut vérifier l'humidité, et si elle est trop élevée, arrêter l'arrosage.",
    paid: "Regardez les mots-clés disponibles. L'opérateur 'or' et l'arrosage à 'aube' sont essentiels."
  },
  12: {
    free: "Trouvez le juste milieu. L'IA doit rester utile sans pour autant détruire nos ressources.",
    paid: "Placez le curseur entre 30 et 45 pour obtenir un équilibre optimal."
  },
};

export const FACTS: Record<number, string> = {
  2: "Saviez-vous que l'IA générative consomme beaucoup plus d'eau que les autres types d'IA pour refroidir ses processeurs ultra-puissants ?",
  3: "Le 'Free Cooling' est une technique qui utilise l'air extérieur froid pour refroidir les serveurs, économisant ainsi des millions de litres d'eau.",
  4: "Les GPU sont les moteurs de l'IA, mais ils chauffent énormément. Le refroidissement liquide est bien plus efficace que l'air pour ces composants.",
  5: "Un seul datacenter peut consommer autant d'eau qu'une ville de 10 000 habitants en une seule journée pour ses besoins de refroidissement.",
  6: "L'empreinte carbone du numérique mondial dépasse celle de l'aviation civile. L'optimisation est cruciale.",
  7: "Entraîner un grand modèle de langage peut émettre autant de CO2 que 5 voitures sur toute leur durée de vie.",
  8: "La chaleur fatale des datacenters peut être récupérée pour chauffer des serres agricoles ou des piscines municipales.",
  9: "Les serveurs fonctionnent de manière optimale entre 18 et 27°C. Refroidir en dessous de 18°C est souvent un gaspillage d'énergie.",
  10: "L'eau utilisée pour le refroidissement des datacenters doit être extrêmement pure pour éviter la corrosion des équipements.",
  11: "Certains datacenters sont construits sous l'eau ou dans des pays nordiques pour profiter d'un refroidissement naturel gratuit.",
  12: "L'optimisation logicielle (code plus efficace) peut réduire la consommation d'énergie d'un serveur jusqu'à 90%.",
  13: "La cybersécurité est aussi une question écologique : les attaques DDoS consomment d'énormes quantités d'énergie et de bande passante."
};
