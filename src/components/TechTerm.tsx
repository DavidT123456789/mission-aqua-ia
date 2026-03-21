import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';


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
  className?: string;
}

export default function TechTerm({ term, children, className = '' }: TechTermProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDiscovered, setIsDiscovered] = useState(false);
  const [positionClass, setPositionClass] = useState('left-1/2 -translate-x-1/2');
  const [arrowClass, setArrowClass] = useState('left-1/2 -translate-x-1/2');
  const spanRef = useRef<HTMLSpanElement>(null);
  const info = TERMS_DICTIONARY[term] || { title: term, definition: 'Terme technique lié à l\'IA ou à l\'écologie.' };

  useEffect(() => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (saved) {
      const state = JSON.parse(saved);
      const discovered = state.discoveredTerms || [];
      setIsDiscovered(discovered.includes(term));
    }
  }, [term]);

  // Listen for global discovery events to update all instances of the same term
  useEffect(() => {
    const handleDiscovery = (e: any) => {
      if (e.detail === term) {
        setIsDiscovered(true);
      }
    };
    window.addEventListener('discoverTerm', handleDiscovery);
    return () => window.removeEventListener('discoverTerm', handleDiscovery);
  }, [term]);

  useEffect(() => {
    if (isHovered && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
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
    if (!isDiscovered) {
      window.dispatchEvent(new CustomEvent('discoverTerm', { detail: term }));
      setIsDiscovered(true);
    }
  };

  return (
    <span 
      className={`relative inline-block ${className}`.trim()}
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleMouseEnter}
      onBlur={() => setIsHovered(false)}
    >
      <span 
        tabIndex={0}
        className={`cursor-help border-b border-dotted ${isDiscovered ? 'border-emerald-400 text-emerald-300' : 'border-amber-400 text-amber-300'} hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:rounded transition-colors inline-flex items-center`}
      >
        {children || term}
      </span>

      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={`absolute z-[9999] bottom-full ${positionClass} mb-2 w-72 p-4 bg-slate-900 border border-slate-700 rounded-lg pointer-events-none block shadow-2xl not-italic text-left font-normal tracking-normal`}
          >
            <span className="text-emerald-400 font-bold text-sm mb-1.5 flex items-center gap-2 normal-case font-sans not-italic tracking-normal">
              {info.title}
            </span>
            <span className="text-slate-200 text-sm leading-relaxed font-sans font-normal block normal-case not-italic tracking-normal">
              {info.definition}
            </span>
            <span className={`absolute top-full ${arrowClass} border-8 border-transparent border-t-slate-700`}></span>
            <span className={`absolute top-[calc(100%-1px)] ${arrowClass} border-8 border-transparent border-t-slate-900`}></span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
