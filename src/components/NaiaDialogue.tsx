import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'motion/react';

export default function NaiaDialogue({ message, emotion = 'neutral' }: { message: React.ReactNode; emotion?: 'neutral' | 'alert' | 'happy' }) {
  const getEmotionColor = () => {
    switch (emotion) {
      case 'alert': return 'text-red-400 border-red-500/30 bg-red-900/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'happy': return 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      default: return 'text-purple-400 border-purple-500/30 bg-purple-900/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
    }
  };

  const getIconColor = () => {
    switch (emotion) {
      case 'alert': return 'text-red-400 bg-red-500/20';
      case 'happy': return 'text-emerald-400 bg-emerald-500/20';
      default: return 'text-purple-400 bg-purple-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 items-start border rounded-xl p-4 mb-6 ${getEmotionColor()}`}
    >
      <div className={`p-2 rounded-full shrink-0 ${getIconColor()}`}>
        <Bot className="w-6 h-6 animate-pulse" />
      </div>
      <div className="text-slate-300 text-sm md:text-base leading-relaxed italic">
        <span className={`font-bold not-italic mr-2 tracking-wider ${emotion === 'alert' ? 'text-red-400' : emotion === 'happy' ? 'text-emerald-400' : 'text-purple-400'}`}>NAÏA {'>'}</span>
        {message}
      </div>
    </motion.div>
  );
}
