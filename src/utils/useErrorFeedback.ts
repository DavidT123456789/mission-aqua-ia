import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Gère le feedback d'erreur d'un niveau en dissociant :
 * - `errorMsg` : message pédagogique persistant dans la bulle de NAÏA jusqu'à la prochaine action ou fermeture manuelle
 * - `isErrorFlash` : bref état visuel (secousse / rouge) réinitialisé automatiquement après `flashDurationMs`
 */
export function useErrorFeedback(flashDurationMs = 800) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isErrorFlash, setIsErrorFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isFlashingRef = useRef(false);

  const clearFlashTimers = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearFlashTimers();
  }, [clearFlashTimers]);

  const startFlash = useCallback(() => {
    isFlashingRef.current = true;
    setIsErrorFlash(true);
    flashTimerRef.current = setTimeout(() => {
      isFlashingRef.current = false;
      setIsErrorFlash(false);
      flashTimerRef.current = null;
    }, flashDurationMs);
  }, [flashDurationMs]);

  const triggerError = useCallback((message: string) => {
    setErrorMsg(message);
    clearFlashTimers();

    if (isFlashingRef.current) {
      // Retire brièvement la classe d'animation pour rejouer `animate-shake` sur clics rapides
      isFlashingRef.current = false;
      setIsErrorFlash(false);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        startFlash();
      });
    } else {
      startFlash();
    }
  }, [clearFlashTimers, startFlash]);

  const clearError = useCallback(() => {
    clearFlashTimers();
    isFlashingRef.current = false;
    setIsErrorFlash(false);
    setErrorMsg(null);
  }, [clearFlashTimers]);

  return { errorMsg, isErrorFlash, triggerError, clearError };
}
