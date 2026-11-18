import { motion } from 'motion/react';
import { Skull, RotateCcw, HeartCrack } from 'lucide-react';

export default function GameOver({ onRetry, nickname, reason = 'time' }: { onRetry: (name: string) => void; nickname: string; reason?: 'time' | 'lives'; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-red-500/40 sm:border p-4 sm:p-8 sm:rounded-2xl max-w-2xl mx-auto text-center backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex justify-center mb-6">
        {reason === 'lives' ? (
          <HeartCrack className="w-24 h-24 text-red-500" />
        ) : (
          <Skull className="w-24 h-24 text-red-500" />
        )}
      </div>

      <h1 className="font-mono text-3xl md:text-5xl font-bold text-red-500 mb-4 uppercase tracking-widest">
        ÉCHEC DE LA MISSION
      </h1>
      
      <p className="text-slate-300 text-lg mb-5 font-sans">
        {reason === 'lives' 
          ? `L'agent ${nickname} a commis trop d'erreurs. Le système de sécurité d'HYDRA vous a repéré et a verrouillé l'accès. La ville est à sec.`
          : `Le temps est écoulé, agent ${nickname}. HYDRA a épuisé toutes les réserves d'eau de la ville pour refroidir ses serveurs. La ville est à sec.`}
      </p>

      <button
        onClick={() => onRetry(nickname)}
        className="mt-5 flex items-center justify-center gap-2 mx-auto bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-xl transition-all hover:shadow-[0_0_18px_rgba(239,68,68,0.35)]"
      >
        <RotateCcw className="w-6 h-6" />
        RELANCER LA SIMULATION
      </button>
    </motion.div>
  );
}
