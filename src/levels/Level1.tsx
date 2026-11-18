import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, TerminalSquare, AlertTriangle, Droplets, Image as ImageIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import NumberInput from '../components/NumberInput';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

export default function Level1({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [isSuccess, setIsSuccess] = useState(false);

  const [hasScored, setHasScored] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waterAmount <= 0 || isSuccess) return;
    if (waterAmount === 12) {
      clearError();
      setIsSuccess(true);
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(100, 0);
      }
    } else {
      triggerError("Pas tout à fait ! Vérifiez vos unités : convertissez d'abord les litres en millilitres avant de diviser.");
      onMistake?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <TerminalSquare className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 1 : Le Coût Caché
        </h2>
      </div>

      <div className="mb-4">
        <NaiaDialogue 
          message={
            <>
              Bonjour Agent ! Pour stopper HYDRA, on doit d'abord mesurer sa soif. Ce relevé montre l'eau consommée pour générer des images haute définition par <TechTerm term="IA" />.
            </>
          }
          objective={
            <>
              Calculez combien de <strong className="text-white">millilitres (mL)</strong> d'eau sont consommés pour <strong className="text-white">1 seule image</strong>.
            </>
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          {/* Visual Representation */}
          <div className="w-full lg:w-3/5 glass p-5 rounded-2xl relative flex flex-col justify-center">
            {/* Decorative background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98112_1px,transparent_1px),linear-gradient(to_bottom,#10b98112_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col justify-between gap-5">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold justify-center bg-amber-950/25 py-2 px-3 rounded-lg border border-amber-500/20 relative group">
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                <AlertTriangle className="w-4 h-4 relative z-10 shrink-0" />
                <span className="text-[11px] md:text-xs tracking-wider relative z-10">Rapport d'Analyse : Consommation <TechTerm term="IA" /></span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 py-2">
                {/* Input Side */}
                <div className="flex flex-col items-center gap-2.5">
                  <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-2xl shadow-inner">
                    <ImageIcon className="w-11 h-11 text-blue-400" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider">Volume Production</span>
                    <span className="font-mono font-black text-white text-xl block tracking-tight">1 500 IMAGES</span>
                    <span className="text-[11px] text-slate-400">Générées en HD / session</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative hidden sm:block">
                    <ArrowRight className="w-8 h-8 text-emerald-400/70 relative z-10" />
                  </div>
                  <div className="text-emerald-500/50 sm:hidden my-1 text-xl font-bold animate-bounce">↓</div>
                </div>

                {/* Output Side */}
                <div className="flex flex-col items-center gap-2.5">
                  <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-inner">
                    <Droplets className="w-11 h-11 text-emerald-400" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">Empreinte Totale</span>
                    <span className="font-mono font-black text-white text-xl block tracking-tight">18 LITRES D'EAU</span>
                    <span className="text-xs text-slate-400 block">
                      (≈ 18 bouteilles d'1 L)
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-0.5">
                      <TechTerm term="Refroidissement" /> + électricité
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interaction Area */}
          <div className="w-full lg:w-2/5 flex flex-col justify-between gap-4">
            <div className="bg-blue-950/25 border border-blue-500/25 p-4 rounded-xl">
              <p className="font-mono font-bold text-blue-300 text-xs uppercase tracking-wider">
                Question de sécurité
              </p>
              <p className="text-slate-200 text-sm mt-1.5 leading-relaxed">
                Combien de millilitres (mL) d'eau sont consommés par le <TechTerm term="Datacenter" /> pour générer <strong className="text-white">1 seule image</strong> ?
              </p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className={`p-3 rounded-2xl transition-all ${isErrorFlash ? 'bg-red-500/10 border-2 border-red-500 animate-shake' : ''}`}>
                  <NumberInput
                    value={waterAmount}
                    onChange={setWaterAmount}
                    unit="ml"
                    min={0}
                    max={999}
                  />
                </div>

                <button
                  type="submit"
                  disabled={waterAmount === 0}
                  className={`w-full py-3.5 rounded-xl font-mono font-bold text-base transition-all flex items-center justify-center gap-2 ${
                    waterAmount === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
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
                    Exactement : 18 000 mL ÷ 1 500 = 12 mL par image HD (eau directe de refroidissement et indirecte des centrales électriques). Multiplié par des milliards de requêtes, l'impact devient colossal ! Vous avez mesuré la fuite, passons à l'action sur le circuit d'HYDRA.
                  </p>
                  <button
                    onClick={onComplete}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
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
