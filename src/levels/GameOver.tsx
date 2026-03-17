import { motion } from 'motion/react';
import { Skull, RotateCcw, HeartCrack } from 'lucide-react';

export default function GameOver({ onRetry, nickname, reason = 'time' }: { onRetry: (name: string) => void; nickname: string; reason?: 'time' | 'lives'; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-red-500/50 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-2xl mx-auto text-center font-mono"
    >
      <div className="flex justify-center mb-6">
        {reason === 'lives' ? (
          <HeartCrack className="w-24 h-24 text-red-500 animate-pulse" />
        ) : (
          <Skull className="w-24 h-24 text-red-500 animate-pulse" />
        )}
      </div>

      <h1 className="text-3xl md:text-5xl font-bold text-red-500 mb-4 uppercase tracking-widest">
        ÉCHEC DE LA MISSION
      </h1>
      
      <p className="text-slate-300 text-lg mb-5 font-sans">
        {reason === 'lives' 
          ? `L'agent ${nickname} a commis trop d'erreurs. Le système de sécurité d'HYDRA vous a repéré et a verrouillé l'accès. La ville est à sec.`
          : `Le temps est écoulé, agent ${nickname}. HYDRA a épuisé toutes les réserves d'eau de la ville pour refroidir ses serveurs. La ville est à sec.`}
      </p>

      <button
        onClick={() => onRetry(nickname)}
        className="mt-5 flex items-center justify-center gap-2 mx-auto bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
      >
        <RotateCcw className="w-6 h-6" />
        RELANCER LA SIMULATION
      </button>
    </motion.div>
  );
}
