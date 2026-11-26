import { createContext, useContext } from 'react';

export interface NaiaHintContextValue {
  level: number;
  isHintOpen: boolean;
  setIsHintOpen: (open: boolean) => void;
}

export const NaiaHintContext = createContext<NaiaHintContextValue | null>(null);

export function useNaiaHints() {
  return useContext(NaiaHintContext);
}
