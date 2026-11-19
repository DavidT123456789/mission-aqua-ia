import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Lock, AlertTriangle, Droplets, Image as ImageIcon, ArrowRight, ArrowDown, Calculator, CheckCircle2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import NumberInput from '../components/NumberInput';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

export default function Level1({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [showConversionHelper, setShowConversionHelper] = useState(false);
  const [conversionDraft, setConversionDraft] = useState('');
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [isSuccess, setIsSuccess] = useState(false);

  const [hasScored, setHasScored] = useState(false);
  const parsedConversion = parseInt(conversionDraft.replace(/\s+/g, ''), 10);
  const isConversionValid = parsedConversion === 18000;

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
    <LevelShell>
      
      <LevelHeader level={1} icon={Calculator} />

      <div className="mb-4 space-y-2">
        <HydraLog
          status="hostile"
          message="Génération HD en continu : 1 500 images/session. Pompage prioritaire de 18 L sur le réseau potable."
        />
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
                    <span className="text-[11px] text-blue-400/80 font-bold uppercase tracking-wider">Volume Production</span>
                    <span className="font-mono font-black text-white text-xl block tracking-tight">1 500 IMAGES</span>
                    <span className="text-[11px] text-slate-400">Générées en HD / session</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative hidden sm:block">
                    <ArrowRight className="w-8 h-8 text-emerald-400/70 relative z-10" aria-hidden="true" />
                  </div>
                  <ArrowDown className="w-6 h-6 text-emerald-400/70 sm:hidden my-1" aria-hidden="true" />
                </div>

                {/* Output Side */}
                <div className="flex flex-col items-center gap-2.5">
                  <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-inner">
                    <Droplets className="w-11 h-11 text-emerald-400" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-wider">Empreinte Totale</span>
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
            <div className="bg-blue-950/25 border border-blue-500/25 p-4 rounded-2xl space-y-2">
              <p className="font-mono font-bold text-blue-300 text-xs uppercase tracking-wider">
                Question de sécurité
              </p>
              <p className="text-slate-200 text-sm leading-relaxed">
                Combien de millilitres (mL) d'eau sont consommés par le <TechTerm term="Datacenter" /> pour générer <strong className="text-white">1 seule image</strong> ?
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <p className="text-[11px] font-mono text-cyan-300/90 bg-slate-950/60 border border-cyan-500/20 rounded-lg px-2.5 py-1.5 inline-block">
                  Rappel conversion : 1 L = 1 000 mL
                </p>
                {!isSuccess && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setShowConversionHelper((prev) => !prev);
                    }}
                    aria-expanded={showConversionHelper}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    {showConversionHelper ? 'Masquer l\'aide' : 'Aide conversion'}
                  </button>
                )}
              </div>

              {showConversionHelper && !isSuccess && (
                <div className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-cyan-500/25 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="text-slate-300 font-bold">1.</span>
                    <span className="text-slate-200">18 L =</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={conversionDraft}
                      onChange={(e) => setConversionDraft(e.target.value.replace(/[^\d\s]/g, ''))}
                      placeholder="?"
                      aria-label="Conversion de 18 litres en millilitres"
                      className={`w-24 px-2 py-1 rounded bg-slate-900 border text-center font-bold focus:outline-none transition-colors ${
                        isConversionValid
                          ? 'border-emerald-400 text-emerald-300'
                          : conversionDraft.length > 0
                          ? 'border-amber-500/60 text-amber-200'
                          : 'border-slate-700 text-white focus:border-cyan-400'
                      }`}
                    />
                    <span className="text-cyan-300 font-bold">mL</span>
                    {isConversionValid && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {isConversionValid ? (
                      <span className="text-emerald-300">
                        2. Calculez ensuite : <strong>18 000 mL ÷ 1 500 images</strong> = ? mL
                      </span>
                    ) : (
                      <span>Multipliez 18 par 1 000 pour passer en mL, puis divisez par 1 500 images.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className={`p-3 rounded-2xl transition-all ${isErrorFlash ? 'bg-red-500/10 border-2 border-red-500 animate-shake' : ''}`}>
                  <NumberInput
                    value={waterAmount}
                    onChange={setWaterAmount}
                    unit="mL"
                    min={0}
                    max={999}
                  />
                </div>

                <ActionButton
                  type="submit"
                  disabled={waterAmount === 0}
                  isError={isErrorFlash}
                  fullWidth
                >
                  <Lock className="w-4 h-4" />
                  DÉVERROUILLER
                </ActionButton>
              </form>
            ) : (
              <AnimatePresence>
                <LevelSuccessCard
                  title="ACCÈS AUTORISÉ"
                  description="Exactement : 18 000 mL ÷ 1 500 = 12 mL par image HD (eau directe de refroidissement et indirecte des centrales électriques). Multiplié par des milliards de requêtes, l'impact devient colossal ! Vous avez mesuré la fuite, passons à l'action sur le circuit d'HYDRA."
                  buttonLabel="CONTINUER"
                  onContinue={onComplete}
                  compact
                  fullWidthButton
                />
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </LevelShell>
  );
}
