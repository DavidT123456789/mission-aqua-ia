import { createContext, useContext } from 'react';

export interface NaiaHintContextValue {
  level: number;
  score: number;
  unlockedFreeHints: number[];
  unlockedPaidHints: number[];
  isHintOpen: boolean;
  setIsHintOpen: (open: boolean) => void;
  useHint: (type: 'free' | 'paid') => void;
}

export const NaiaHintContext = createContext<NaiaHintContextValue | null>(null);

export function useNaiaHints() {
  return useContext(NaiaHintContext);
}
