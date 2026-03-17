import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';

const TERMS_DICTIONARY: Record<string, { title: string; definition: string }> = {
  'LLM': {
    title: 'Large Language Model',
    definition: 'Un modèle de langage géant (comme GPT) capable de comprendre et générer du texte en imitant le langage humain.'
  },
  'IA': {
    title: 'Intelligence Artificielle',
    definition: 'Programmes informatiques capables de simuler des traits de l\'intelligence humaine : raisonnement, apprentissage, création.'
  },
  'Datacenter': {
    title: 'Centre de Données',
    definition: 'Un immense bâtiment rempli de serveurs informatiques qui stockent des données et font tourner les IA. Ils chauffent beaucoup !'
  },
  'GPU': {
    title: 'Processeur Graphique',
    definition: 'Une puce électronique ultra-puissante utilisée pour entraîner les IA. Elle consomme énormément d\'énergie et dégage de la chaleur.'
  },
  'Algorithme': {
    title: 'Algorithme',
    definition: 'Une suite d\'instructions précises données à un ordinateur pour résoudre un problème ou accomplir une tâche.'
  },
  'Machine Learning': {
    title: 'Apprentissage Automatique',
    definition: 'Une technique d\'IA où l\'ordinateur apprend à partir de données au lieu d\'être programmé directement.'
  },
  'Serveur': {
    title: 'Serveur',
    definition: 'Un ordinateur puissant qui reste allumé 24h/24 pour fournir des services ou des données à d\'autres ordinateurs via Internet.'
  },
  'Cloud': {
    title: 'Le Nuage',
    definition: 'L\'ensemble des serveurs distants accessibles par Internet. Ce n\'est pas immatériel : ça utilise de vraies machines physiques.'
  },
  'Refroidissement': {
    title: 'Refroidissement liquide',
    definition: 'L\'utilisation d\'eau pour absorber la chaleur des serveurs. Cette eau s\'évapore et disparaît du cycle local.'
  }
};

interface TechTermProps {
  term: string;
  children?: React.ReactNode;
}

export default function TechTerm({ term, children }: TechTermProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [positionClass, setPositionClass] = useState('left-1/2 -translate-x-1/2');
  const [arrowClass, setArrowClass] = useState('left-1/2 -translate-x-1/2');
  const spanRef = useRef<HTMLSpanElement>(null);
  const info = TERMS_DICTIONARY[term] || { title: term, definition: 'Terme technique lié à l\'IA ou à l\'écologie.' };

  useEffect(() => {
    if (isHovered && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const halfTooltip = tooltipWidth / 2;
      
      let newPosClass = 'left-1/2 -translate-x-1/2';
      let newArrowClass = 'left-1/2 -translate-x-1/2';

      // Vérifier le débordement à droite
      if (rect.left + rect.width / 2 + halfTooltip > window.innerWidth - 20) {
        newPosClass = 'right-0';
        // Placer la flèche en fonction de la taille du mot, mais gardée à droite
        newArrowClass = 'right-[10%]';
      } 
      // Vérifier le débordement à gauche
      else if (rect.left + rect.width / 2 - halfTooltip < 20) {
        newPosClass = 'left-0';
        newArrowClass = 'left-[10%]';
      }

      setPositionClass(newPosClass);
      setArrowClass(newArrowClass);
    }
  }, [isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    window.dispatchEvent(new CustomEvent('discoverTerm', { detail: term }));
  };

  return (
    <span 
      className="relative inline-block"
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="cursor-help border-b border-dotted border-emerald-400 text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1">
        {children || term}
        <Info className="w-3 h-3 opacity-50" />
      </span>

      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={`absolute z-[100] bottom-full ${positionClass} mb-2 w-64 p-3 bg-slate-900 border border-emerald-500/50 rounded-lg shadow-xl pointer-events-none block`}
          >
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              <Info className="w-3 h-3" />
              {info.title}
            </span>
            <span className="text-slate-200 text-xs leading-relaxed font-sans block">
              {info.definition}
            </span>
            <span className={`absolute top-full ${arrowClass} border-8 border-transparent border-t-slate-900`}></span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
