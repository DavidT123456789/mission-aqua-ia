import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, CheckCircle2, Lightbulb, Droplets, RotateCcw, Lock, Gauge, Loader2, MessageSquareText, ShieldCheck, AlertTriangle, ChevronRight, Wrench } from 'lucide-react';
import NaiaDialogue, { NaiaAvatar } from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import { soundManager } from '../utils/soundManager';
import type { Evaluation } from '../constants';
import { buildSoberBlueprintDataUri } from '../../shared/fallbackPrototype';

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
    title: 'Réflexe 1/2 — Savoir quand se passer d\'IA générative',
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
    title: 'Réflexe 2/2 — Rédiger un prompt structuré en 1 coup',
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

      {status === 'calibration' && currentCalib && (
        <div className="space-y-4">
          <HydraLog status="synced" message="Mode Symbiose activé. Accréditation « Prompt Sobre » requise avant d'ouvrir le générateur." />
          <NaiaDialogue
            message={
              <>
                Dernière ligne droite ! Avant d'ouvrir la console de l'Innovation Lab (où l'<TechTerm term="IA Générative">IA générative</TechTerm> consomme ~2–3 mL par relance texte et ~12 mL par image prototype), validez ces 2 réflexes pour réussir votre <TechTerm term="Prompt">prompt</TechTerm> du premier coup.
              </>
            }
            objective="Complétez la calibration « L'Art du Prompt Sobre » pour déverrouiller l'atelier de conception."
            emotion="neutral"
          />

          <div className="bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 font-sans">
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
                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      showGood
                        ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100'
                        : showBad
                        ? 'bg-red-950/40 border-red-400 text-red-100'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <span className="text-xs sm:text-sm leading-snug">{opt.label}</span>
                    {(calibValidated || revealedCalibOpts.includes(opt.id)) && (
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-center flex items-center gap-1 ${
                        opt.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        <Droplets className="w-3 h-3" />
                        {opt.waterCostLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

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

            {calibValidated && (
              <div className="flex justify-end pt-1">
                <ActionButton
                  onClick={handleNextCalib}
                  size="md"
                  className="text-xs sm:text-sm font-mono"
                >
                  {calibStep + 1 < PROMPT_CALIBRATION_STEPS.length ? 'RÉFLEXE SUIVANT' : 'OUVRIR LA CONSOLE DE CONCEPTION'}
                  <ChevronRight className="w-4 h-4" />
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'input' && !isAnalyzing && (
        <div className="space-y-6">
          <div className="relative min-h-[320px] w-full rounded-2xl overflow-hidden border border-white/10 group bg-slate-950">
            {/* Local SVG cyber-hydro backdrop (zero external requests) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1200 420"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full opacity-55 transition-transform duration-1000 group-hover:scale-105 pointer-events-none"
            >
              <defs>
                <radialGradient id="labGlow" cx="72%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="55%" stopColor="#10b981" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
                <pattern id="labGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#22d3ee" strokeOpacity="0.12" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1200" height="420" fill="#020617" />
              <rect width="1200" height="420" fill="url(#labGrid)" />
              <rect width="1200" height="420" fill="url(#labGlow)" />
              <g stroke="#22d3ee" strokeOpacity="0.22" fill="none">
                <circle cx="880" cy="200" r="155" strokeWidth="1.5" strokeDasharray="8 8" />
                <circle cx="880" cy="200" r="110" strokeWidth="1.5" stroke="#34d399" strokeOpacity="0.28" />
                <circle cx="880" cy="200" r="62" strokeWidth="1.5" />
                <path d="M 650 200 L 725 200 M 1035 200 L 1140 200 M 880 20 L 880 45 M 880 355 L 880 400" strokeWidth="1.5" />
              </g>
              <path
                d="M 880 155 C 880 155 908 188 908 210 C 908 226 895 239 880 239 C 865 239 852 226 852 210 C 852 188 880 155 880 155 Z"
                fill="#10b981"
                fillOpacity="0.25"
                stroke="#34d399"
                strokeOpacity="0.55"
                strokeWidth="2"
              />
            </svg>
            <div className="absolute inset-0 bg-cyan-900/20 mix-blend-color z-10 transition-opacity duration-500 group-hover:opacity-10"></div>
            {/* Gradients pour intégrer le dialogue et masquer les bords de l'image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,rgba(13,148,136,0.1)_1px)] bg-[length:100%_4px] pointer-events-none z-20"></div>
            
            <div className="relative z-30 flex flex-col h-full justify-between p-4 sm:p-6">
              <div className="w-full sm:max-w-2xl space-y-2.5">
                <HydraLog status="synced" message="Mode Symbiose activé. Noyau ouvert à l'éco-innovation." />
                <NaiaDialogue 
                  message={
                    <>
                      Bravo Agent, vous avez repris le contrôle d'HYDRA ! Désormais en sobriété et en circuit fermé, nous pouvons utiliser l'IA générative à bon escient (pour éviter de gaspiller ~2–3 mL par relance texte et ~12 mL par image prototype).
                    </>
                  }
                  objective={
                    <>
                      Rédigez un <TechTerm term="Prompt">prompt</TechTerm> précis dès le premier essai pour concevoir votre innovation de préservation de l'eau et matérialiser son prototype !
                    </>
                  }
                  emotion="happy"
                />
              </div>

              <div className="flex justify-end mt-8">
                <div className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-md p-3 rounded-xl border border-cyan-500/20 shadow-lg">
                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-0.5">Atelier de Conception</div>
                    <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 justify-end">
                      En attente de paramètres <span className="flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '0.1s'}}>.</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span></span>
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <Lightbulb className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isDevMode && (
            <div className="flex justify-start">
              <button 
                onClick={handleDevAutoFill}
                className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-300 font-bold px-4 py-2 rounded-lg text-xs tracking-wider"
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
                  Pilier {pillar.num} · {pillar.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{pillar.hint}</div>
              </div>
            ))}
          </div>

          <div className="relative group mt-4">
            {/* Décoration Terminal */}
            <div className="absolute -top-3 left-4 px-3 py-1 flex items-center gap-2 z-30 bg-slate-950 border border-emerald-500/40 rounded-full shadow-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">Console d'Entrée Neurale</span>
            </div>
            
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={MAX_IDEA_LENGTH}
              placeholder="Décrivez votre invention en détails : fonctionnement, capteurs utilisés, impact attendu (20 à 1 500 caractères)"
              className="block w-full h-48 relative z-20 bg-slate-950/80 backdrop-blur-md border border-white/15 rounded-xl p-5 pt-8 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15 focus:bg-slate-950/90 transition-all resize-none shadow-inner font-sans"
            />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 z-30 pointer-events-none">
              {idea.trim().length > 0 ? (
                <span className="text-[10px] font-mono text-emerald-400/75 bg-slate-900/90 px-2.5 py-1 rounded border border-emerald-900/40">
                  Brouillon sauvegardé
                </span>
              ) : (
                <span />
              )}
              <div className={`text-xs font-mono bg-slate-900 px-3 py-1.5 rounded border transition-colors ${idea.trim().length < MIN_IDEA_LENGTH ? 'text-red-400 border-red-900/50' : idea.length >= MAX_IDEA_LENGTH ? 'text-amber-400 border-amber-800/60' : 'text-emerald-500 border-emerald-900/50'}`}>
                <span className={idea.trim().length < MIN_IDEA_LENGTH ? 'animate-pulse' : ''}>{idea.trim().length}</span> / {MIN_IDEA_LENGTH} min · {MAX_IDEA_LENGTH} max
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={analyzeDraft}
              disabled={!isIdeaValid}
              className={`relative flex items-center gap-3 px-8 py-4 rounded-xl font-black tracking-widest sm:text-lg transition-all overflow-hidden group ${
                !isIdeaValid
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isIdeaValid && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
              )}
              <Send className={`w-5 h-5 relative z-10 ${isIdeaValid ? 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform' : ''}`} />
              <span className="relative z-10">ANALYSER MON CONCEPT</span>
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
          <div className="relative flex items-center justify-center w-32 h-32">
            {/* Glowing background pulse */}
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            
            {/* Outer spinning ring with glow */}
            <div className="absolute inset-0 border-t-4 border-b-4 border-emerald-500 rounded-full animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            
            {/* Inner reverse spinning ring */}
            <div className="absolute inset-4 border-r-4 border-l-4 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite_reverse] shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
            
            {/* Center icon that pulses */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Sparkles className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)]" />
            </motion.div>
          </div>
          <div className="text-center space-y-2 z-10">
            <p className="text-xl font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse">{loadingStep}</p>
            <p className="text-cyan-400/70 text-sm tracking-widest uppercase">L'IA de NAÏA traite vos données...</p>
          </div>
        </div>
      )}

      {status === 'draft' && evaluation && !isAnalyzing && scoreStyle && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <NaiaDialogue 
            message={`Analyse préliminaire terminée. Votre concept "${evaluation.title}" a un potentiel de ${evaluation.score}%. ${evaluation.score >= 80 ? "C'est une innovation de classe mondiale !" : evaluation.score >= 50 ? "C'est un excellent début, le prototype est débloqué." : "Il manque encore un peu de précision pour matérialiser ce projet."}`}
            emotion={evaluation.score >= 80 ? 'happy' : evaluation.score >= 50 ? 'happy' : 'neutral'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`bg-slate-950 border-2 ${scoreStyle.border} rounded-2xl p-6 transition-all duration-500 relative`}>
              <div className={`absolute -top-1 -right-1 px-3 py-1 ${scoreStyle.bg} ${scoreStyle.text} text-[11px] font-black tracking-widest rounded-bl-lg border-b border-l ${scoreStyle.border}`}>
                RANG : {scoreStyle.label}
              </div>

              <h3 className={`${scoreStyle.text} font-bold mb-4 flex items-center gap-2`}>
                <Gauge className="w-5 h-5" /> POTENTIEL D'INNOVATION
              </h3>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-900" />
                    <motion.circle 
                      cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={440}
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * evaluation.score) / 100 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className={scoreStyle.text}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-4xl font-black ${scoreStyle.text}`}>{evaluation.score}%</span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Estimation</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Impact</div>
                  <div className="text-emerald-400 font-black text-lg">{evaluation.impact}/10</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Rigueur</div>
                  <div className="text-purple-400 font-black text-lg">{evaluation.precision}/10</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-cyan-500/20 p-6 rounded-2xl flex flex-col">
              <h3 className="font-mono text-emerald-400 font-bold mb-4 flex items-center gap-2.5">
                <NaiaAvatar emotion="happy" size="sm" />
                <span>ANALYSE DE NAÏA</span>
              </h3>
              <div className="flex-grow space-y-4">
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10 italic text-sm text-emerald-100 leading-relaxed">
                  "{evaluation.feedback}"
                </div>
                
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Objectifs de mission :</div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] ${evaluation.score >= 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${evaluation.score >= 50 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      DÉBLOQUER LE PROTOTYPE (50%)
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] ${evaluation.score >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${evaluation.score >= 80 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                      ATTEINDRE LE RANG LÉGENDAIRE (80%)
                    </div>
                  </div>
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
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
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
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                    visualMode === 'sober_svg'
                      ? 'bg-emerald-950/45 border-emerald-400 text-white'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Blueprint vectoriel personnalisé (Ultra-sobre)</div>
                    <div className="text-[11px] text-slate-400">Schéma technique généré sur mesure selon votre idée (sans IA image)</div>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shrink-0">
                    0 mL
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <ActionButton
                variant="secondary"
                onClick={() => setStatus('input')}
                className="group py-4 text-white"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                OPTIMISER LE CONCEPT
              </ActionButton>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                +{DRAFT_WATER_ML.toLocaleString('fr-FR')} mL d'eau par nouvelle analyse IA
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={finalizeProject}
                className={`group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-lg transition-all ${
                  evaluation.score >= 80 
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 hover:shadow-[0_0_18px_rgba(234,179,8,0.35)]' 
                    : evaluation.score >= 50
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                VALIDATION FINALE
              </button>
              <p className="text-[11px] text-center text-slate-400 uppercase tracking-tighter flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" /> Réouverture du labo facturée -250 pts après validation
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {status === 'final' && evaluation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div className="p-4 rounded-3xl bg-slate-950 border border-cyan-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Patent Card */}
              <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-6 relative">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 px-4 py-1 font-bold text-[11px] rounded-bl-lg tracking-tighter">
                  BREVET N°{patentNumber}
                </div>
                
                <div className="mb-4">
                  <div className="text-[11px] text-emerald-500/70 uppercase tracking-widest font-mono">Inventeur / Agent</div>
                  <div className="text-white font-bold tracking-tight">{nickname || 'Agent Anonyme'}</div>
                </div>

                <h3 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6" />
                  {evaluation.title}
                </h3>
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed italic text-justify">
                  "{evaluation.description}"
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[11px] text-slate-400 uppercase mb-1 tracking-widest group-hover:text-emerald-400 transition-colors">Impact</div>
                      <div className="font-bold text-emerald-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.impact}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-blue-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[11px] text-slate-400 uppercase mb-1 tracking-widest group-hover:text-blue-400 transition-colors">Faisabilité</div>
                      <div className="font-bold text-blue-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.feasibility}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-purple-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[11px] text-slate-400 uppercase mb-1 tracking-widest group-hover:text-purple-400 transition-colors">Rigueur</div>
                      <div className="font-bold text-purple-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.precision}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-yellow-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[11px] text-slate-400 uppercase mb-1 tracking-widest group-hover:text-yellow-400 transition-colors">Originalité</div>
                      <div className="font-bold text-yellow-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.originality}/10</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center gap-3 text-xs text-emerald-400 font-bold tracking-widest">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <Droplets className="w-4 h-4" />
                      </div>
                      EAU ÉCONOMISÉE
                    </div>
                    <div className="font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{evaluation.waterSaved} litres/an</div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-emerald-900/50 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400/75" />
                      Score Innovation
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">{evaluation.score}</span>
                      <span className="text-yellow-400/50 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Card (Reward) */}
              <div className="bg-slate-950 border-2 border-emerald-500/20 rounded-2xl p-2 flex flex-col items-center justify-between min-h-[300px] relative overflow-hidden group">
                {/* Effet Scanner UI arrière-plan */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(16,185,129,0.05)_50%,transparent_60%)] bg-[length:100%_4px] pointer-events-none z-20"></div>
                <div className="absolute inset-x-0 w-full h-[2px] bg-emerald-500/30 blur-[1px] animate-[scan-vertical_3s_ease-in-out_infinite] z-20 pointer-events-none"></div>

                {evaluation.score >= 50 ? (
                  <>
                    <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl relative z-10">
                      {generatedImageUrl ? (
                        <motion.img 
                          initial={{ opacity: 0, filter: "brightness(0.5) contrast(1.2)" }}
                          animate={{ opacity: 1, filter: "brightness(1) contrast(1)" }}
                          transition={{ duration: 1 }}
                          src={generatedImageUrl} 
                          alt={evaluation.title}
                          className={
                            generatedImageUrl.startsWith('data:image/svg+xml')
                              ? 'w-full h-full max-h-[420px] object-contain rounded-xl transition-transform duration-700 group-hover:scale-[1.02]'
                              : 'w-full h-full object-cover rounded-xl transition-transform duration-1000 group-hover:scale-105'
                          }
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full w-full py-10">
                            <div className="relative mb-6">
                              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                              <div className="relative flex items-center justify-center">
                                <Loader2 className="w-16 h-16 text-cyan-400 animate-[spin_2s_linear_infinite] drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                  className="absolute"
                                >
                                  <Sparkles className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
                                </motion.div>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase animate-pulse">
                              Génération en cours
                            </p>
                            <p className="text-[11px] text-cyan-500/70 mt-2 uppercase tracking-widest">
                              Initialisation du réseau...
                            </p>
                          </div>
                      )}
                    </div>
                    <div className="mt-2 w-full bg-slate-900/85 backdrop-blur-sm p-2 rounded-lg border border-cyan-500/30 text-[11px] text-cyan-400 text-center uppercase tracking-tighter relative z-10">
                      {usedSoberVisual ? 'Blueprint personnalisé local (0 mL d\'IA image)' : 'Prototype 3D matérialisé par IA (+12 mL)'}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 text-slate-600">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                      <Lock className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2">Prototype Verrouillé</p>
                    <p className="text-[11px] leading-relaxed">
                      Atteignez un score d'innovation de 50% pour débloquer la visualisation IA de votre projet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                  <strong>Bilan hydrique du Labo : {formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyses brouillon + {labImageCount} prototype 3D). Vous constatez en direct l'effet des relances successives sur la consommation d'eau ! Retenez le réflexe : un prompt bien préparé dès le premier essai divise nettement l'empreinte.
                </>
              ) : (
                <>
                  <strong>Bilan hydrique du Labo : {formatWaterMl(labWaterMl)}</strong> ({labDraftCount} analyse{labDraftCount > 1 ? 's' : ''} texte{labImageCount > 0 ? ` + ${labImageCount} image 3D à 12 mL` : ''}). Assumons le paradoxe : utiliser l'IA générative a un coût réel en eau, mais un usage <strong>ciblé et sobre</strong> reste pertinent lorsqu'il sert une innovation capable d'économiser <strong className="text-emerald-300">{evaluation.waterSaved} L/an</strong> !
                </>
              )
            }
          />

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => {
                soundManager.playClick();
                genRequestIdRef.current += 1;
                genAbortRef.current?.abort();
                setIsGeneratingImage(false);
                // Retire le gain du brevet précédent + pénalité de -250 pts (empêche le farm infini)
                onScoreUpdate(-(awardedLabPoints + 250), 0);
                onFinalize?.(null, null, null);
                setAwardedLabPoints(0);
                setStatus('input');
                setEvaluation(null);
                setGeneratedImageUrl(null);
              }}
              className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-slate-800"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <div className="text-left">
                <div className="text-xs">RÉOUVRIR LE LABO</div>
                <div className="text-[11px] text-red-400">COÛT : -250 PTS</div>
              </div>
            </button>
            <ActionButton
              onClick={() => {
                try {
                  localStorage.removeItem(LAB_DRAFT_STORAGE_KEY);
                } catch {
                  // Ignore storage errors
                }
                onComplete();
              }}
              disabled={evaluation.score >= 50 && isGeneratingImage}
              className={
                evaluation.score >= 50 && isGeneratingImage
                  ? 'py-4 bg-emerald-950/60 text-emerald-300/70 border border-emerald-500/30 cursor-wait'
                  : 'py-4'
              }
            >
              {evaluation.score >= 50 && isGeneratingImage ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  MATÉRIALISATION DU PROTOTYPE...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  TERMINER LA MISSION
                </>
              )}
            </ActionButton>
          </div>
        </motion.div>
      )}
    </LevelShell>
  );
}
