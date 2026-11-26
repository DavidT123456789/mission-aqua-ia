import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Clock,
  BookOpen,
  MessageSquare,
  Printer,
  X,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Collapsible from './Collapsible';
import {
  MODAL_BACKDROP_MOTION,
  MODAL_PANEL_MOTION,
  SPRING_SNAPPY,
  EASE_OUT_EXPO,
  EASE_IN_OUT,
} from '../utils/motion';
import {
  SESSION_PLANS,
  QUICK_ESSENTIALS,
  CLASSROOM_GUIDES,
  TECHNO_CURRICULUM_ROWS,
  INTERDISCIPLINARY_BRIDGES,
  DEBATE_PROMPTS,
  resolveLevelRef,
  buildPrintableHtml,
  type SessionFormatId,
  type LevelRefCode,
} from '../utils/teacherKitData';

interface TeacherKitModalProps {
  onClose: () => void;
}

type KitTab = 'deroule' | 'programmes' | 'debat';

/**
 * Interactive portal tooltip for level codes (e.g. N9, Bonus 1).
 * Renders on document.body so it never clips inside the modal's scroll container.
 */
function LevelRefTooltip({ code }: { code: LevelRefCode }) {
  const info = resolveLevelRef(code);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isOpen = isHovered || isPinned;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: 120, placeBelow: false });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 240;
    const half = tooltipWidth / 2;

    let targetLeft = rect.left + rect.width / 2;
    let arrowLeft = half;

    if (targetLeft + half > window.innerWidth - 16) {
      const diff = targetLeft + half - (window.innerWidth - 16);
      targetLeft -= diff;
      arrowLeft += diff;
    } else if (targetLeft - half < 16) {
      const diff = 16 - (targetLeft - half);
      targetLeft += diff;
      arrowLeft -= diff;
    }

    const placeBelow = rect.top < 110;
    setPos({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: targetLeft,
      arrowLeft: Math.max(16, Math.min(tooltipWidth - 16, arrowLeft)),
      placeBelow,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isPinned) return;
    const handleOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) {
        return;
      }
      setIsPinned(false);
      setIsHovered(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsPinned(false);
        setIsHovered(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [isPinned]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsPinned((prev) => {
            const next = !prev;
            if (!next) setIsHovered(false);
            return next;
          });
        }}
        aria-expanded={isOpen}
        aria-label={`${info.shortLabel} : ${info.title}`}
        className="font-mono text-[11px] font-semibold text-cyan-300/95 hover:text-cyan-200 underline decoration-dotted decoration-cyan-400/55 underline-offset-[3px] px-1 py-0.5 rounded hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 transition-colors cursor-help whitespace-nowrap"
      >
        {info.shortLabel}
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={tooltipRef}
                role="tooltip"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: pos.top,
                  left: pos.left,
                  zIndex: 1000,
                  pointerEvents: isPinned ? 'auto' : 'none',
                }}
                initial={{
                  opacity: 0,
                  x: '-50%',
                  y: pos.placeBelow ? -4 : 'calc(-100% + 4px)',
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  x: '-50%',
                  y: pos.placeBelow ? 0 : '-100%',
                  scale: 1,
                  transition: { duration: 0.15, ease: EASE_OUT_EXPO },
                }}
                exit={{
                  opacity: 0,
                  x: '-50%',
                  y: pos.placeBelow ? -3 : 'calc(-100% + 3px)',
                  scale: 0.97,
                  transition: { duration: 0.1, ease: EASE_IN_OUT },
                }}
                className="w-60 p-3 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl text-left"
              >
                <div className="text-[11px] font-mono text-cyan-300/90 leading-tight mb-0.5">
                  {info.context}
                </div>
                <div className="text-xs font-semibold text-white leading-snug">
                  {info.title}
                </div>

                {pos.placeBelow ? (
                  <>
                    <span
                      className="absolute bottom-full border-[6px] border-transparent border-b-slate-700 -translate-x-1/2"
                      style={{ left: `${pos.arrowLeft}px` }}
                    />
                    <span
                      className="absolute bottom-[calc(100%-1px)] border-[6px] border-transparent border-b-slate-900 -translate-x-1/2"
                      style={{ left: `${pos.arrowLeft}px` }}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="absolute top-full border-[6px] border-transparent border-t-slate-700 -translate-x-1/2"
                      style={{ left: `${pos.arrowLeft}px` }}
                    />
                    <span
                      className="absolute top-[calc(100%-1px)] border-[6px] border-transparent border-t-slate-900 -translate-x-1/2"
                      style={{ left: `${pos.arrowLeft}px` }}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export default function TeacherKitModal({ onClose }: TeacherKitModalProps) {
  const [activeTab, setActiveTab] = useState<KitTab>('deroule');
  const [sessionFormat, setSessionFormat] = useState<SessionFormatId>('two_sessions');
  const [openGuideId, setOpenGuideId] = useState<string | null>(null);
  const [openCurriculumIds, setOpenCurriculumIds] = useState<string[]>([]);
  const [isBridgesOpen, setIsBridgesOpen] = useState(false);
  const [openDebateIds, setOpenDebateIds] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: KitTab) => {
    setActiveTab(tab);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  };

  const currentPlan = SESSION_PLANS[sessionFormat];

  const toggleCurriculum = (id: string) => {
    setOpenCurriculumIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDebate = (id: string) => {
    setOpenDebateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      cleanup();
      return;
    }

    doc.open();
    doc.write(buildPrintableHtml());
    doc.close();

    const win = iframe.contentWindow;
    win.onafterprint = cleanup;
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        cleanup();
      }
    }, 120);
    // Filet de sécurité si onafterprint n'est pas déclenché par le navigateur
    setTimeout(cleanup, 60000);
  };

  return (
    <motion.div
      {...MODAL_BACKDROP_MOTION}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-kit-title"
      className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm"
    >
      <motion.div
        {...MODAL_PANEL_MOTION}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/25 rounded-2xl max-w-3xl w-full max-h-[86vh] flex flex-col overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/10 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/35 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h2
                id="teacher-kit-title"
                className="text-base sm:text-lg font-bold text-white leading-tight truncate"
              >
                Kit enseignant
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Préparer, animer et débriefer Mission Aqua IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-200 border border-indigo-500/35 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              title="Imprimer ou enregistrer en PDF (fiche A4 complète)"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le kit enseignant"
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex gap-1 sm:gap-1.5 px-4 sm:px-6 py-2.5 border-b border-white/10 bg-slate-950/45 shrink-0 overflow-x-auto"
          role="tablist"
          aria-label="Sections du kit enseignant"
        >
          {(
            [
              { id: 'deroule' as const, label: 'Déroulé 1 h / 2 h', mobileLabel: 'Déroulé', icon: Clock },
              { id: 'programmes' as const, label: 'Programmes & Pix', mobileLabel: 'Programmes', icon: BookOpen },
              { id: 'debat' as const, label: 'Débat oral', mobileLabel: 'Débat', icon: MessageSquare },
            ]
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`kit-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`kit-panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="teacherKitActiveTab"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div ref={bodyRef} className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
            {/* TAB 1: DÉROULÉ */}
            {activeTab === 'deroule' && (
              <motion.div
                key="tab-deroule"
                id="kit-panel-deroule"
                role="tabpanel"
                aria-labelledby="kit-tab-deroule"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                className="space-y-3.5"
              >
                {/* Format switcher + Selected timeline */}
                <section className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className="inline-flex items-center p-1 rounded-lg bg-slate-950/75 border border-white/10"
                      role="group"
                      aria-label="Choisir la durée de séance"
                    >
                      {(['two_sessions', 'one_session'] as const).map((formatId) => {
                        const plan = SESSION_PLANS[formatId];
                        const isSelected = sessionFormat === formatId;
                        return (
                          <button
                            key={formatId}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSessionFormat(formatId)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                              isSelected
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {plan.tabLabel}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs text-slate-400">
                      {currentPlan.subtitle}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950/55 border border-white/10 overflow-hidden">
                    <div className="divide-y divide-white/[0.06]">
                      {currentPlan.steps.map((step) => (
                        <div
                          key={step.duration}
                          className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"
                        >
                          <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums sm:w-32 shrink-0">
                            {step.duration}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-sm font-semibold text-white">
                              {step.label}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-slate-950/70 border-t border-white/[0.06] text-xs text-slate-400">
                      {currentPlan.footnote}
                    </div>
                  </div>
                </section>

                {/* 4 Scannable Classroom Essentials */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    L’essentiel en classe
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-2 border-t border-white/[0.08]">
                    {QUICK_ESSENTIALS.map((item) => (
                      <div key={item.id} className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Progressive Disclosure Accordions */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Pour aller plus loin
                  </h3>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 divide-y divide-white/[0.06]">
                    {CLASSROOM_GUIDES.map((guide) => {
                      const isOpen = openGuideId === guide.id;
                      return (
                        <div key={guide.id}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setOpenGuideId((prev) => (prev === guide.id ? null : guide.id))
                            }
                            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                          >
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-slate-100">
                                {guide.title}
                              </div>
                              <div className="text-xs text-slate-400">
                                {guide.summary}
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-indigo-300' : ''
                              }`}
                            />
                          </button>

                          <Collapsible
                            isOpen={isOpen}
                            innerClassName="px-4 pb-3 pt-0.5"
                          >
                            <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-2.5">
                              {guide.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-start gap-2">
                                  <span
                                    className="text-cyan-400/80 select-none mt-px"
                                    aria-hidden="true"
                                  >
                                    ·
                                  </span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </Collapsible>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB 2: TECHNOLOGIE & PIX */}
            {activeTab === 'programmes' && (
              <motion.div
                key="tab-programmes"
                id="kit-panel-programmes"
                role="tabpanel"
                aria-labelledby="kit-tab-programmes"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                className="space-y-3.5"
              >
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ancrage <strong className="text-white">Technologie (Cycle 4)</strong> et{' '}
                  <strong className="text-white">Pix</strong> · Survolez un niveau (ex.{' '}
                  <span className="font-mono text-cyan-300">N7</span>) pour voir son titre, ou dépliez un thème.
                </p>

                {/* Core Technologie Cycle 4 + Pix */}
                <div className="rounded-xl border border-white/10 bg-slate-950/45 divide-y divide-white/[0.06]">
                  {TECHNO_CURRICULUM_ROWS.map((row) => {
                    const isOpen = openCurriculumIds.includes(row.id);
                    return (
                      <div key={row.id}>
                        <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => toggleCurriculum(row.id)}
                            className="flex-1 flex items-start gap-2.5 text-left min-w-0 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md"
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0 mt-0.5 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-indigo-300' : ''
                              }`}
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-sm font-semibold text-white leading-snug">
                                {row.title}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {row.summary}
                              </p>
                            </div>
                          </button>

                          <div
                            className="flex flex-wrap items-center gap-1 pl-6 sm:pl-0 shrink-0"
                            aria-label={`Niveaux associés pour ${row.title}`}
                          >
                            {row.levelRefs.map((ref, idx) => (
                              <React.Fragment key={ref}>
                                {idx > 0 && (
                                  <span className="text-slate-600 text-[10px] select-none" aria-hidden="true">
                                    ·
                                  </span>
                                )}
                                <LevelRefTooltip code={ref} />
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <Collapsible
                          isOpen={isOpen}
                          innerClassName="px-4 pb-3.5 pl-10"
                        >
                          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-2.5">
                            {row.details.map((detail) => (
                              <li key={detail} className="flex items-start gap-2">
                                <span className="text-emerald-400/80 select-none" aria-hidden="true">
                                  ·
                                </span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Interdisciplinary Bridges (collapsed by default) */}
                <div className="rounded-xl border border-white/10 bg-slate-950/35 overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={isBridgesOpen}
                    onClick={() => setIsBridgesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-200">
                        Passerelles interdisciplinaires &amp; EPI
                      </div>
                      <div className="text-xs text-slate-400">
                        Pistes facultatives : co-animation en Maths, SVT, EMI/EMC ou réemploi en Seconde SNT.
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isBridgesOpen ? 'rotate-180 text-indigo-300' : ''
                      }`}
                    />
                  </button>

                  <Collapsible isOpen={isBridgesOpen} innerClassName="px-4 pb-3 pt-0.5">
                    <div className="border-t border-white/[0.06] divide-y divide-white/[0.05]">
                      {INTERDISCIPLINARY_BRIDGES.map((bridge) => (
                        <div
                          key={bridge.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-slate-100">
                                {bridge.discipline}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {bridge.cycle}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {bridge.summary}
                            </p>
                          </div>
                          <div
                            className="flex flex-wrap items-center gap-1 shrink-0"
                            aria-label={`Niveaux liés pour ${bridge.discipline}`}
                          >
                            {bridge.levelRefs.map((ref, idx) => (
                              <React.Fragment key={ref}>
                                {idx > 0 && (
                                  <span className="text-slate-600 text-[10px] select-none" aria-hidden="true">
                                    ·
                                  </span>
                                )}
                                <LevelRefTooltip code={ref} />
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Collapsible>
                </div>
              </motion.div>
            )}

            {/* TAB 3: DÉBAT ORAL */}
            {activeTab === 'debat' && (
              <motion.div
                key="tab-debat"
                id="kit-panel-debat"
                role="tabpanel"
                aria-labelledby="kit-tab-debat"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                className="space-y-3"
              >
                <p className="text-xs text-slate-300 leading-relaxed">
                  4 amorces prêtes à poser en fin de séance (<strong className="text-white">2 en format 1 h</strong>, les 4 en séance 2).
                </p>

                <div className="space-y-2.5">
                  {DEBATE_PROMPTS.map((item, idx) => {
                    const isOpen = openDebateIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl bg-slate-950/50 border border-white/10 overflow-hidden"
                      >
                        <div className="px-4 pt-3.5 pb-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                              <span className="font-mono text-[11px] font-semibold text-indigo-300">
                                0{idx + 1}.
                              </span>
                              <span className="font-semibold text-slate-200">{item.tag}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  item.timing === 'Format 2 h'
                                    ? 'text-slate-400'
                                    : 'text-emerald-300/90'
                                }
                              >
                                {item.timing}
                              </span>
                            </div>

                            <div
                              className="flex items-center gap-1"
                              aria-label={`Niveaux liés : ${item.tag}`}
                            >
                              {item.levelRefs.map((ref, refIdx) => (
                                <React.Fragment key={ref}>
                                  {refIdx > 0 && (
                                    <span className="text-slate-600 text-[10px] select-none" aria-hidden="true">
                                      ·
                                    </span>
                                  )}
                                  <LevelRefTooltip code={ref} />
                                </React.Fragment>
                              ))}
                            </div>
                          </div>

                          <p className="text-sm sm:text-[15px] font-semibold text-white leading-snug">
                            {item.question}
                          </p>

                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => toggleDebate(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer pt-0.5 focus-visible:outline-none focus-visible:underline"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                            <span>{isOpen ? 'Masquer les repères' : 'Voir les repères enseignant'}</span>
                          </button>
                        </div>

                        <Collapsible
                          isOpen={isOpen}
                          innerClassName="px-4 pb-3.5"
                        >
                          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-2.5">
                            {item.keyPoints.map((kp) => (
                              <li key={kp} className="flex items-start gap-2">
                                <span className="text-emerald-400/80 select-none" aria-hidden="true">
                                  ·
                                </span>
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-white/10 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Sans corrigés : les réponses restent protégées dans le Mode Enseignant.</span>
            <span className="sm:hidden truncate">Sans corrigés · Mode Enseignant</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
