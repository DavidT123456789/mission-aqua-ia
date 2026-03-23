import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';


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
  
  // Tracking the precise on-screen coordinates for the portal
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 144 });
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

  const updatePosition = () => {
    if (isHovered && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const halfTooltip = tooltipWidth / 2;
      
      let targetLeft = rect.left + rect.width / 2;
      let arrowLeft = halfTooltip; // The arrow points to center of tooltip by default

      // Débordement à droite
      if (targetLeft + halfTooltip > window.innerWidth - 20) {
        let diff = (targetLeft + halfTooltip) - (window.innerWidth - 20);
        targetLeft -= diff;
        arrowLeft += diff; // offset arrow back towards the real word center
      } 
      // Débordement à gauche
      else if (targetLeft - halfTooltip < 20) {
        let diff = 20 - (targetLeft - halfTooltip);
        targetLeft += diff;
        arrowLeft -= diff;
      }

      setTooltipPos({
        top: rect.top + window.scrollY, // Keep it absolute to the document so it scrolls naturally
        left: targetLeft,
        arrowLeft: arrowLeft
      });
    }
  };

  useEffect(() => {
    updatePosition();
    if (isHovered) {
      // Passive listener helps smooth scrolling without blocking execution
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
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
      className={`relative inline-block ${className} ${isHovered ? 'z-[60]' : ''}`.trim()}
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

      {/* Render the tooltip at the document body level using a React Portal so it bypasses all z-index stacking context restrictions */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isHovered && (
            <motion.div
              style={{
                position: 'absolute',
                top: tooltipPos.top - 8, // slight margin
                left: tooltipPos.left,
                zIndex: 999999, // Super high z-index + Portal guarantees it is strictly above everything including HUD (z-50)
                pointerEvents: 'none'
              }}
              // Using CSS translate to center the tooltip exactly over its dynamic x/y anchor points
              initial={{ opacity: 0, y: 'calc(-100% + 10px)', x: '-50%', scale: 0.95 }}
              animate={{ opacity: 1, y: '-100%', x: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: 'calc(-100% + 5px)', x: '-50%', scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-72 p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl block text-left font-normal tracking-normal !fixed"
            >
              <span className="text-emerald-400 font-bold text-sm mb-1.5 flex items-center gap-2 normal-case font-sans not-italic tracking-normal">
                {info.title}
              </span>
              <span className="text-slate-200 text-sm leading-relaxed font-sans font-normal block normal-case not-italic tracking-normal">
                {info.definition}
              </span>
              
              {/* Tooltip arrows dynamically offset */}
              <span 
                className="absolute top-full border-8 border-transparent border-t-slate-700 -translate-x-1/2"
                style={{ left: `${tooltipPos.arrowLeft}px` }}
              ></span>
              <span 
                className="absolute top-[calc(100%-1px)] border-8 border-transparent border-t-slate-900 -translate-x-1/2"
                style={{ left: `${tooltipPos.arrowLeft}px` }}
              ></span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}
