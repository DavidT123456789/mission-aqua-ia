import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb } from 'lucide-react';

interface HintProps {
  hintText: string;
  delaySeconds: number;
}

export default function Hint({ hintText, delaySeconds }: HintProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAvailable(true);
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds]);

  if (!isAvailable) return null;

  return (
    <div className="mt-6 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.button
            key="hint-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsRevealed(true)}
            className="flex items-center gap-2 px-4 py-2 rounded border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors text-sm"
          >
            <Lightbulb className="w-4 h-4 animate-pulse" />
            Indice disponible
          </motion.button>
        ) : (
          <motion.div
            key="hint-text"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded border border-yellow-500/30 bg-yellow-500/5 text-yellow-400/90 text-sm text-center w-full"
          >
            <Lightbulb className="w-4 h-4 inline-block mr-2 mb-1" />
            {hintText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
