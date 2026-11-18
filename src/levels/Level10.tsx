import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, CheckCircle2, Scale } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

export default function Level10({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedClauses, setSelectedClauses] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const [shuffledClauses] = useState(() => [
    { id: 1, text: <>Transparence obligatoire sur la consommation d'eau des modèles <TechTerm term="IA" />.</>, good: true },
    { id: 2, text: <>Compenser le pompage local pour le <TechTerm term="Machine Learning">machine learning</TechTerm> en plantant des arbres dans un autre pays.</>, good: false },
    { id: 3, text: <>Refroidissement des <TechTerm term="Serveur">serveurs</TechTerm> autorisé avec l'eau potable du réseau public.</>, good: false },
    { id: 4, text: <>Interdiction d'entraîner des <TechTerm term="LLM">LLMs</TechTerm> géants pour des tâches simples.</>, good: true },
    { id: 5, text: <>Réutilisation obligatoire de la chaleur fatale des <TechTerm term="Datacenter">data centers</TechTerm>.</>, good: true },
    { id: 6, text: <>Exemption d'étude d'impact pour accélérer le déploiement des infrastructures <TechTerm term="Cloud">cloud</TechTerm>.</>, good: false },
    { id: 7, text: <>Évaluation du coût écologique avant chaque déploiement d'<TechTerm term="Algorithme">algorithme</TechTerm> majeur.</>, good: true },
    { id: 8, text: <>Remplacer les quotas d'eau de l'<TechTerm term="IA Générative">IA générative</TechTerm> par un label « Éco-IA » auto-déclaré sans contrôle.</>, good: false },
  ].sort(() => Math.random() - 0.5));

  const isSuccess = hasScored;
  const correctClauses = shuffledClauses.filter(c => c.good).map(c => c.id);

  const toggleClause = (id: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    setSelectedClauses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setErrorMsg(null);
  };

  const checkAnswer = () => {
    const hasBadClause = selectedClauses.some(id => !correctClauses.includes(id));
    const missingGoodClause = correctClauses.some(id => !selectedClauses.includes(id));
    const isCorrect = !hasBadClause && !missingGoodClause;
    
    if (isCorrect) {
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 82);
      }
    } else {
      const hasGreenwashing = selectedClauses.includes(2) || selectedClauses.includes(8);
      setErrorMsg(
        hasGreenwashing
          ? 'PIÈGE DE GREENWASHING DÉTECTÉ : cela ne protège pas nos nappes locales !'
          : hasBadClause
          ? 'CLAUSES DANGEREUSES DÉTECTÉES'
          : 'CHARTE INCOMPLÈTE'
      );
      onMistake?.();
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <FileText className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 10 : La Charte Éthique
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              La technique ne suffit pas : pour empêcher qu'une telle crise ne se reproduise, les autorités de la ville exigent une 'Charte de l'<TechTerm term="IA" /> Responsable' contraignante avant d'autoriser le redémarrage d'HYDRA. Sélectionnez uniquement les clauses bénéfiques pour l'environnement.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h3 className="font-bold text-lg uppercase tracking-widest text-slate-400">Charte Municipale - Article 1</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
              {selectedClauses.length} clause(s) sélectionnée(s)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledClauses.map((clause) => (
              <button
                key={clause.id}
                type="button"
                disabled={isSuccess}
                onClick={() => toggleClause(clause.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-4 ${
                  selectedClauses.includes(clause.id)
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                } ${isSuccess ? 'cursor-default opacity-85' : ''}`}
              >
                <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedClauses.includes(clause.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                }`}>
                  {selectedClauses.includes(clause.id) && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                </div>
                <span className="text-sm md:text-base">{clause.text}</span>
              </button>
            ))}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              disabled={selectedClauses.length === 0}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                selectedClauses.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : errorMsg
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {errorMsg || 'SOUMETTRE LA CHARTE'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                 <Scale className="w-6 h-6" />
                 CHARTE ADOPTÉE
              </div>
              <p className="text-center mb-6 text-sm">
                La charte est adoptée ! Vous avez su déjouer les faux-semblants du <strong>greenwashing</strong> (compensation à l'étranger, labels auto-déclarés) pour imposer des règles locales réelles et mesurables.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                DÉPLOYER LES NOUVEAUX MODULES
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
