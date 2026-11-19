import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSITION_COLLAPSE_OPEN, TRANSITION_COLLAPSE_CLOSE, EASE_OUT_EXPO } from '../utils/motion';

interface CollapsibleProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  role?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

/**
 * Smooth, jump-free accordion/drawer wrapper.
 * Vertical margins, borders, and padding live on the inner element so
 * animating height 0 <-> auto never snaps at the start or end.
 */
export default function Collapsible({
  isOpen,
  children,
  className = '',
  innerClassName = '',
  onClick,
  role,
  'aria-live': ariaLive,
}: CollapsibleProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          role={role}
          aria-live={ariaLive}
          onClick={onClick}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1, transition: TRANSITION_COLLAPSE_OPEN }}
          exit={{ height: 0, opacity: 0, transition: TRANSITION_COLLAPSE_CLOSE }}
          className={`overflow-hidden ${className}`.trim()}
        >
          <motion.div
            initial={{ y: -4 }}
            animate={{ y: 0, transition: { duration: 0.24, ease: EASE_OUT_EXPO } }}
            exit={{ y: -3, transition: { duration: 0.14 } }}
            className={innerClassName}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
