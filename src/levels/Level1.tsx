import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, TerminalSquare, AlertTriangle, Droplets, Image as ImageIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import NumberInput from '../components/NumberInput';
import { soundManager } from '../utils/soundManager';

export default function Level1({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [hasScored, setHasScored] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waterAmount === 5) {
      setIsSuccess(true);
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(100, 20);
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
      setWaterAmount(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <TerminalSquare className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 1 : Le Coût Caché
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Bonjour Agent. Je suis NAÏA. Notre première tâche pour stopper HYDRA est de quantifier exactement sa surconsommation d'eau. Regardez ce rapport d'analyse sur la génération d'images par <TechTerm term="IA" />. Calculez la consommation pour une seule image.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-5 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Visual Representation */}
          <div className="w-full lg:w-3/5 glass p-6 rounded-2xl relative flex flex-col justify-center">
            {/* Decorative background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98112_1px,transparent_1px),linear-gradient(to_bottom,#10b98112_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-amber-400 mb-6 font-mono font-bold justify-center bg-amber-950/20 py-2 rounded-lg border border-amber-500/20 relative group">
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <AlertTriangle className="w-4 h-4 relative z-10" />
                <span className="text-[10px] md:text-xs tracking-widest relative z-10">Rapport d'Analyse : Consommation <TechTerm term="IA" /></span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
                {/* Input Side */}
                <motion.div 
                  className="flex flex-col items-center gap-3"
                  whileHover={{ y: -2 }}
                >
                  <div className="relative">
                    <div className="relative z-10 p-5 bg-slate-950 border border-blue-500/30 rounded-2xl shadow-inner">
                      <ImageIcon className="w-12 h-12 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-tighter">Volume Production</span>
                    <span className="font-black text-white text-xl block tracking-tight">100 IMAGES</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Générées / Session</span>
                  </div>
                </motion.div>

                <div className="flex flex-col items-center group">
                  <div className="relative hidden sm:block">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <ArrowRight className="w-8 h-8 text-emerald-400/50 group-hover:text-emerald-400 relative z-10 transition-colors" />
                  </div>
                  <div className="text-emerald-500/50 sm:hidden my-2 text-xl font-bold animate-bounce">↓</div>
                </div>

                {/* Output Side */}
                <motion.div 
                  className="flex flex-col items-center gap-3"
                  whileHover={{ y: -2 }}
                >
                  <div className="relative">
                    <div className="relative z-10 p-5 bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-inner">
                      <Droplets className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-tighter">Consommation Totale</span>
                    <span className="font-black text-white text-xl block tracking-tight">500mL D'EAU</span>
                    <span className="text-[10px] text-slate-400 font-bold block italic opacity-80">
                      (≈ 1 petite bouteille)
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold flex items-center justify-center gap-1 mt-1">
                      <TechTerm term="Refroidissement" />
                    </span>
                  </div>
                </motion.div>
              </div>
              
              <div className="mt-4 border-t border-emerald-500/10"></div>
            </div>
          </div>

          {/* Interaction Area */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center space-y-4">
            <div className="bg-blue-950/30 border border-blue-500/30 p-5 rounded-lg">
              <p className="font-bold text-blue-300 text-lg leading-relaxed">
                Question de sécurité :
              </p>
              <p className="text-slate-300 mt-2">
                Combien de millilitres (mL) d'eau sont "bus" par le <TechTerm term="Datacenter" /> pour générer <strong className="text-white">1 seule image</strong> ?
              </p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className={`p-4 rounded-2xl transition-all ${showError ? 'bg-red-500/10 border-2 border-red-500 animate-shake' : ''}`}>
                  <NumberInput
                    value={waterAmount}
                    onChange={setWaterAmount}
                    unit="ml"
                    min={0}
                    max={100}
                  />
                </div>
                
                {showError && (
                  <p className="text-red-400 text-center text-sm font-bold">Code incorrect. Recalculez.</p>
                )}

                <button
                  type="submit"
                  disabled={waterAmount === 0}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    waterAmount === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  DÉVERROUILLER
                </button>
              </form>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center p-6 bg-emerald-950/50 border border-emerald-500 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                    ACCÈS AUTORISÉ
                  </div>
                  <p className="text-center text-sm text-emerald-100/80 mb-6">
                    Exactement. 5 mL par image. Cela semble peu, mais multiplié par des milliards de requêtes, l'impact sur les ressources en eau est colossal.
                  </p>
                  <button
                    onClick={onComplete}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors"
                  >
                    CONTINUER
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
