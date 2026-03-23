import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, ChevronRight, Star, ArrowUpRight } from 'lucide-react';
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
    }, 2800);
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
        className="max-w-2xl w-full sm:bg-slate-900/90 border-transparent sm:border-cyan-500/20 sm:border sm:p-10 sm:rounded-3xl backdrop-blur-3xl relative overflow-hidden flex flex-col items-center gap-8 py-8 px-4 my-auto"
      >
        {/* Subtle Scan Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse" />

        {/* Central Icon Section */}
        <motion.div variants={itemVariants} className="relative mt-2">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative flex items-center justify-center">
            {/* Processing Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute w-28 h-28 border-2 border-dashed border-emerald-500/30 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute w-36 h-36 border border-cyan-500/10 rounded-full"
            />
            <div className="p-7 bg-slate-950/80 border-2 border-emerald-500/30 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
              <Cpu className="w-14 h-14 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
        </motion.div>
        
        <div className="text-center space-y-4 w-full">
          <div className="space-y-1">
            <motion.h2 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black text-white tracking-widest uppercase leading-none block drop-shadow-lg"
            >
              Niveau <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">{level}</span>
            </motion.h2>
          </div>

          {/* Stats Dashboard */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 mt-6"
          >
            <div className="bg-slate-950/60 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Score Total</span>
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span className="text-3xl font-black text-white tabular-nums">{displayScore}</span>
              </div>
              {pointsGained > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-2 flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-[10px]">+ {pointsGained}</span>
                  <span className="text-[8px] uppercase opacity-80">bonus</span>
                </motion.div>
              )}
            </div>
            
            <div className="bg-slate-950/60 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Chronoscope</span>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-black tabular-nums ${timeRemaining < 300 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="mt-2 text-[8px] text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <span>Efficacité:</span>
                <span className="text-cyan-300 font-black ml-1">{Math.round((timeRemaining / 1800) * 100)}%</span>
                <ArrowUpRight className="w-2.5 h-2.5 text-cyan-400" />
              </div>
            </div>
          </motion.div>
          
          {fact && (
            <motion.div
              variants={itemVariants}
              className="mt-6 p-8 pt-12 bg-slate-950/40 border border-white/10 rounded-3xl relative text-left backdrop-blur-sm overflow-hidden group"
            >
              {/* Technical Drawing */}
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
              
              <div className="absolute top-4 left-6 px-4 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg z-10">
                Le saviez-vous ?
              </div>
              
              <div className="relative z-10 mt-2">
                <p className="text-slate-300 text-lg leading-relaxed font-sans font-light flex items-start gap-2">
                  <span className="text-emerald-500 text-2xl font-serif leading-none">"</span>
                  <span className="italic">{fact}</span>
                  <span className="text-emerald-500 text-2xl font-serif self-end leading-none">"</span>
                </p>
              </div>

              {/* Decorative corners */}
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500/30 rounded-br-lg" />
            </motion.div>
          )}
        </div>

        <div className="w-full mt-2">
          {!isComplete ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[8px] text-emerald-500/60 font-bold uppercase tracking-widest px-1">
                  <span>Infecting Local Cache...</span>
                  <span>SYNC_DATA</span>
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
                className="group relative flex items-center gap-4 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] border border-emerald-400 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent,25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite] pointer-events-none" />
                <span className="relative z-10">Continuer la Mission</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
