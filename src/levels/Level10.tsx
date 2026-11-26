import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Scale, Stamp, FileSignature } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import MissionWorkspace from '../components/MissionWorkspace';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

const shuffleFisherYates = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function Level10({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedClauses, setSelectedClauses] = useState<number[]>([]);
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const [shuffledClauses] = useState(() =>
    shuffleFisherYates([
      { id: 1, text: <>Transparence obligatoire sur la consommation d'eau des modèles <TechTerm term="IA" />.</>, good: true },
      { id: 2, text: <>Compenser le pompage local pour le <TechTerm term="Machine Learning">machine learning</TechTerm> en plantant des arbres dans un autre pays.</>, good: false },
      { id: 3, text: <>Autoriser un appoint ponctuel sur le réseau d'eau potable lors des pics de calcul des <TechTerm term="Serveur">serveurs</TechTerm>, sur simple déclaration.</>, good: false },
      { id: 4, text: <>Interdiction d'entraîner des <TechTerm term="LLM">LLM</TechTerm> géants pour des tâches simples.</>, good: true },
      { id: 5, text: <>Réutilisation obligatoire de la chaleur fatale des <TechTerm term="Datacenter">datacenters</TechTerm>.</>, good: true },
      { id: 6, text: <>Remplacer l'étude d'impact préalable des infrastructures <TechTerm term="Cloud">cloud</TechTerm> par un bilan publié 3 ans après l'ouverture.</>, good: false },
      { id: 7, text: <>Évaluation du coût écologique avant chaque déploiement d'<TechTerm term="Algorithme">algorithme</TechTerm> majeur.</>, good: true },
      { id: 8, text: <>Remplacer les quotas d'eau de l'<TechTerm term="IA Générative">IA générative</TechTerm> par un label « Éco-IA » auto-déclaré sans contrôle.</>, good: false },
    ])
  );

  const isSuccess = hasScored;
  const correctClauses = shuffledClauses.filter(c => c.good).map(c => c.id);

  const toggleClause = (id: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    setSelectedClauses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    clearError();
  };

  const checkAnswer = () => {
    const badCount = selectedClauses.filter(id => !correctClauses.includes(id)).length;
    const missingCount = correctClauses.filter(id => !selectedClauses.includes(id)).length;
    const isCorrect = badCount === 0 && missingCount === 0;
    
    if (isCorrect) {
      clearError();
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 82);
      }
    } else {
      const hasGreenwashing = selectedClauses.includes(2) || selectedClauses.includes(8);
      const details: string[] = [];
      if (badCount > 0) details.push(`${badCount} clause${badCount > 1 ? 's' : ''} piège cochée${badCount > 1 ? 's' : ''}`);
      if (missingCount > 0) details.push(`${missingCount} clause${missingCount > 1 ? 's' : ''} essentielle${missingCount > 1 ? 's' : ''} manquante${missingCount > 1 ? 's' : ''}`);
      const detailText = details.join(' et ');

      triggerError(
        hasGreenwashing
          ? `Piège de greenwashing détecté (${detailText}) : ces promesses ne protègent pas nos nappes locales !`
          : `Arrêté non conforme (${detailText}). Relisez attentivement chaque article !`
      );
      onMistake?.();
    }
  };

  return (
    <LevelShell>
      
      <LevelHeader level={10} icon={Scale} />

      <div className="mb-3.5 sm:mb-4">
        <NaiaDialogue
          message={
            <>
              La technique ne suffit pas : pour éviter qu'une telle crise se reproduise, la ville exige un arrêté municipal portant « Charte de l'<TechTerm term="IA" /> Responsable » avant de redémarrer HYDRA.
            </>
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <MissionWorkspace
        hydra={{
          status: 'warning',
          label: 'HYDRA · GOUVERNANCE',
          message: "Verrouillage éthique activé. En attente de signature de la Charte municipale pour autoriser le redémarrage.",
        }}
        objective="Cochez uniquement les articles réellement contraignants pour l'environnement, puis tamponnez l'arrêté municipal."
      >
      <div className="space-y-4 text-slate-300">
        {/* Arrêté municipal officiel */}
        <div className="relative bg-slate-950 rounded-xl border-2 border-slate-700/80 overflow-hidden shadow-xl">
          {/* Bandeau officiel supérieur */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 opacity-80" />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Municipalité · Arrêté N°{new Date().getFullYear()}-IA-01</span>
                </div>
                <h3 className="font-bold text-base sm:text-lg uppercase tracking-wider text-white">
                  Charte Municipale de l'IA Responsable
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sélectionnez les articles à inscrire définitivement dans le décret exécutoire.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold shrink-0">
                {selectedClauses.length} article{selectedClauses.length > 1 ? 's' : ''} retenu{selectedClauses.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shuffledClauses.map((clause, idx) => {
                const isSelected = selectedClauses.includes(clause.id);
                return (
                  <div
                    key={clause.id}
                    role="button"
                    tabIndex={isSuccess ? -1 : 0}
                    aria-pressed={isSelected}
                    aria-disabled={isSuccess}
                    onClick={() => !isSuccess && toggleClause(clause.id)}
                    onKeyDown={(e) => {
                      if (!isSuccess && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        toggleClause(clause.id);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${
                      isSelected
                        ? 'bg-emerald-900/25 border-emerald-500 text-emerald-100'
                        : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                    } ${isSuccess ? 'cursor-default opacity-85' : 'cursor-pointer active:scale-[0.985]'}`}
                  >
                    <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        Art. 1.{idx + 1}
                      </span>
                      <span className="text-sm leading-snug block">{clause.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied de décret : bloc signature & tampon animé */}
            <div className="mt-5 pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="text-slate-500">
                Visa technique : <span className="text-slate-300">Agent de liaison · Supervision NAÏA</span>
              </div>
              {isSuccess ? (
                <motion.div
                  initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
                  animate={{ scale: 1, opacity: 1, rotate: -6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded border-2 border-emerald-400 bg-emerald-950/70 text-emerald-300 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Stamp className="w-4 h-4" />
                  ARRÊTÉ RATIFIÉ
                </motion.div>
              ) : (
                <span className="text-slate-500 italic">En attente de tampon officiel…</span>
              )}
            </div>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <ActionButton
              onClick={checkAnswer}
              disabled={selectedClauses.length === 0}
              isError={isErrorFlash}
            >
              <Stamp className="w-4 h-4" />
              SIGNER ET TAMPONNER L'ARRÊTÉ
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              icon={Scale}
              title="CHARTE ADOPTÉE"
              description={
                <>
                  La charte est adoptée ! Vous avez su déjouer les faux-semblants du <strong>greenwashing</strong> (compensation à l'étranger, labels auto-déclarés) pour imposer des règles locales réelles et mesurables. Place maintenant à l'<strong>Acte III : le mode Symbiose</strong> pour mettre l'IA au service de la planète !
                </>
              }
              buttonLabel="PASSER EN MODE SYMBIOSE"
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
      </MissionWorkspace>
    </LevelShell>
  );
}
