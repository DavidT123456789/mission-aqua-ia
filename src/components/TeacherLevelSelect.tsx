import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Film, Home, Flag } from 'lucide-react';
import { LEVEL_NAMES, MISSION_ACTS } from '../constants';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

interface SelectOption {
  value: string;
  label: string;
  group?: string;
  kind?: 'home' | 'interlude' | 'level' | 'outro';
  targetLevel?: number;
}

interface TeacherLevelSelectProps {
  level: number;
  onSelectLevel: (level: number) => void;
  onPreviewInterlude?: (targetLevel: 4 | 11) => void;
  onHoverLevel?: (targetLevel: number) => void;
}

export default function TeacherLevelSelect({
  level,
  onSelectLevel,
  onPreviewInterlude,
  onHoverLevel,
}: TeacherLevelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const options = useMemo<SelectOption[]>(() => {
    const items: SelectOption[] = [
      { value: '0', label: 'Accueil (Intro & Briefing)', kind: 'home', targetLevel: 0 },
    ];
    for (const act of MISSION_ACTS) {
      const group = `${act.label} · ${act.title}`;
      if ((act.id === 2 || act.id === 3) && onPreviewInterlude) {
        items.push({
          value: `interlude-${act.startLevel}`,
          label: `Interlude ${act.label}`,
          group,
          kind: 'interlude',
          targetLevel: act.startLevel,
        });
      }
      for (let lvl = act.startLevel; lvl <= act.endLevel; lvl++) {
        items.push({
          value: String(lvl),
          label: `${lvl}. ${LEVEL_NAMES[lvl] || `Niveau ${lvl}`}`,
          group,
          kind: 'level',
          targetLevel: lvl,
        });
      }
    }
    items.push({ value: '14', label: 'Fin (Bilan & Dossier)', kind: 'outro', targetLevel: 14 });
    return items;
  }, [onPreviewInterlude]);

  const currentOption = useMemo(
    () => options.find((o) => o.value === String(level)) ?? options[0],
    [options, level]
  );

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active item into view when opening
  useEffect(() => {
    if (!isOpen) return;
    const idx = options.findIndex((o) => o.value === String(level));
    setHighlightedIndex(idx);
    requestAnimationFrame(() => {
      const activeEl = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      activeEl?.scrollIntoView({ block: 'nearest' });
    });
  }, [isOpen, level, options]);

  const handleChoose = (opt: SelectOption) => {
    setIsOpen(false);
    if (opt.value.startsWith('interlude-') && onPreviewInterlude) {
      const target = parseInt(opt.value.replace('interlude-', ''), 10);
      if (target === 4 || target === 11) {
        onPreviewInterlude(target);
        return;
      }
    }
    onSelectLevel(parseInt(opt.value, 10));
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) => {
        const next = e.key === 'ArrowDown' ? prev + 1 : prev - 1;
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        e.preventDefault();
        handleChoose(options[highlightedIndex]);
      }
    }
  };

  // Group options for rendering with section headers
  let lastGroup: string | undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sélectionner un acte ou un niveau"
        title="Sauter vers un acte ou un niveau"
        className={`w-full flex items-center justify-between gap-1.5 bg-indigo-950/65 hover:bg-indigo-900/60 text-indigo-100 text-[11px] font-semibold px-2.5 h-8 rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? 'border-indigo-400 ring-1 ring-indigo-400/50 bg-indigo-900/60'
            : 'border-indigo-500/40'
        }`}
      >
        <span className="truncate text-left">{currentOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-indigo-300 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="listbox"
            aria-label="Liste des niveaux"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.2, ease: EASE_OUT_EXPO },
            }}
            exit={{
              opacity: 0,
              y: 4,
              scale: 0.97,
              transition: { duration: 0.13, ease: EASE_IN_OUT },
            }}
            className="absolute bottom-full right-0 mb-1.5 w-64 max-h-72 overflow-y-auto rounded-xl bg-slate-900/98 backdrop-blur-xl border border-indigo-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(99,102,241,0.18)] p-1.5 z-[80] origin-bottom-right"
          >
            {options.map((opt, idx) => {
              const showGroupHeader = opt.group && opt.group !== lastGroup;
              lastGroup = opt.group;
              const isSelected = opt.value === String(level);
              const isHighlighted = idx === highlightedIndex;

              return (
                <React.Fragment key={opt.value}>
                  {showGroupHeader && (
                    <div className="px-2 pt-2 pb-1 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300/85 border-t border-white/[0.06] first:border-t-0 mt-1 first:mt-0 select-none">
                      {opt.group}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={isSelected ? 'true' : undefined}
                    onMouseEnter={() => {
                      setHighlightedIndex(idx);
                      if (opt.targetLevel && opt.targetLevel >= 1 && opt.targetLevel <= 14) {
                        onHoverLevel?.(opt.targetLevel);
                      }
                    }}
                    onClick={() => handleChoose(opt)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/25 text-white font-bold border border-indigo-400/40'
                        : isHighlighted
                        ? 'bg-slate-800/90 text-white'
                        : opt.kind === 'interlude'
                        ? 'text-emerald-300 hover:bg-emerald-950/50 font-semibold'
                        : 'text-slate-200 hover:bg-slate-800/75'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {opt.kind === 'home' && <Home className="w-3 h-3 text-slate-400 shrink-0" />}
                      {opt.kind === 'interlude' && <Film className="w-3 h-3 text-emerald-400 shrink-0" />}
                      {opt.kind === 'outro' && <Flag className="w-3 h-3 text-yellow-400 shrink-0" />}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0" />}
                  </button>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
