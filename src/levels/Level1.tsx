import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, TerminalSquare, AlertTriangle, Droplets, Image as ImageIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import Hint from '../components/Hint';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import NumberInput from '../components/NumberInput';

export default function Level1({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [hasScored, setHasScored] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (waterAmount === 5) {
      setIsSuccess(true);
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
      className="bg-slate-900 border border-emerald-500/30 p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: 5
        </div>
      )}
      <div className="flex items-center gap-3 mb-4 border-b border-emerald-900/50 pb-3">
        <TerminalSquare className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 1 : Le Coût Caché
        </h2>
      </div>

      <div className="mb-5">
        <NaiaDialogue 
          message={
            <>
              Bonjour Agent. Je suis NAÏA. Notre première tâche est d'identifier la source de notre surconsommation d'eau. Regardez ce rapport d'analyse sur la génération d'images par <TechTerm term="IA" />. Calculez la consommation pour une seule image.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-5 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Visual Representation */}
          <div className="w-full lg:w-3/5 bg-slate-950 p-6 rounded-xl border border-slate-800 relative flex flex-col justify-center">
            {/* Decorative background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-amber-400 mb-5 font-mono font-bold justify-center">
                <AlertTriangle className="w-5 h-5" />
                <span>RAPPORT D'ANALYSE : GÉNÉRATION D'IMAGES <TechTerm term="IA" /></span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-5">
                <motion.div 
                  className="flex flex-col items-center gap-3"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    <ImageIcon className="w-20 h-20 text-blue-400 relative z-10" />
                    <div className="absolute -top-3 -right-3 bg-slate-800 text-sm font-bold px-3 py-1 rounded-full border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-20">x100</div>
                  </div>
                  <span className="font-bold text-slate-400 text-center">100 Images<br/>Générées</span>
                </motion.div>

                <div className="flex flex-col items-center">
                  <ArrowRight className="w-10 h-10 text-slate-600 hidden sm:block" />
                  <div className="text-slate-600 sm:hidden my-4">↓</div>
                  <span className="text-xs text-slate-500 uppercase tracking-widest mt-2 hidden sm:block">Nécessite</span>
                </div>

                <motion.div 
                  className="flex flex-col items-center gap-3"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                    <Droplets className="w-20 h-20 text-emerald-500 relative z-10" />
                    <div className="absolute -top-3 -right-3 bg-slate-800 text-sm font-bold px-3 py-1 rounded-full border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20">500ml</div>
                  </div>
                  <span className="font-bold text-slate-400 text-center">Eau Évaporée<br/>(<TechTerm term="Refroidissement" />)</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Interaction Area */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center space-y-4">
            <div className="bg-blue-950/30 border border-blue-500/30 p-5 rounded-lg">
              <p className="font-bold text-blue-300 text-lg leading-relaxed">
                Question de sécurité :
              </p>
              <p className="text-slate-300 mt-2">
                Combien de millilitres (ml) d'eau sont "bus" par le <TechTerm term="Datacenter" /> pour générer <strong className="text-white">1 seule image</strong> ?
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
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
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
                  className="flex flex-col items-center p-6 bg-emerald-950/50 border border-emerald-500 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                    ACCÈS AUTORISÉ
                  </div>
                  <p className="text-center text-sm text-emerald-100/80 mb-6">
                    Exactement. 5 ml par image. Cela semble peu, mais multiplié par des milliards de requêtes, l'impact sur les ressources en eau est colossal.
                  </p>
                  <button
                    onClick={onComplete}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    CONTINUER
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        <Hint hintText="Saviez-vous que l'IA générative consomme beaucoup plus d'eau que les autres types d'IA pour refroidir ses processeurs ultra-puissants ?" delaySeconds={30} />
      </div>
    </motion.div>
  );
}
