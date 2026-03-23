import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, CheckCircle2, Scale } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level10({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedClauses, setSelectedClauses] = useState<number[]>([]);
  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const clauses = [
    { id: 1, text: <>Transparence obligatoire sur la consommation d'eau des modèles <TechTerm term="IA" />.</>, good: true },
    { id: 2, text: 'Priorité absolue à la vitesse de calcul, quel qu\'en soit le coût.', good: false },
    { id: 3, text: 'Obligation d\'utiliser l\'eau potable pour refroidir les serveurs.', good: false },
    { id: 4, text: <>Interdiction d'entraîner des <TechTerm term="LLM">LLMs</TechTerm> géants pour des tâches simples.</>, good: true },
    { id: 5, text: <>Réutilisation obligatoire de la chaleur fatale des <TechTerm term="Datacenter">data centers</TechTerm>.</>, good: true },
    { id: 6, text: 'Autorisation de construire des centres de données sans étude d\'impact environnemental.', good: false },
  ];

  const toggleClause = (id: number) => {
    setSelectedClauses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setShowError(false);
  };

  const checkAnswer = () => {
    const correctClauses = clauses.filter(c => c.good).map(c => c.id);
    const isCorrect = selectedClauses.length === correctClauses.length && 
                      selectedClauses.every(id => correctClauses.includes(id));
    
    if (isCorrect) {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 50);
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
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
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Select clauses 1, 4, 5
        </div>
      )}
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
              La technologie ne suffit pas. Pour pérenniser nos efforts, nous devons établir des règles. Rédigez la 'Charte de l'<TechTerm term="IA" /> Responsable' qui sera soumise au gouvernement mondial. Sélectionnez uniquement les clauses bénéfiques pour l'environnement.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <h3 className="text-center font-bold text-lg mb-6 uppercase tracking-widest text-slate-400">Projet de Loi - Article 1</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clauses.map((clause) => (
              <button
                key={clause.id}
                onClick={() => toggleClause(clause.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-4 ${
                  selectedClauses.includes(clause.id)
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
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
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {showError ? 'CLAUSES DANGEREUSES DÉTECTÉES' : 'SOUMETTRE LA LOI'}
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
                 LOI ADOPTÉE
              </div>
              <p className="text-center mb-6 text-sm">
                La loi a été votée. La régulation est une étape indispensable. L'innovation technologique doit être encadrée par des politiques publiques fortes pour garantir qu'elle bénéficie à l'humanité sans détruire son écosystème.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                DÉPLOYER L'ALGORITHME
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
