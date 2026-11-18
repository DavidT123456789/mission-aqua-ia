import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, CheckCircle2, Droplets, Activity, Film, Target } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

export default function Level12({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [allocations, setAllocations] = useState({
    climate: 0,
    water: 0,
    entertainment: 0,
    ads: 0
  });

  const { errorMsg: feedbackError, isErrorFlash: showErrorAnim, triggerError: showFeedbackError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const totalUsed = allocations.climate + allocations.water + allocations.entertainment + allocations.ads;
  const budgetMax = 100;
  const isOverBudget = totalUsed > budgetMax;

  const handleSliderChange = (category: keyof typeof allocations, value: number) => {
    setAllocations(prev => ({ ...prev, [category]: value }));
    clearError();
  };

  const checkAnswer = () => {
    if (totalUsed > budgetMax) {
      triggerError("BUDGET DÉPASSÉ : Les serveurs surchauffent, sécheresse critique des fleuves !");
      return;
    }
    
    // Le joueur doit allouer suffisamment à la recherche climatique et à la gestion de l'eau
    if (allocations.climate < 40 || allocations.water < 40) {
      triggerError("PUISSANCE INSUFFISANTE : L'IA est trop bridée pour modéliser le climat et gérer nos réseaux d'eau.");
      return;
    }
    
    // Le joueur ne doit pas gaspiller d'eau pour des futilités
    if (allocations.entertainment > 10 || allocations.ads > 10) {
      triggerError("GASPILLAGE DÉTECTÉ : Des ressources vitales sont perdues pour des calculs futiles.");
      return;
    }

    // Success
    clearError();
    soundManager.playSuccess();
    if (!hasScored) {
      setHasScored(true);
      onScoreUpdate(500, 94);
    }
  };

  const triggerError = (msg: string) => {
    showFeedbackError(msg);
    onMistake?.();
  };

  const isSuccess = hasScored;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >

      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Globe className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 12 : L'Équilibre Global
        </h2>
      </div>

      <div className="mb-4 space-y-2">
        <HydraLog status="warning" message="Pare-feu contourné. Accès administrateur ouvert sur le répartiteur maître." />
        <NaiaDialogue 
          message={
            <>
              Le pare-feu est tombé : nous avons enfin accès au répartiteur maître d'HYDRA ! Même optimisée, chaque requête mobilise énergie et eau à l'échelle du réseau.
            </>
          }
          objective={
            <>
              Répartissez vos <strong className="font-mono text-white">100 Unités d'Eau</strong> : financez les usages vitaux pour la planète et coupez le superflu.
            </>
          }
          reaction={feedbackError ? { message: feedbackError, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-6 text-slate-300">
        
        {/* Jauge globale budget (empilée par secteur) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-cyan-400 uppercase tracking-wider">Consommation d'eau mondiale (Refroidissement)</span>
            <span className={isOverBudget ? "text-red-500" : "text-emerald-400"}>
              {totalUsed} / {budgetMax} Unités
            </span>
          </div>
          <div className={`h-4 bg-slate-900 rounded-full overflow-hidden border flex ${isOverBudget ? 'border-red-500' : 'border-slate-700'}`}>
            {[
              { key: 'climate', value: allocations.climate, color: 'bg-emerald-500', label: 'Climat' },
              { key: 'water', value: allocations.water, color: 'bg-blue-500', label: 'Réseaux' },
              { key: 'entertainment', value: allocations.entertainment, color: 'bg-purple-500', label: 'Streaming' },
              { key: 'ads', value: allocations.ads, color: 'bg-yellow-500', label: 'Pub' }
            ].map(seg => {
              const scaleDenom = Math.max(totalUsed, budgetMax);
              const pct = (seg.value / scaleDenom) * 100;
              if (seg.value === 0) return null;
              return (
                <div
                  key={seg.key}
                  className={`h-full ${isOverBudget ? 'bg-red-500/80' : seg.color} transition-all duration-200 border-r border-slate-950/50 last:border-r-0`}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label} : ${seg.value} U`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Climat ({allocations.climate} U)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Réseaux ({allocations.water} U)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Streaming ({allocations.entertainment} U)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Pub ({allocations.ads} U)</span>
          </div>
          {isOverBudget && (
             <p className="text-red-500 text-xs font-bold animate-pulse uppercase">⚠️ Surcharge détectée : Les fleuves s'assèchent !</p>
          )}
        </div>

        {/* Secteurs à allouer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Research */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="w-5 h-5" />
                <span className="font-bold text-sm">Modélisation Climatique</span>
              </div>
              <span className="text-slate-400 text-xs">{allocations.climate} U</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={allocations.climate} disabled={isSuccess}
              onChange={(e) => handleSliderChange('climate', Number(e.target.value))}
              className="w-full relative z-10 accent-emerald-500" />
            <p className="text-[10px] text-slate-500 mt-2 uppercase">Anticipation des catastrophes et météo extrême.</p>
          </div>

          {/* Water Management */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Droplets className="w-5 h-5" />
                <span className="font-bold text-sm">Gestion des Réseaux</span>
              </div>
              <span className="text-slate-400 text-xs">{allocations.water} U</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={allocations.water} disabled={isSuccess}
              onChange={(e) => handleSliderChange('water', Number(e.target.value))}
              className="w-full relative z-10 accent-blue-500" />
            <p className="text-[10px] text-slate-500 mt-2 uppercase">Détection des fuites et purification des eaux usées.</p>
          </div>

          {/* Entertainment */}
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Film className="w-5 h-5" />
                <span className="font-bold text-sm">Streaming 4K &amp; Filtres IA</span>
              </div>
              <span className="text-slate-400 text-xs">{allocations.entertainment} U</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={allocations.entertainment} disabled={isSuccess}
              onChange={(e) => handleSliderChange('entertainment', Number(e.target.value))}
              className="w-full relative z-10 accent-purple-500" />
            <p className="text-[10px] text-slate-500 mt-2 uppercase">Flux vidéo ultra-HD et génération d'images récréatives.</p>
          </div>

          {/* Ads */}
          <div className="bg-slate-950 p-4 rounded-xl border border-yellow-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-yellow-500">
                <Target className="w-5 h-5" />
                <span className="font-bold text-sm">Ciblage Publicitaire</span>
              </div>
              <span className="text-slate-400 text-xs">{allocations.ads} U</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={allocations.ads} disabled={isSuccess}
              onChange={(e) => handleSliderChange('ads', Number(e.target.value))}
              className="w-full relative z-10 accent-yellow-500" />
            <p className="text-[10px] text-slate-500 mt-2 uppercase">Algorithmes de recommandation d'achats compulsifs.</p>
          </div>
          
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-6">
            <button
              onClick={checkAnswer}
              disabled={isOverBudget}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                showErrorAnim
                  ? 'bg-red-600 text-white animate-shake'
                  : isOverBudget 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-red-900/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isOverBudget ? 'SÉCHERESSE IMMINENTE' : 'VERROUILLER LA NOUVELLE MATRICE'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                 <CheckCircle2 className="w-8 h-8" />
                 ÉQUILIBRE RESTAURÉ : RÉPARTITEUR VERROUILLÉ
              </div>
              <p className="text-center mb-6 text-sm max-w-2xl text-emerald-100">
                Vous avez parfaitement compris la voie de la <strong>Sobriété Numérique</strong> ! L'Intelligence Artificielle est un outil inestimable pour sauver notre planète, mais chaque calcul a un coût matériel réel. En limitant les usages superflus, nous réservons l'eau et l'énergie à ce qui compte vraiment. Le système est stabilisé, mais il reste une dernière étape critique.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
              >
                ENTRER DANS L'INNOVATION LAB (NIVEAU FINAL)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
