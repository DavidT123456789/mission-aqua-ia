import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, ChevronRight, Star } from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface TransitionScreenProps {
  level: number;
  fact?: string;
  onTransitionComplete: () => void;
  score: number;
  pointsGained: number;
  timeRemaining: number;
  key?: string;
}

export default function TransitionScreen({ level, fact, onTransitionComplete, score, pointsGained, timeRemaining }: TransitionScreenProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [displayScore, setDisplayScore] = useState(score - pointsGained);

  useEffect(() => {
    // Prevent body scroll when transition screen is mounted
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      // Success sound removed as requested
    }, 2700); // Slightly more than the bar duration
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pointsGained <= 0) return;
    
    const duration = 2000; // Counter duration
    const start = score - pointsGained;
    const end = score;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      const currentScore = Math.floor(start + (end - start) * easedProgress);
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, pointsGained]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-md overflow-y-auto font-mono"
    >
      <div className="min-h-[100dvh] min-h-full flex flex-col items-center justify-center p-4 py-12 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 20,
            mass: 1
          }}
          className="flex flex-col items-center gap-6 sm:gap-8 sm:glass px-4 py-8 sm:p-10 sm:rounded-3xl border border-transparent sm:border-white/10 relative overflow-hidden max-w-xl w-full z-10 my-auto"
        >
        <div className="relative">
          <Terminal className="w-20 h-20 text-emerald-400 relative z-10" />
        </div>
        
        <div className="text-center space-y-2 w-full">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.5em] font-bold block"
          >
            Initialisation du Système
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic"
          >
            Niveau {level}
          </motion.h2>

          {/* Score counter */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-1 mt-2"
          >
            <span className="text-yellow-500/60 text-[10px] uppercase tracking-widest font-bold">Score Total</span>
            <div className="text-4xl font-black text-yellow-400 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                <span className="tabular-nums drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">{displayScore}</span>
              </div>
              {pointsGained > 0 && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="text-sm font-bold drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">+{pointsGained}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="text-[8px] text-yellow-500/60 uppercase tracking-tighter">Points gagnés</span>
                </div>
              )}
            </div>
            
            {/* Performance stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Temps restant:</span>
                <span className={timeRemaining < 60 ? "text-red-400" : "text-emerald-400"}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Efficacité:</span>
                <span className="text-cyan-400">{Math.round((timeRemaining / 1800) * 100)}%</span>
              </div>
            </motion.div>
          </motion.div>
          
          {fact && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="mt-6 p-6 bg-slate-950/60 border border-emerald-500/20 rounded-2xl relative group text-left shadow-2xl"
            >
              <div className="absolute -top-3 left-6 px-4 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                Le saviez-vous ?
              </div>
              <p className="text-emerald-50/90 text-lg leading-relaxed font-medium">
                {fact}
              </p>
              
              {/* Decorative corner */}
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500/30 rounded-br-sm" />
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          {!isComplete ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-full h-2 bg-slate-950 rounded-full relative overflow-hidden p-0.5 border border-white/10 sm:min-w-[300px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                />
              </div>
              <div className="flex items-center gap-3 text-emerald-500/40 font-mono text-[10px] uppercase tracking-[0.3em]">
                <span className="opacity-60">
                  Synchronisation des données
                </span>
              </div>
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTransitionComplete}
              className="group flex items-center gap-3 bg-emerald-500 text-slate-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)]"
            >
              Continuer la Mission
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
