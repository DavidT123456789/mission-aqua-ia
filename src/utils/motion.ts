import type { Transition } from 'motion/react';

/**
 * Shared modern motion language for Mission Aqua IA.
 * Crisp exponential ease-out for entrances, quick settle for exits,
 * and tight non-bouncy springs for tactile UI controls (tabs, pills, drag slots).
 */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 36,
  mass: 0.75,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 30,
  mass: 0.85,
};

export const TRANSITION_FAST: Transition = {
  duration: 0.18,
  ease: EASE_OUT_EXPO,
};

export const TRANSITION_SMOOTH: Transition = {
  duration: 0.26,
  ease: EASE_OUT_EXPO,
};

export const TRANSITION_COLLAPSE_OPEN: Transition = {
  height: { duration: 0.28, ease: EASE_OUT_EXPO },
  opacity: { duration: 0.22, ease: 'easeOut' },
};

export const TRANSITION_COLLAPSE_CLOSE: Transition = {
  height: { duration: 0.2, ease: EASE_IN_OUT },
  opacity: { duration: 0.14, ease: 'easeIn' },
};

export const MODAL_BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' as const } },
};

export const MODAL_PANEL_MOTION = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.16, ease: EASE_IN_OUT },
  },
};

export const TAB_PANEL_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.14, ease: EASE_IN_OUT },
  },
};

export const STEP_PANEL_MOTION = {
  initial: { opacity: 0, x: 16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.26, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    x: -14,
    transition: { duration: 0.16, ease: EASE_IN_OUT },
  },
};
