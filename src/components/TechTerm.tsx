import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { TERM_DISCOVERY_DELAY_MS, TERM_DISCOVERY_POINTS } from '../constants';
import { useNaiaHints } from './NaiaContext';
import { EASE_OUT_EXPO, EASE_IN_OUT, SPRING_SNAPPY } from '../utils/motion';


export const TERMS_DICTIONARY: Record<string, { title: string; definition: string }> = {
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
    title: 'Système de refroidissement',
    definition: 'Dispositif évacuant la chaleur des serveurs : par évaporation d\'eau (très gourmand en eau), climatisation mécanique (gourmande en électricité) ou air extérieur froid (Free Cooling).'
  },
  'Prompt': {
    title: 'Prompt',
    definition: 'Une instruction ou un texte envoyé à une IA pour obtenir une réponse ou une image spécifique.'
  },
  'IA Générative': {
    title: 'IA Générative',
    definition: 'Une technologie d\'IA capable de créer du contenu original (texte, image, son) à partir de données existantes.'
  },
  'Biais': {
    title: 'Biais de représentativité',
    definition: 'Distorsion dans les décisions d\'une IA lorsque certaines zones ou populations sont sous-représentées dans ses données d\'entraînement.'
  },
  'Topographie': {
    title: 'Topographie',
    definition: 'L\'étude des formes du terrain (relief, altitudes). C\'est crucial pour l\'eau car elle coule toujours vers le point le plus bas !'
  },
  'Hydrologie': {
    title: 'Hydrologie',
    definition: 'La science qui étudie l\'eau sur la Terre, sa circulation, et sa répartition (nappes phréatiques, rivières, etc.).'
  },
  'PUE': {
    title: 'Power Usage Effectiveness (PUE)',
    definition: 'Indicateur d\'efficacité énergétique d\'un datacenter (énergie totale du bâtiment ÷ énergie des serveurs). Plus il est proche de 1,0, moins il y a de pertes en climatisation.'
  },
  'CPU': {
    title: 'Processeur (CPU)',
    definition: 'Le cerveau d\'un ordinateur ou serveur qui exécute les calculs et coordonne les opérations du système.'
  },
  'RAM': {
    title: 'Mémoire Vive (RAM)',
    definition: 'Mémoire ultra-rapide qui stocke temporairement les données en cours de traitement. Une barrette défaillante provoque des plantages.'
  },
  'DEEE': {
    title: 'Déchets Électriques et Électroniques',
    definition: 'Filière de recyclage spécialisée qui dépollue les composants hors service (métaux lourds) et récupère l\'or, le cuivre ou les terres rares.'
  },
  'Eau virtuelle': {
    title: 'Eau virtuelle (Empreinte eau)',
    definition: 'Toute l\'eau cachée consommée durant la fabrication d\'un objet (ex. : gravure ultra-pure des puces électroniques) et la production de son énergie.'
  },
  'Latence': {
    title: 'Latence (Temps de réponse)',
    definition: 'Délai entre l\'envoi d\'une demande et la réception du résultat (mesuré en millisecondes, ms). Plus la latence est faible, plus le système réagit vite.'
  }
};

interface TechTermProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export default function TechTerm({ term, children, className = '' }: TechTermProps) {
  const hintCtx = useNaiaHints();
  const awardsPoints = (hintCtx?.level ?? 0) < 14;

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDiscovered, setIsDiscovered] = useState(false);
  const [justDiscovered, setJustDiscovered] = useState(false);
  const isOpen = isHovered || isPinned;

  // Tracking the precise on-screen coordinates for the portal
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 144, placeBelow: false });
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const info = TERMS_DICTIONARY[term] || { title: term, definition: 'Terme technique lié à l\'IA ou à l\'écologie.' };

  useEffect(() => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const discovered = state.discoveredTerms || [];
        setIsDiscovered(discovered.includes(term));
      } catch {
        // ignore corrupted save
      }
    }
  }, [term]);

  // Listen for global discovery and reset events to keep all instances in sync
  useEffect(() => {
    const handleDiscovery = (e: Event) => {
      if ((e as CustomEvent<string>).detail === term) {
        setIsDiscovered(true);
      }
    };
    const handleReset = () => {
      setIsDiscovered(false);
      setJustDiscovered(false);
    };
    window.addEventListener('discoverTerm', handleDiscovery);
    window.addEventListener('resetDiscoveredTerms', handleReset);
    return () => {
      window.removeEventListener('discoverTerm', handleDiscovery);
      window.removeEventListener('resetDiscoveredTerms', handleReset);
    };
  }, [term]);

  // Silent reading timer while tooltip stays open (no distracting bar during reading)
  useEffect(() => {
    if (!isOpen || isDiscovered) return;

    const timeoutId = setTimeout(() => {
      setJustDiscovered(true);
      setIsDiscovered(true);
      window.dispatchEvent(new CustomEvent('discoverTerm', { detail: term }));
    }, TERM_DISCOVERY_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, isDiscovered, term]);

  const updatePosition = () => {
    if (isOpen && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const halfTooltip = tooltipWidth / 2;

      let targetLeft = rect.left + rect.width / 2;
      let arrowLeft = halfTooltip; // The arrow points to center of tooltip by default

      // Débordement à droite
      if (targetLeft + halfTooltip > window.innerWidth - 20) {
        const diff = (targetLeft + halfTooltip) - (window.innerWidth - 20);
        targetLeft -= diff;
        arrowLeft += diff; // offset arrow back towards the real word center
      }
      // Débordement à gauche
      else if (targetLeft - halfTooltip < 20) {
        const diff = 20 - (targetLeft - halfTooltip);
        targetLeft += diff;
        arrowLeft -= diff;
      }

      const placeBelow = rect.top < 170;

      setTooltipPos({
        top: (placeBelow ? rect.bottom : rect.top) + window.scrollY,
        left: targetLeft,
        arrowLeft,
        placeBelow
      });
    }
  };

  useEffect(() => {
    updatePosition();
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close pinned tooltip when tapping/clicking outside or pressing Escape
  useEffect(() => {
    if (!isPinned) return;

    const handleOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (spanRef.current?.contains(target) || tooltipRef.current?.contains(target)) {
        return;
      }
      setIsPinned(false);
      setIsHovered(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinned]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent parent interactive elements (e.g. option buttons in L6/L9/L10) from firing
    e.stopPropagation();
    e.preventDefault();
    setIsPinned(prev => {
      const next = !prev;
      if (!next) {
        setIsHovered(false);
      }
      return next;
    });
  };

  return (
    <span
      className={`relative inline-block ${className} ${isOpen ? 'z-[60]' : ''}`.trim()}
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleClick}
    >
      <span
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-label={`Définition de ${info.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsPinned(prev => {
              const next = !prev;
              if (!next) {
                setIsHovered(false);
              }
              return next;
            });
          }
        }}
        className={`cursor-help underline decoration-dotted underline-offset-[4px] decoration-[1.5px] rounded-[3px] px-0.5 -mx-0.5 ${
          isDiscovered
            ? 'text-emerald-300/95 decoration-emerald-400/65 hover:text-emerald-200 hover:decoration-emerald-300 hover:bg-emerald-400/10 focus-visible:ring-emerald-400/60'
            : 'text-amber-300/95 decoration-amber-400/75 hover:text-amber-200 hover:decoration-amber-300 hover:bg-amber-400/10 focus-visible:ring-amber-400/60'
        } focus:outline-none focus-visible:ring-2 transition-colors inline`}
      >
        {children || term}
      </span>

      {/* Render the tooltip at the document body level using a React Portal so it bypasses all z-index stacking context restrictions */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={() => setJustDiscovered(false)}>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: tooltipPos.placeBelow ? tooltipPos.top + 8 : tooltipPos.top - 8,
                left: tooltipPos.left,
                zIndex: 999999, // Super high z-index + Portal guarantees it is strictly above everything including HUD (z-50)
                pointerEvents: isPinned ? 'auto' : 'none'
              }}
              initial={{
                opacity: 0,
                y: tooltipPos.placeBelow ? '-6px' : 'calc(-100% + 6px)',
                x: '-50%',
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                y: tooltipPos.placeBelow ? '0%' : '-100%',
                x: '-50%',
                scale: 1,
                transition: { duration: 0.18, ease: EASE_OUT_EXPO }
              }}
              exit={{
                opacity: 0,
                y: tooltipPos.placeBelow ? '-4px' : 'calc(-100% + 4px)',
                x: '-50%',
                scale: 0.97,
                transition: { duration: 0.12, ease: EASE_IN_OUT }
              }}
              className={`w-72 p-4 bg-slate-900 border ${
                justDiscovered ? 'border-emerald-500/60' : 'border-slate-700'
              } rounded-lg shadow-2xl block text-left font-normal tracking-normal absolute transition-colors duration-300`}
            >
              <AnimatePresence>
                {justDiscovered && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.75, y: tooltipPos.placeBelow ? -4 : 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING_SNAPPY}
                    className={`absolute ${
                      tooltipPos.placeBelow ? '-bottom-3' : '-top-3'
                    } right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400/60 text-emerald-300 text-[11px] font-mono font-bold shadow-lg normal-case not-italic tracking-normal`}
                  >
                    <Check className="w-3 h-3 shrink-0" />
                    <span>{awardsPoints ? `+${TERM_DISCOVERY_POINTS} pts` : 'Glossaire'}</span>
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-emerald-400 font-bold text-sm mb-1.5 flex items-center justify-between gap-2 normal-case font-sans not-italic tracking-normal">
                <span>{info.title}</span>
                {isPinned && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned(false);
                      setIsHovered(false);
                    }}
                    className="inline-flex items-center justify-center text-slate-400 hover:text-white p-1 rounded bg-slate-800 border border-slate-700 sm:hidden"
                    aria-label="Fermer la définition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
              <span className="text-slate-200 text-sm leading-relaxed font-sans font-normal block normal-case not-italic tracking-normal">
                {info.definition}
              </span>

              {/* Tooltip arrows dynamically offset */}
              {tooltipPos.placeBelow ? (
                <>
                  <span
                    className={`absolute bottom-full border-8 border-transparent -translate-x-1/2 transition-colors duration-300 ${
                      justDiscovered ? 'border-b-emerald-500/60' : 'border-b-slate-700'
                    }`}
                    style={{ left: `${tooltipPos.arrowLeft}px` }}
                  ></span>
                  <span
                    className="absolute bottom-[calc(100%-1px)] border-8 border-transparent border-b-slate-900 -translate-x-1/2"
                    style={{ left: `${tooltipPos.arrowLeft}px` }}
                  ></span>
                </>
              ) : (
                <>
                  <span
                    className={`absolute top-full border-8 border-transparent -translate-x-1/2 transition-colors duration-300 ${
                      justDiscovered ? 'border-t-emerald-500/60' : 'border-t-slate-700'
                    }`}
                    style={{ left: `${tooltipPos.arrowLeft}px` }}
                  ></span>
                  <span
                    className="absolute top-[calc(100%-1px)] border-8 border-transparent border-t-slate-900 -translate-x-1/2"
                    style={{ left: `${tooltipPos.arrowLeft}px` }}
                  ></span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}
