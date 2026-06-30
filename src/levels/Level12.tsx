import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, CheckCircle2, Cpu, Droplets, Activity, Film, Target } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level12({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [allocations, setAllocations] = useState({
    climate: 0,
    water: 0,
    entertainment: 0,
    ads: 0
  });

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showErrorAnim, setShowErrorAnim] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const totalUsed = allocations.climate + allocations.water + allocations.entertainment + allocations.ads;
  const budgetMax = 100;
  const isOverBudget = totalUsed > budgetMax;

  const handleSliderChange = (category: keyof typeof allocations, value: number) => {
    setAllocations(prev => ({ ...prev, [category]: value }));
    setFeedbackError(null);
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
    if (!hasScored) {
      setHasScored(true);
      onScoreUpdate(500, 100);
    }
  };

  const triggerError = (msg: string) => {
    setFeedbackError(msg);
    setShowErrorAnim(true);
    onMistake?.();
    setTimeout(() => setShowErrorAnim(false), 800);
  };

  const isSuccess = hasScored;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50 whitespace-pre">
          Dev Réponses : Total {'<='} 100
          Climat {'>='} 40, Eau {'>='} 40
          Divert. {'<='} 10, Pub {'<='} 10
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Globe className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 12 : L'Équilibre Global
        </h2>
      </div>

      <div className="mb-4">
        <NaiaDialogue 
          message={
            <>
              Agent, nous avons pris le contrôle du répartiteur d'HYDRA ! Vous devez redéfinir la puissance de calcul mondiale. N'oubliez pas : chaque requête nécessite de refroidir des <TechTerm term="Serveur">serveurs</TechTerm> et vide nos réserves. Vous avez <strong>100 Unités d'Eau</strong>. Financez la survie de la planète, supprimez l'artificiel.
            </>
          }
          emotion="alert"
        />
      </div>

      <div className="space-y-6 text-slate-300">
        
        {/* Jauge globale budget */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span className="text-cyan-400 uppercase tracking-wider">Consommation d'eau mondiale (Refroidissement)</span>
            <span className={isOverBudget ? "text-red-500" : "text-emerald-400"}>
              {totalUsed} / {budgetMax} Unités
            </span>
          </div>
          <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <motion.div 
              className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(totalUsed, 100)}%` }}
            />
          </div>
          {isOverBudget && (
             <p className="text-red-500 text-xs mt-2 font-bold animate-pulse uppercase">⚠️ Surcharge détectée : Les fleuves s'assèchent !</p>
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
                <span className="font-bold text-sm">Vidéos de Chats en 8K</span>
              </div>
              <span className="text-slate-400 text-xs">{allocations.entertainment} U</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={allocations.entertainment} disabled={isSuccess}
              onChange={(e) => handleSliderChange('entertainment', Number(e.target.value))}
              className="w-full relative z-10 accent-purple-500" />
            <p className="text-[10px] text-slate-500 mt-2 uppercase">Génération d'images et flux massifs de divertissement.</p>
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

        {/* Feedback message (only visible after validation) */}
        {!isSuccess && feedbackError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center p-3 bg-red-950/50 border border-red-500/50 text-red-400 font-bold rounded-lg text-sm"
          >
            {feedbackError}
          </motion.div>
        )}

        {!isSuccess && (
          <div className="flex justify-center mt-6">
            <button
              onClick={checkAnswer}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                showErrorAnim
                  ? 'bg-red-600 text-white animate-shake'
                  : isOverBudget 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-red-900/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
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
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                 <CheckCircle2 className="w-8 h-8" />
                 MISSION ACCOMPLIE : ÉQUILIBRE RESTAURÉ
              </div>
              <p className="text-center mb-6 text-sm max-w-2xl text-emerald-100">
                Vous avez parfaitement compris la voie de la <strong>Sobriété Numérique</strong> ! L'Intelligence Artificielle est un outil inestimable pour sauver notre planète, mais chaque calcul a un coût matériel réel. En limitant les usages superflus, nous réservons l'eau et l'énergie à ce qui compte vraiment. Le système est stabilisé, mais il reste une dernière étape critique.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
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
