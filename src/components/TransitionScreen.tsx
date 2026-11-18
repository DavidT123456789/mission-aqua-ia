import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, ChevronRight, Star, ArrowUpRight } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { LEVEL_NAMES } from '../constants';

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
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pointsGained <= 0) return;
    
    const duration = 1500;
    const start = score - pointsGained;
    const end = score;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentScore = Math.floor(start + (end - start) * easedProgress);
      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, pointsGained]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-xl overflow-y-auto font-mono flex items-center justify-center p-4"
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,148,136,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(13,148,136,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full sm:bg-slate-900/90 border-transparent sm:border-cyan-500/20 sm:border sm:px-8 sm:py-6 sm:rounded-3xl backdrop-blur-3xl relative overflow-hidden flex flex-col items-center gap-4 sm:gap-5 py-4 px-4 my-auto"
      >
        {/* Subtle Scan Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse" />

        {/* Central Icon Section */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-125 animate-pulse" />
          <div className="relative flex items-center justify-center">
            {/* Processing Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute w-20 h-20 border-2 border-dashed border-emerald-500/30 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute w-24 h-24 border border-cyan-500/15 rounded-full"
            />
            <div className="p-4 bg-slate-950/80 border-2 border-emerald-500/30 rounded-2xl backdrop-blur-md shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
              <Cpu className="w-9 h-9 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
        </motion.div>
        
        <div className="text-center space-y-3 w-full">
          <div className="space-y-1">
            <motion.h2 
              variants={itemVariants}
              className="text-4xl sm:text-5xl font-black text-white tracking-widest uppercase leading-none block drop-shadow-lg"
            >
              Niveau <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">{level}</span>
              <span className="text-xl sm:text-2xl text-slate-400 font-bold ml-2">/ 13</span>
            </motion.h2>
            {LEVEL_NAMES[level] && (
              <motion.p
                variants={itemVariants}
                className="text-xs sm:text-sm font-bold text-cyan-300/90 uppercase tracking-[0.18em]"
              >
                {LEVEL_NAMES[level]}
              </motion.p>
            )}
          </div>

          {/* Stats Dashboard */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 sm:gap-4 mt-3"
          >
            <div className="bg-slate-950/60 border border-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Score Total</span>
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{displayScore}</span>
              </div>
              {pointsGained > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-1.5 flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-[10px]">+ {pointsGained}</span>
                  <span className="text-[8px] uppercase opacity-80">bonus</span>
                </motion.div>
              )}
            </div>
            
            <div className="bg-slate-950/60 border border-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Chronoscope</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl sm:text-3xl font-black tabular-nums ${timeRemaining < 300 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="mt-1.5 text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <span>Efficacité:</span>
                <span className="text-cyan-300 font-black ml-1">{Math.round((timeRemaining / 1800) * 100)}%</span>
                <ArrowUpRight className="w-2.5 h-2.5 text-cyan-400" />
              </div>
            </div>
          </motion.div>
          
          {fact && (
            <motion.div
              variants={itemVariants}
              className="mt-3 p-4 sm:p-5 bg-slate-950/40 border border-white/10 rounded-2xl relative text-left backdrop-blur-sm overflow-hidden group"
            >
              {/* Technical Drawing */}
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none" />
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-[0.2em] shadow-md mb-2.5">
                  Le saviez-vous ?
                </span>
                <p className="text-slate-200 text-sm sm:text-[15px] leading-relaxed font-sans font-normal flex items-start gap-2">
                  <span className="text-emerald-500 text-xl font-serif leading-none select-none">"</span>
                  <span>{fact}</span>
                  <span className="text-emerald-500 text-xl font-serif self-end leading-none select-none">"</span>
                </p>
              </div>

              {/* Decorative corners */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-r-2 border-b-2 border-cyan-500/30 rounded-br-lg" />
            </motion.div>
          )}
        </div>

        <div className="w-full mt-1">
          {!isComplete ? (
            <div
              onClick={() => setIsComplete(true)}
              className="flex flex-col items-center gap-3 w-full cursor-pointer"
              title="Cliquer pour passer"
            >
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest px-1">
                  <span>Synchronisation des protocoles...</span>
                  <span>CLIQUER POUR PASSER</span>
                </div>
                {/* Segmented Loading Bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full flex gap-1 p-1 border border-white/10 overflow-hidden relative">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.1 }}
                      animate={{ opacity: 1 }}
                      transition={{ 
                        duration: 0.2, 
                        delay: i * 0.08,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="flex-grow h-full bg-emerald-500/60 rounded-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={itemVariants}
              className="w-full flex justify-center"
            >
              <button
                onClick={onTransitionComplete}
                className="group relative flex items-center gap-3 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_32px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] border border-emerald-400 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent,25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite] pointer-events-none" />
                <span className="relative z-10">Continuer la Mission</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
