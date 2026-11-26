import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, CheckCircle2, Lightbulb, Droplets, RotateCcw, Lock, Gauge, Loader2, MessageSquareText, ShieldCheck, AlertTriangle, ChevronRight, Wrench } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import MissionWorkspace from '../components/MissionWorkspace';
import ActionButton from '../components/ActionButton';
import Collapsible from '../components/Collapsible';
import { soundManager } from '../utils/soundManager';
import { LAB_REOPEN_PENALTY_POINTS, type Evaluation } from '../constants';
import { buildSoberBlueprintDataUri } from '../../shared/fallbackPrototype';
import { EASE_OUT_EXPO, STEP_PANEL_MOTION, TAB_PANEL_MOTION } from '../utils/motion';

const LAB_DRAFT_STORAGE_KEY = 'hydrosave_lab_draft';
const MIN_IDEA_LENGTH = 20;
const MAX_IDEA_LENGTH = 1500;
const DRAFT_WATER_ML = 2.5;
const IMAGE_WATER_ML = 12;

interface PromptQuizOption {
  id: string;
  label: string;
  waterCostLabel: string;
  isCorrect: boolean;
  feedback: string;
}

const PROMPT_CALIBRATION_STEPS: { title: string; prompt: string; options: PromptQuizOption[] }[] = [
  {
    title: 'Réflexe 1/2 : Savoir quand se passer d\'IA générative',
    prompt: 'Votre équipe a besoin d\'un chiffre officiel : « Quelle est la consommation moyenne d\'eau par habitant en France ? » Quelle méthode choisissez-vous ?',
    options: [
      {
        id: 'a',
        label: 'Demander à un grand LLM puis générer une infographie par IA',
        waterCostLabel: '~18 mL d\'eau',
        isCorrect: false,
        feedback: 'Gaspillage : générer une image et solliciter un grand modèle pour un simple chiffre multiplie la facture hydrique par 60 !'
      },
      {
        id: 'b',
        label: 'Poser une question floue à un chatbot sans préciser pays ni unité (3 relances)',
        waterCostLabel: '~9 mL d\'eau',
        isCorrect: false,
        feedback: 'Chaque relance oblige le modèle à relire tout l\'historique. Pour un fait déjà connu, ce n\'est pas nécessaire.'
      },
      {
        id: 'c',
        label: 'Moteur de recherche classique ou site public (Sans IA générative)',
        waterCostLabel: '~0,3 mL d\'eau',
        isCorrect: true,
        feedback: 'Exact ! Pour retrouver une information factuelle ou un site officiel, la recherche classique consomme 10 à 30 fois moins qu\'un LLM.'
      }
    ]
  },
  {
    title: 'Réflexe 2/2 : Rédiger un prompt structuré en 1 coup',
    prompt: 'Pour concevoir une synthèse ou un prototype sans multiplier les essais, quel usage de l\'IA générative est le plus sobre ?',
    options: [
      {
        id: 'a',
        label: 'Conversation en 5 relances floues (« écris », « plus court », « ajoute des chiffres », « fais une image »)',
        waterCostLabel: '~28 mL d\'eau',
        isCorrect: false,
        feedback: '5 relances + une image superflue ! À chaque tour, l\'IA recalcule toute la conversation et gaspille eau et électricité.'
      },
      {
        id: 'b',
        label: '1 prompt structuré (Problème + Contexte + Données techniques + Format attendu)',
        waterCostLabel: '~2,5 mL d\'eau',
        isCorrect: true,
        feedback: 'Bravo ! Un prompt complet et cadré dès le premier envoi (one-shot) supprime les relances inutiles et divise l\'empreinte par 10.'
      },
      {
        id: 'c',
        label: 'Copier-coller 60 pages de logs bruts et demander « résume + illustre en 4K »',
        waterCostLabel: '~22 mL d\'eau',
        isCorrect: false,
        feedback: 'Envoyer un contexte massif et demander une image décorative alourdit inutilement les calculs sur les serveurs.'
      }
    ]
  }
];

export default function Level13({ onComplete, onScoreUpdate, nickname, onFinalize, isDevMode }: { 
  onComplete: () => void; 
  onScoreUpdate: (points: number, water: number) => void; 
  nickname: string; 
  onFinalize?: (evaluation: Evaluation | null, imageUrl: string | null, labWaterMl?: number | null) => void; 
  isDevMode?: boolean;
  key?: string 
}) {
  const [idea, setIdea] = useState(() => {
    try {
      return localStorage.getItem(LAB_DRAFT_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<'calibration' | 'input' | 'draft' | 'final'>('calibration');
  const [calibStep, setCalibStep] = useState(0);
  const [selectedCalibOpt, setSelectedCalibOpt] = useState<string | null>(null);
  const [revealedCalibOpts, setRevealedCalibOpts] = useState<string[]>([]);
  const [calibValidated, setCalibValidated] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [patentNumber, setPatentNumber] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [awardedLabPoints, setAwardedLabPoints] = useState(0);
  const [labDraftCount, setLabDraftCount] = useState(0);
  const [labImageCount, setLabImageCount] = useState(0);
  const [visualMode, setVisualMode] = useState<'ai_3d' | 'sober_svg'>('ai_3d');
  const [usedSoberVisual, setUsedSoberVisual] = useState(false);
  const evalRequestIdRef = useRef(0);
  const evalAbortRef = useRef<AbortController | null>(null);
  const genRequestIdRef = useRef(0);
  const genAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      if (idea) {
        localStorage.setItem(LAB_DRAFT_STORAGE_KEY, idea);
      } else {
        localStorage.removeItem(LAB_DRAFT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [idea]);

  useEffect(() => {
    return () => {
      evalRequestIdRef.current += 1;
      evalAbortRef.current?.abort();
      genRequestIdRef.current += 1;
      genAbortRef.current?.abort();
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score < 50) return { text: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10', label: 'BRONZE' };
    if (score < 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', label: 'ARGENT' };
    return { text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', label: 'LÉGENDAIRE' };
  };

  const scoreStyle = evaluation ? getScoreColor(evaluation.score) : null;
  const trimmedIdeaLen = idea.trim().length;
  const isIdeaValid = trimmedIdeaLen >= MIN_IDEA_LENGTH && trimmedIdeaLen <= MAX_IDEA_LENGTH;
  const labWaterMl = Math.round((labDraftCount * DRAFT_WATER_ML + labImageCount * IMAGE_WATER_ML) * 10) / 10;
  const formatWaterMl = (ml: number) => `${ml.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mL`;

  const handleDevAutoFill = () => {
    setIdea("Un système de refroidissement utilisant des capteurs d'humidité et des circuits fermés d'eau recyclée avec récupération de chaleur fatale pour chauffer les serres agricoles de la ville.");
  };

  const analyzeDraft = async () => {
    if (isAnalyzing) return;
    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < MIN_IDEA_LENGTH || trimmedIdea.length > MAX_IDEA_LENGTH) return;

    soundManager.playClick();
    setLabDraftCount((c) => c + 1);
    setIsAnalyzing(true);
    setLoadingStep('Analyse préliminaire de votre concept');
    setGeneratedImageUrl(null);

    const reqId = ++evalRequestIdRef.current;
    evalAbortRef.current?.abort();
    const controller = new AbortController();
    evalAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const resp = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: trimmedIdea }),
        signal: controller.signal
      });

      if (reqId !== evalRequestIdRef.current) return;

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de connexion avec l'IA");
      }

      const data = await resp.json() as Evaluation;
      if (reqId !== evalRequestIdRef.current) return;
      setEvaluation(data);
      setStatus('draft');
    } catch (err) {
      if (reqId !== evalRequestIdRef.current) return;
      console.error("Evaluation error:", err);
      // Fallback de secours en cas de dépassement de quota (429), timeout ou erreur réseau
      // Permet à l'élève de finir la mission même si l'API est temporairement bloquée.
      setEvaluation({
        title: "Concept Expérimental (Mode Secours)",
        description: trimmedIdea,
        impact: "7",
        feasibility: "7",
        precision: "6",
        originality: "6",
        score: 50,
        waterSaved: "25 000",
        feedback: "Système de secours activé suite à une surcharge temporaire du réseau HYDRA. Votre concept reste techniquement viable et permet exceptionnellement de débloquer le prototype."
      });
      setStatus('draft');
    } finally {
      clearTimeout(timeoutId);
      if (reqId === evalRequestIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const finalizeProject = async () => {
    if (!evaluation || status !== 'draft') return;

    soundManager.playSuccess();
    const generatedPatent = `FR-${Math.floor(100000 + Math.random() * 900000)}`;
    setPatentNumber(generatedPatent);

    const earnedPoints = evaluation.score * 5;
    setAwardedLabPoints(earnedPoints);
    onScoreUpdate(earnedPoints, 86);

    const willGenerateAiImage = evaluation.score >= 50 && visualMode === 'ai_3d';
    const nextImageCount = willGenerateAiImage ? labImageCount + 1 : labImageCount;
    const finalWaterMl = Math.round((labDraftCount * DRAFT_WATER_ML + nextImageCount * IMAGE_WATER_ML) * 10) / 10;

    if (willGenerateAiImage) {
      setLabImageCount(nextImageCount);
    }
    const isSoberChoice = evaluation.score >= 50 && visualMode === 'sober_svg';
    setUsedSoberVisual(isSoberChoice);

    const personalizedBlueprintUri = buildSoberBlueprintDataUri({
      title: evaluation.title,
      description: evaluation.description,
      waterSaved: evaluation.waterSaved,
      score: evaluation.score,
      patentNumber: generatedPatent,
      inventor: nickname || 'Agent Anonyme',
      isSoberChoice,
    });

    if (isSoberChoice) {
      setGeneratedImageUrl(personalizedBlueprintUri);
      setIsGeneratingImage(false);
      if (onFinalize) onFinalize(evaluation, personalizedBlueprintUri, finalWaterMl);
      setStatus('final');
      return;
    }

    // Transmettre immédiatement l'évaluation au parent pour éviter qu'un clic rapide sur "TERMINER LA MISSION" ne perde le brevet
    if (onFinalize) onFinalize(evaluation, null, finalWaterMl);

    setStatus('final');

    if (evaluation.score >= 50) {
      const reqId = ++genRequestIdRef.current;
      genAbortRef.current?.abort();
      const controller = new AbortController();
      genAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      setIsGeneratingImage(true);
      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: evaluation.title,
            description: evaluation.description
          }),
          signal: controller.signal
        });

        if (reqId !== genRequestIdRef.current) return;

        if (resp.ok) {
          const data = await resp.json();
          if (reqId !== genRequestIdRef.current) return;
          const resolvedUrl = data.imageUrl || personalizedBlueprintUri;
          setGeneratedImageUrl(resolvedUrl);
          if (onFinalize) onFinalize(evaluation, resolvedUrl, finalWaterMl);
        } else {
          console.warn("Image generation failed (non-ok response), using personalized local blueprint.");
          setGeneratedImageUrl(personalizedBlueprintUri);
          if (onFinalize) onFinalize(evaluation, personalizedBlueprintUri, finalWaterMl);
        }
      } catch (genErr) {
        if (reqId !== genRequestIdRef.current) return;
        console.error("Fetch error during image generation, using personalized local blueprint:", genErr);
        setGeneratedImageUrl(personalizedBlueprintUri);
        if (onFinalize) onFinalize(evaluation, personalizedBlueprintUri, finalWaterMl);
      } finally {
        clearTimeout(timeoutId);
        if (reqId === genRequestIdRef.current) {
          setIsGeneratingImage(false);
        }
      }
    } else {
      setIsGeneratingImage(false);
    }
  };

  const currentCalib = PROMPT_CALIBRATION_STEPS[calibStep];
  const selectedCalibObj = currentCalib?.options.find(o => o.id === selectedCalibOpt) || null;

  const handleSelectCalib = (opt: PromptQuizOption) => {
    setSelectedCalibOpt(opt.id);
    setRevealedCalibOpts(prev => (prev.includes(opt.id) ? prev : [...prev, opt.id]));
    if (opt.isCorrect) {
      soundManager.playStep();
      setCalibValidated(true);
    } else {
      soundManager.playError();
      setCalibValidated(false);
    }
  };

  const handleNextCalib = () => {
    soundManager.playClick();
    if (calibStep + 1 < PROMPT_CALIBRATION_STEPS.length) {
      setCalibStep(calibStep + 1);
      setSelectedCalibOpt(null);
      setRevealedCalibOpts([]);
      setCalibValidated(false);
    } else {
      setStatus('input');
    }
  };

  return (
    <LevelShell>
      <LevelHeader
        level={13}
        icon={Sparkles}
        rightSlot={
          status !== 'calibration' ? (
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shrink-0 transition-colors ${
                labWaterMl >= 20
                  ? 'bg-amber-950/60 border-amber-500/45 text-amber-300'
                  : labWaterMl > 0
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-emerald-950/50 border-emerald-500/35 text-emerald-300'
              }`}
              title={`Compteur hydrique du Labo : ${labDraftCount} analyse(s) texte (× 2,5 mL) + ${labImageCount} image(s) IA (× 12 mL)`}
            >
              <Droplets className="w-3.5 h-3.5 shrink-0" />
              <span>Labo : {formatWaterMl(labWaterMl)}</span>
            </span>
          ) : undefined
        }
      />

      {/* Compact 3-Step Lab Progress Strip */}
      <div className="mb-4 grid grid-cols-3 gap-2 font-mono text-[11px]">
        {[
          { id: 1, label: '1. Réflexes', active: status === 'calibration', done: status !== 'calibration' },
          { id: 2, label: '2. Conception', active: status === 'input' || status === 'draft', done: status === 'final' },
          { id: 3, label: '3. Brevet', active: status === 'final', done: false },
        ].map((step) => (
          <div
            key={step.id}
            className={`px-2.5 py-1.5 rounded-lg border text-center font-bold uppercase tracking-wider transition-colors ${
              step.active
                ? 'bg-cyan-950/50 border-cyan-400/50 text-cyan-300'
                : step.done
                ? 'bg-emerald-950/35 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950/50 border-white/[0.06] text-slate-500'
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {status === 'calibration' && currentCalib && (
        <motion.div key="l13-calibration" {...TAB_PANEL_MOTION} className="space-y-3.5 sm:space-y-4">
          <NaiaDialogue
            message={
              <>
                Dernière ligne droite ! Avant d'ouvrir la console de l'Innovation Lab (où l'<TechTerm term="IA Générative">IA générative</TechTerm> consomme ~2–3 mL par relance texte et ~12 mL par image prototype), validez ces 2 réflexes pour réussir votre <TechTerm term="Prompt">prompt</TechTerm> du premier coup.
              </>
            }
            emotion="neutral"
          />

          <MissionWorkspace
            hydra={{
              status: 'synced',
              message: "Mode Symbiose activé. Accréditation « Prompt Sobre » requise avant d'ouvrir le générateur.",
            }}
            objective="Complétez la calibration « L'Art du Prompt Sobre » pour déverrouiller l'atelier de conception."
          >
          <div className="font-sans overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`calib-${calibStep}`} {...STEP_PANEL_MOTION} className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4 text-emerald-400" />
                    {currentCalib.title}
                  </span>
                  {isDevMode && (
                    <button
                      type="button"
                      onClick={() => setStatus('input')}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60"
                    >
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span>[PROF] PASSER LA CALIBRATION</span>
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-100 leading-relaxed font-medium">{currentCalib.prompt}</p>

                <div className="space-y-2">
                  {currentCalib.options.map((opt) => {
                    const isSelected = selectedCalibOpt === opt.id;
                    const showGood = isSelected && opt.isCorrect;
                    const showBad = isSelected && !opt.isCorrect;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectCalib(opt)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 active:scale-[0.99] ${
                          showGood
                            ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100'
                            : showBad
                            ? 'bg-red-950/40 border-red-400 text-red-100'
                            : 'bg-slate-900/75 border-slate-800 hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <span className="text-xs sm:text-sm leading-snug">{opt.label}</span>
                        {(calibValidated || revealedCalibOpts.includes(opt.id)) && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                            className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-center flex items-center gap-1 ${
                              opt.isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}
                          >
                            <Droplets className="w-3 h-3" />
                            {opt.waterCostLabel}
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <Collapsible isOpen={Boolean(selectedCalibObj)}>
                  {selectedCalibObj && (
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                      selectedCalibObj.isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    }`}>
                      {selectedCalibObj.isCorrect ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span>{selectedCalibObj.feedback}</span>
                    </div>
                  )}
                </Collapsible>

                <Collapsible isOpen={calibValidated} innerClassName="flex justify-end pt-1">
                  <ActionButton
                    onClick={handleNextCalib}
                    size="md"
                    className="text-xs sm:text-sm font-mono"
                  >
                    {calibStep + 1 < PROMPT_CALIBRATION_STEPS.length ? 'RÉFLEXE SUIVANT' : 'OUVRIR LA CONSOLE DE CONCEPTION'}
                    <ChevronRight className="w-4 h-4" />
                  </ActionButton>
                </Collapsible>
              </motion.div>
            </AnimatePresence>
          </div>
          </MissionWorkspace>
        </motion.div>
      )}

      {status === 'input' && !isAnalyzing && (
        <motion.div key="l13-input" {...TAB_PANEL_MOTION} className="space-y-3.5 sm:space-y-4">
          <NaiaDialogue
            message={
              <>
                Vous avez repris le contrôle d'HYDRA. Utilisez maintenant l'IA générative de façon ciblée et sobre (~2–3 mL par analyse texte, ~12 mL par prototype 3D) pour déposer votre brevet.
              </>
            }
            emotion="happy"
          />

          <MissionWorkspace
            hydra={{
              status: 'synced',
              message: "Mode Symbiose activé. Noyau ouvert à l'éco-innovation.",
            }}
            objective={
              <>
                Rédigez un <TechTerm term="Prompt">prompt</TechTerm> précis dès le premier essai en couvrant les 4 piliers ci-dessous.
              </>
            }
            bodyClassName="space-y-3.5"
          >

          {isDevMode && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleDevAutoFill}
                className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-300 font-bold px-3.5 py-1.5 rounded-lg text-xs tracking-wider"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>[PROF] AUTO-REMPLIR L'IDÉE</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
            {[
              { num: '1', title: 'Problème ciblé', hint: 'Quelle perte d\'eau ?' },
              { num: '2', title: 'Capteurs & IA sobre', hint: 'IoT, petit modèle...' },
              { num: '3', title: 'Mécanisme concret', hint: 'Boucle fermée, alerte...' },
              { num: '4', title: 'Impact estimé', hint: 'Litres ou % économisés' },
            ].map((pillar) => (
              <div key={pillar.num} className="bg-slate-950/75 border border-cyan-500/20 rounded-xl px-3 py-2">
                <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  {pillar.num}. {pillar.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{pillar.hint}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="innovation-idea" className="sr-only">
              Description de votre invention pour économiser l'eau
            </label>
            <textarea
              id="innovation-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={MAX_IDEA_LENGTH}
              placeholder="Décrivez votre invention : problème d'eau ciblé, capteurs/IA sobre utilisés, mécanisme concret et économie attendue (20 à 1 500 caractères)…"
              className="block w-full h-44 bg-slate-950/85 border border-white/15 rounded-xl p-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15 transition-all resize-y font-sans leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-mono text-emerald-400/75">
                {idea.trim().length > 0 ? 'Brouillon sauvegardé automatiquement' : 'Minimum 20 caractères'}
              </span>
              <span
                className={`text-xs font-mono tabular-nums ${
                  idea.trim().length < MIN_IDEA_LENGTH
                    ? 'text-amber-400'
                    : idea.length >= MAX_IDEA_LENGTH
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {idea.trim().length} / {MAX_IDEA_LENGTH} caractères
              </span>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <ActionButton
              onClick={analyzeDraft}
              disabled={!isIdeaValid}
              size="lg"
            >
              <Send className="w-4 h-4" />
              <span>ANALYSER MON CONCEPT</span>
            </ActionButton>
          </div>
          </MissionWorkspace>
        </motion.div>
      )}

      {isAnalyzing && (
        <motion.div key="l13-analyzing" {...TAB_PANEL_MOTION}>
          <MissionWorkspace bodyClassName="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="relative flex items-center justify-center w-28 h-28">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute inset-0 border-t-4 border-b-4 border-emerald-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-4 border-r-4 border-l-4 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Sparkles className="w-9 h-9 text-yellow-400" />
            </motion.div>
          </div>
          <div className="text-center space-y-1.5 z-10">
            <p className="text-lg font-bold text-emerald-400 animate-pulse">{loadingStep}</p>
            <p className="text-cyan-400/75 text-xs font-mono tracking-widest uppercase">NAÏA analyse votre proposition…</p>
          </div>
          </MissionWorkspace>
        </motion.div>
      )}

      {status === 'draft' && evaluation && !isAnalyzing && scoreStyle && (
        <motion.div
          key="l13-draft"
          {...TAB_PANEL_MOTION}
          className="space-y-3.5 sm:space-y-4"
        >
          <NaiaDialogue
            hideHintButton
            message={`Analyse terminée pour « ${evaluation.title} » (${evaluation.score} %). ${evaluation.score >= 80 ? "Excellent concept : niveau Légendaire atteint !" : evaluation.score >= 50 ? "Bon concept : le prototype est débloqué." : "Il manque encore un peu de précision technique pour débloquer le prototype."}`}
            emotion={evaluation.score >= 50 ? 'happy' : 'neutral'}
          />

          <MissionWorkspace bodyClassName="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`bg-slate-950 border-2 ${scoreStyle.border} rounded-2xl p-5 transition-all duration-500 relative`}>
              <div className={`absolute -top-0.5 -right-0.5 px-3 py-1 ${scoreStyle.bg} ${scoreStyle.text} text-[10px] font-mono font-black tracking-widest rounded-bl-lg rounded-tr-xl border-b border-l ${scoreStyle.border}`}>
                RANG : {scoreStyle.label}
              </div>

              <h3 className={`${scoreStyle.text} font-bold text-sm mb-3 flex items-center gap-2`}>
                <Gauge className="w-4 h-4" /> POTENTIEL D'INNOVATION
              </h3>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="11" fill="transparent" className="text-slate-900" />
                    <motion.circle
                      cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="11" fill="transparent"
                      strokeDasharray={427}
                      initial={{ strokeDashoffset: 427 }}
                      animate={{ strokeDashoffset: 427 - (427 * evaluation.score) / 100 }}
                      transition={{ duration: 1.4, ease: "easeOut" }}
                      className={scoreStyle.text}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-3xl font-black font-mono ${scoreStyle.text}`}>{evaluation.score}%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score global</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Impact</div>
                  <div className="text-emerald-400 font-mono font-black text-sm">{evaluation.impact}/10</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Faisab.</div>
                  <div className="text-blue-400 font-mono font-black text-sm">{evaluation.feasibility}/10</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Rigueur</div>
                  <div className="text-purple-400 font-mono font-black text-sm">{evaluation.precision}/10</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Origin.</div>
                  <div className="text-yellow-400 font-mono font-black text-sm">{evaluation.originality}/10</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-cyan-500/20 p-5 rounded-2xl flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Pistes d'amélioration</span>
                </h3>
                <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/15 text-sm text-emerald-100 leading-relaxed">
                  {evaluation.feedback}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Paliers brevet :</div>
                <div className={`flex items-center gap-2 text-xs ${evaluation.score >= 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${evaluation.score >= 50 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  Débloquer le prototype (50 %)
                </div>
                <div className={`flex items-center gap-2 text-xs ${evaluation.score >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${evaluation.score >= 80 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                  Atteindre le rang Légendaire (80 %)
                </div>
              </div>
            </div>
          </div>

          {evaluation.score >= 50 && (
            <div className="bg-slate-950/85 border border-cyan-500/25 rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Choix de matérialisation (Sobriété du Labo)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Déjà consommé : <strong className={labDraftCount >= 3 ? 'text-amber-300' : 'text-cyan-300'}>{formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyse{labDraftCount > 1 ? 's' : ''})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => { soundManager.playClick(); setVisualMode('ai_3d'); }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    visualMode === 'ai_3d'
                      ? 'bg-cyan-950/45 border-cyan-400 text-white'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Prototype 3D par IA générative</div>
                    <div className="text-[11px] text-slate-400">Rendu visuel sur mesure pour le brevet</div>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 shrink-0">
                    +{IMAGE_WATER_ML} mL
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { soundManager.playClick(); setVisualMode('sober_svg'); }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    visualMode === 'sober_svg'
                      ? 'bg-emerald-950/45 border-emerald-400 text-white'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Blueprint vectoriel (Ultra-sobre)</div>
                    <div className="text-[11px] text-slate-400">Schéma technique généré localement, sans IA image</div>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shrink-0">
                    0 mL
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <ActionButton
                variant="secondary"
                size="md"
                onClick={() => setStatus('input')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>OPTIMISER LE CONCEPT</span>
              </ActionButton>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                +{DRAFT_WATER_ML.toLocaleString('fr-FR')} mL par nouvelle analyse
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <ActionButton
                variant="primary"
                size="md"
                onClick={finalizeProject}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>VALIDATION FINALE</span>
              </ActionButton>
              <p className="text-[11px] text-center text-slate-400 font-mono flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                Réouverture facturée -{LAB_REOPEN_PENALTY_POINTS} pts après validation
              </p>
            </div>
          </div>
          </MissionWorkspace>
        </motion.div>
      )}

      {status === 'final' && evaluation && (
        <motion.div
          key="l13-final"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
          className="space-y-3.5 sm:space-y-4"
        >
          {/* Bilan hydrique assumé du Labo */}
          <NaiaDialogue
            hideHintButton
            emotion={labDraftCount >= 3 ? 'neutral' : 'happy'}
            message={
              usedSoberVisual ? (
                <>
                  <strong>Bilan hydrique du Labo : {formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyse{labDraftCount > 1 ? 's' : ''} texte, 0 image IA). Exemplaire : vous avez validé votre brevet avec un schéma local sobre, sans générer d'image inutile, pour une économie projetée de <strong className="text-emerald-300">{evaluation.waterSaved} L/an</strong> !
                </>
              ) : labDraftCount >= 3 ? (
                <>
                  <strong>Bilan hydrique du Labo : {formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyses brouillon + {labImageCount} prototype 3D). Vous constatez en direct l'effet des relances successives sur la consommation d'eau : un prompt bien préparé dès le premier essai divise nettement l'empreinte.
                </>
              ) : (
                <>
                  <strong>Bilan hydrique du Labo : {formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyse{labDraftCount > 1 ? 's' : ''} texte{labImageCount > 0 ? ` + ${labImageCount} image 3D à 12 mL` : ''}). Utiliser l'IA générative a un coût réel en eau, mais un usage <strong>ciblé et sobre</strong> prend sens lorsqu'il sert une innovation capable d'économiser <strong className="text-emerald-300">{evaluation.waterSaved} L/an</strong>.
                </>
              )
            }
          />

          <MissionWorkspace bodyClassName="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patent Card */}
            <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-5 relative">
              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 px-3.5 py-1 font-mono font-bold text-[11px] rounded-bl-lg rounded-tr-xl tracking-tight">
                BREVET N°{patentNumber}
              </div>

              <div className="mb-3">
                <div className="text-[10px] text-emerald-500/75 uppercase tracking-widest font-mono">Inventeur</div>
                <div className="text-white font-bold tracking-tight">
                  {!nickname || nickname.trim().toLowerCase() === 'agent anonyme' ? 'Agent' : nickname}
                </div>
              </div>

              <h3 className="text-xl font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 shrink-0" />
                <span>{evaluation.title}</span>
              </h3>

              <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                {evaluation.description}
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Impact</div>
                    <div className="font-bold font-mono text-emerald-400 text-sm">{evaluation.impact}/10</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Faisabilité</div>
                    <div className="font-bold font-mono text-blue-400 text-sm">{evaluation.feasibility}/10</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Rigueur</div>
                    <div className="font-bold font-mono text-purple-400 text-sm">{evaluation.precision}/10</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Originalité</div>
                    <div className="font-bold font-mono text-yellow-400 text-sm">{evaluation.originality}/10</div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-bold tracking-wider">
                    <Droplets className="w-4 h-4 shrink-0" />
                    EAU ÉCONOMISÉE
                  </div>
                  <div className="font-black font-mono text-emerald-400">{evaluation.waterSaved} L/an</div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-900/50 flex items-center justify-between">
                <div className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-yellow-400/80" />
                  Score Innovation
                </div>
                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-3xl font-black text-yellow-400">{evaluation.score}</span>
                  <span className="text-yellow-400/60 text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Image Card (Reward) */}
            <div className="bg-slate-950 border-2 border-emerald-500/20 rounded-2xl p-2.5 flex flex-col items-center justify-between min-h-[300px] relative overflow-hidden group">
              {evaluation.score >= 50 ? (
                <>
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl relative z-10">
                    {generatedImageUrl ? (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        src={generatedImageUrl}
                        alt={evaluation.title}
                        className={
                          generatedImageUrl.startsWith('data:image/svg+xml')
                            ? 'w-full h-full max-h-[420px] object-contain rounded-xl'
                            : 'w-full h-full object-cover rounded-xl'
                        }
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full py-10">
                        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                        <p className="text-xs font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase animate-pulse">
                          Génération en cours…
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 w-full bg-slate-900/85 p-2 rounded-lg border border-cyan-500/30 text-[11px] font-mono text-cyan-400 text-center uppercase tracking-tight relative z-10">
                    {usedSoberVisual ? "Blueprint local sobre (0 mL d'IA image)" : 'Prototype 3D généré par IA (+12 mL)'}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 my-auto">
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-3 border border-slate-800">
                    <Lock className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest mb-1.5">Prototype Verrouillé</p>
                  <p className="text-xs leading-relaxed">
                    Atteignez un score de 50 % pour débloquer la visualisation de votre projet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <ActionButton
              variant="secondary"
              size="md"
              onClick={() => {
                soundManager.playClick();
                genRequestIdRef.current += 1;
                genAbortRef.current?.abort();
                setIsGeneratingImage(false);
                // Retire le gain du brevet précédent + pénalité modérée (empêche le farm infini sans sanctionner excessivement une correction)
                onScoreUpdate(-(awardedLabPoints + LAB_REOPEN_PENALTY_POINTS), 0);
                onFinalize?.(null, null, null);
                setAwardedLabPoints(0);
                setStatus('input');
                setEvaluation(null);
                setGeneratedImageUrl(null);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>RÉOUVRIR (-{LAB_REOPEN_PENALTY_POINTS} PTS)</span>
            </ActionButton>
            <ActionButton
              variant="primary"
              size="md"
              onClick={() => {
                try {
                  localStorage.removeItem(LAB_DRAFT_STORAGE_KEY);
                } catch {
                  // Ignore storage errors
                }
                onComplete();
              }}
              disabled={evaluation.score >= 50 && isGeneratingImage}
            >
              {evaluation.score >= 50 && isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MATÉRIALISATION DU PROTOTYPE…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TERMINER LA MISSION</span>
                </>
              )}
            </ActionButton>
          </div>
          </MissionWorkspace>
        </motion.div>
      )}
      </AnimatePresence>
    </LevelShell>
  );
}
