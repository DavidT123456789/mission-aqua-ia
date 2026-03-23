import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, CheckCircle2, Cpu, Droplets } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level12({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [balance, setBalance] = useState(50); // 0 = Full Ecology, 100 = Full Tech
  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  // The perfect balance is around 30-40 (favoring ecology but keeping some tech)
  const isPerfectBalance = balance >= 30 && balance <= 45;

  const checkAnswer = () => {
    if (isPerfectBalance) {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(500, 100);
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
      className="sm:bg-slate-900 border-transparent sm:border-emerald-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-2xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Set slider between 30 and 45
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Globe className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 12 : L'Équilibre Global
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Agent, c'est l'heure du choix final. Vous avez le contrôle du curseur global d'HYDRA. Vous devez trouver le point d'équilibre parfait entre la puissance de calcul de l'<TechTerm term="IA" /> et la préservation de nos ressources en eau. Un extrême nous ramène à l'âge de pierre, l'autre détruit la planète.
            </>
          }
          emotion="alert"
        />
      </div>

      <div className="space-y-5 text-slate-300">
        
        <div className="relative pt-12 pb-8 px-4 bg-slate-950 rounded-xl border border-slate-800">
          <div className="flex justify-between mb-4 text-sm font-bold">
            <div className="flex flex-col items-center gap-2 text-blue-400 w-24 text-center">
              <Droplets className="w-8 h-8" />
              <span>Préservation Totale</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-purple-400 w-24 text-center">
              <Cpu className="w-8 h-8" />
              <span>Puissance Maximale</span>
            </div>
          </div>

          <input 
            type="range" 
            min="0" 
            max="100" 
            value={balance}
            onChange={(e) => { setBalance(Number(e.target.value)); setShowError(false); }}
            disabled={isSuccess}
            className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="mt-5 text-center h-16">
            {balance < 30 && (
              <p className="text-blue-400">L'<TechTerm term="IA" /> est trop bridée. Nous ne pouvons plus résoudre les problèmes complexes du climat.</p>
            )}
            {balance >= 30 && balance <= 45 && (
              <p className="text-emerald-400 font-bold">Équilibre optimal : L'<TechTerm term="IA" /> est utile, ciblée, et respectueuse des ressources.</p>
            )}
            {balance > 45 && balance < 80 && (
              <p className="text-yellow-500">Gaspillage modéré. L'<TechTerm term="IA" /> est utilisée pour des tâches futiles au détriment de l'eau.</p>
            )}
            {balance >= 80 && (
              <p className="text-red-500 font-bold">Danger critique. Sécheresse imminente due au refroidissement des <TechTerm term="Serveur">serveurs</TechTerm>.</p>
            )}
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
              {showError ? 'DÉSÉQUILIBRE DÉTECTÉ' : 'VERROUILLER LE SYSTÈME'}
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
                 <CheckCircle2 className="w-6 h-6" />
                 MISSION ACCOMPLIE
              </div>
              <p className="text-center mb-6 text-sm">
                Vous avez trouvé la voie du milieu. L'Intelligence Artificielle est un outil formidable, mais elle a un corps physique (les <TechTerm term="Serveur">serveurs</TechTerm>) qui consomme des ressources réelles (l'eau, l'énergie). L'utiliser avec parcimonie et intelligence est la clé de notre avenir.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                DÉVERROUILLER L'INNOVATION LAB (BONUS)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
