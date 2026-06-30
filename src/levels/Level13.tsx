import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, CheckCircle2, Lightbulb, Zap, ShieldCheck, Image as ImageIcon, Loader2, Droplets, Bot, RotateCcw, Lock, Activity, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleGenAI } from "@google/genai";
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

interface Evaluation {
  title: string;
  description: string;
  impact: string;
  feasibility: string;
  precision: string;
  originality: string;
  score: number;
  waterSaved: string;
  feedback: string;
}

export default function Level13({ onComplete, onScoreUpdate, nickname, onFinalize, isDevMode }: { 
  onComplete: () => void; 
  onScoreUpdate: (points: number, water: number) => void; 
  nickname: string; 
  onFinalize?: (evaluation: any, imageUrl: string | null) => void; 
  isDevMode?: boolean;
  key?: string 
}) {
  const [idea, setIdea] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [status, setStatus] = useState<'input' | 'draft' | 'final'>('input');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [patentNumber, setPatentNumber] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [imageGenError, setImageGenError] = useState(false);
  const dossierRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score < 50) return { text: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10', label: 'BRONZE' };
    if (score < 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', label: 'ARGENT' };
    return { text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', label: 'LÉGENDAIRE' };
  };

  const scoreStyle = evaluation ? getScoreColor(evaluation.score) : null;

  const handleDevAutoFill = () => {
    setIdea("Un système de refroidissement utilisant des capteurs d'humidité et des circuits fermés d'eau recyclée avec récupération de chaleur fatale pour chauffer les serres agricoles de la ville.");
  };

  const analyzeDraft = async () => {
    if (!idea.trim() || idea.length < 20) return;

    setIsAnalyzing(true);
    setError(null);
    setLoadingStep('Analyse préliminaire de votre concept');
    setGeneratedImageUrl(null);
    setImageGenError(false);

    try {
      const resp = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de connexion avec l'IA");
      }

      const data = await resp.json() as Evaluation;
      setEvaluation(data);
      setStatus('draft');
      setIsAnalyzing(false);

    } catch (err) {
      console.error("Evaluation error:", err);
      // Fallback de secours en cas de dépassement de quota (429) ou d'erreur réseau
      // Permet à l'élève de finir la mission même si l'API est temporairement bloquée.
      setEvaluation({
        title: "Concept Expérimental (Mode Secours)",
        description: idea,
        impact: "7",
        feasibility: "7",
        precision: "6",
        originality: "6",
        score: 50,
        waterSaved: "25000",
        feedback: "Système de secours activé suite à une surcharge temporaire du réseau HYDRA. Votre concept reste techniquement viable et permet exceptionnellement de débloquer le prototype."
      });
      setStatus('draft');
      setIsAnalyzing(false);
    }
  };

  const finalizeProject = async () => {
    if (!evaluation) return;

    setIsFinalizing(true);
    setLoadingStep('Génération du brevet officiel et du prototype');
    setPatentNumber(`FR-${Math.floor(100000 + Math.random() * 900000)}`);

    // On passe directement à l'écran final pour voir le spinner dans la carte image
    onScoreUpdate(evaluation.score * 5, 100);
    setStatus('final');
    setIsFinalizing(false);

    if (evaluation.score >= 50) {
      // Lancement de la génération en arrière-plan
      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: evaluation.title,
            description: evaluation.description
          })
        });

        // Un petit délai artificiel (2s) pour laisser à l'utilisateur le loisir de voir le joli spinner agir
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (resp.ok) {
          const data = await resp.json();
          if (data.imageUrl) {
            setGeneratedImageUrl(data.imageUrl);
            if (onFinalize) onFinalize(evaluation, data.imageUrl);
          } else {
            console.warn("L'image n'est pas revenue correctement.");
            setImageGenError(true);
            if (onFinalize) onFinalize(evaluation, null);
          }
        } else {
          console.warn("Image generation failed (non-ok response).");
          setImageGenError(true);
          if (onFinalize) onFinalize(evaluation, null);
        }
      } catch (genErr) {
        console.error("Fetch error during image generation:", genErr);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setImageGenError(true);
        if (onFinalize) onFinalize(evaluation, null);
      }
    } else {
      if (onFinalize) onFinalize(evaluation, null);
    }
  };

  const downloadDossier = async () => {
    if (!dossierRef.current) return;
    
    try {
      const canvas = await html2canvas(dossierRef.current, {
        backgroundColor: '#020617', // slate-950
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `AquaIA_Dossier_${nickname}_${evaluation?.title.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-[0_0_40px_rgba(34,211,238,0.15)] max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Sparkles className="w-8 h-8 text-yellow-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          NIVEAU 13 : L'INNOVATION LAB
        </h2>
      </div>

      {status === 'input' && !isAnalyzing && (
        <div className="space-y-6">
          <div className="relative min-h-[320px] w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] group">
            <div className="absolute inset-0 bg-cyan-900/30 mix-blend-color z-10 transition-opacity duration-500 group-hover:opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200" 
              alt="Innovation Lab" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60"
              crossOrigin="anonymous"
            />
            {/* Gradients pour intégrer le dialogue et masquer les bords de l'image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,rgba(13,148,136,0.1)_1px)] bg-[length:100%_4px] pointer-events-none z-20"></div>
            
            <div className="relative z-30 flex flex-col h-full justify-between p-4 sm:p-6">
              <div className="w-full sm:max-w-2xl">
                <NaiaDialogue 
                  message="Agent, vous avez traversé 12 niveaux de sécurité, maîtrisé le refroidissement, colmaté les fuites, optimisé le code et rédigé la charte éthique. HYDRA est sous contrôle. Il est temps de graver votre vision dans son noyau : concevez votre propre innovation pour préserver l'eau. Plus votre concept sera précis et technique, plus votre brevet sera légendaire !"
                  emotion="happy"
                />
              </div>

              <div className="flex justify-end mt-8">
                <div className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-md p-3 rounded-xl border border-cyan-500/20 shadow-lg">
                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-0.5">Atelier de Conception</div>
                    <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 justify-end">
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
                className="bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-300 font-bold px-4 py-2 rounded-lg text-xs tracking-wider"
              >
                🛠️ (DÉMO/DEV) AUTO-REMPLIR L'IDÉE
              </button>
            </div>
          )}

          <div className="relative group mt-6">
            {/* Décoration Terminal */}
            <div className="absolute -top-3 left-4 px-3 py-1 flex items-center gap-2 z-30 bg-slate-950 border border-emerald-500/50 rounded-full shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Console d'Entrée Neurale</span>
            </div>
            
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Décrivez votre invention en détails : fonctionnement, capteurs utilisés, impact attendu (min. 20 caractères)"
              className="block w-full h-48 relative z-20 bg-slate-950/80 backdrop-blur-md border-2 border-slate-800 rounded-xl p-5 pt-8 text-emerald-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:bg-slate-950/90 transition-all resize-none shadow-inner font-sans"
            />

            <div className={`absolute bottom-4 right-4 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded border z-30 transition-colors ${idea.length < 20 ? 'text-red-400 border-red-900/50' : 'text-emerald-500 border-emerald-900/50'}`}>
              <span className={idea.length < 20 ? 'animate-pulse' : ''}>{idea.length}</span> / 20 caractères min.
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={analyzeDraft}
              disabled={!idea.trim() || idea.length < 20}
              className={`relative flex items-center gap-3 px-8 py-4 rounded-xl font-black tracking-widest sm:text-lg transition-all overflow-hidden group ${
                !idea.trim() || idea.length < 20
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] border border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]'
              }`}
            >
              {idea.length >= 20 && (
                <>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-500"></div>
                </>
              )}
              <Send className={`w-5 h-5 relative z-10 ${idea.length >= 20 ? 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform' : ''}`} />
              <span className="relative z-10">ANALYSER MON CONCEPT</span>
            </button>
          </div>
          
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </div>
      )}

      {(isAnalyzing || isFinalizing) && (
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
              <div className={`absolute -top-1 -right-1 px-3 py-1 ${scoreStyle.bg} ${scoreStyle.text} text-[10px] font-black tracking-widest rounded-bl-lg border-b border-l ${scoreStyle.border}`}>
                RANG : {scoreStyle.label}
              </div>

              <h3 className={`${scoreStyle.text} font-bold mb-4 flex items-center gap-2`}>
                <Activity className="w-5 h-5" /> POTENTIEL D'INNOVATION
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
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Estimation</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Impact</div>
                  <div className="text-emerald-400 font-black text-lg">{evaluation.impact}/10</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Rigueur</div>
                  <div className="text-purple-400 font-black text-lg">{evaluation.precision}/10</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-cyan-500/20 p-6 rounded-2xl flex flex-col">
              <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5" /> ANALYSE DE NAÏA
              </h3>
              <div className="flex-grow space-y-4">
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10 italic text-sm text-emerald-100 leading-relaxed">
                  "{evaluation.feedback}"
                </div>
                
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Objectifs de mission :</div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[10px] ${evaluation.score >= 50 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${evaluation.score >= 50 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                      DÉBLOQUER LE PROTOTYPE (50%)
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] ${evaluation.score >= 80 ? 'text-yellow-400' : 'text-slate-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${evaluation.score >= 80 ? 'bg-yellow-400' : 'bg-slate-800'}`} />
                      ATTEINDRE LE RANG LÉGENDAIRE (80%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={() => setStatus('input')}
              className="group flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all border border-slate-700"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              OPTIMISER LE CONCEPT
            </button>
            <div className="flex flex-col gap-2">
              <button
                onClick={finalizeProject}
                className={`group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] ${
                  evaluation.score >= 80 
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-yellow-500/40' 
                    : evaluation.score >= 50
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300 shadow-none'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                VALIDATION FINALE
              </button>
              <p className="text-[9px] text-center text-slate-500 uppercase tracking-tighter">
                ⚠️ Action irréversible après validation
              </p>
            </div>
          </div>
          {error && <p className="text-red-500 text-center font-bold text-sm mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>}
        </motion.div>
      )}

      {status === 'final' && evaluation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div ref={dossierRef} className="p-4 rounded-3xl bg-slate-950 border border-cyan-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Patent Card */}
              <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-6 relative">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 px-4 py-1 font-bold text-[10px] rounded-bl-lg tracking-tighter">
                  BREVET N°{patentNumber}
                </div>
                
                <div className="mb-4">
                  <div className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-mono">Inventeur / Agent</div>
                  <div className="text-white font-bold tracking-tight">{nickname}</div>
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
                      <div className="text-[10px] text-slate-500 uppercase mb-1 tracking-widest group-hover:text-emerald-500/70 transition-colors">Impact</div>
                      <div className="font-bold text-emerald-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.impact}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-blue-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[10px] text-slate-500 uppercase mb-1 tracking-widest group-hover:text-blue-500/70 transition-colors">Faisabilité</div>
                      <div className="font-bold text-blue-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.feasibility}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-purple-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[10px] text-slate-500 uppercase mb-1 tracking-widest group-hover:text-purple-500/70 transition-colors">Rigueur</div>
                      <div className="font-bold text-purple-400 text-sm group-hover:scale-105 origin-left transition-transform">{evaluation.precision}/10</div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-yellow-500/30 hover:bg-slate-900 transition-all group">
                      <div className="text-[10px] text-slate-500 uppercase mb-1 tracking-widest group-hover:text-yellow-500/70 transition-colors">Originalité</div>
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
                    <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500/50" />
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
              <div className="bg-slate-950 border-2 border-emerald-500/20 rounded-2xl p-2 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                {/* Effet Scanner UI arrière-plan */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(16,185,129,0.05)_50%,transparent_60%)] bg-[length:100%_4px] pointer-events-none z-20"></div>
                <div className="absolute inset-0 w-full h-[2px] bg-emerald-500/30 blur-[1px] animate-[scan_3s_ease-in-out_infinite] z-20 pointer-events-none"></div>

                {evaluation.score >= 50 ? (
                  <>
                    {generatedImageUrl ? (
                      <motion.img 
                        initial={{ opacity: 0, filter: "brightness(0.5) contrast(1.2)" }}
                        animate={{ opacity: 1, filter: "brightness(1) contrast(1)" }}
                        transition={{ duration: 1 }}
                        src={generatedImageUrl} 
                        alt={evaluation.title}
                        className="w-full h-full object-cover rounded-xl z-10 transition-transform duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : imageGenError ? (
                        <div className="flex flex-col items-center text-center p-6 text-slate-600">
                          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                            <Lock className="w-8 h-8 opacity-20 text-red-500" />
                          </div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-red-500/70">Génération Échouée</p>
                          <p className="text-[10px] leading-relaxed">
                            Le réseau neuronal n'a pas pu matérialiser le prototype.
                          </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full">
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
                          <p className="text-[9px] text-cyan-500/50 mt-2 uppercase tracking-widest">
                            Initialisation du réseau...
                          </p>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm p-2 rounded border border-cyan-500/30 text-[10px] text-cyan-400 text-center uppercase tracking-tighter">
                      Prototype matérialisé par NAÏA
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 text-slate-600">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                      <Lock className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2">Prototype Verrouillé</p>
                    <p className="text-[10px] leading-relaxed">
                      Atteignez un score d'innovation de 50% pour débloquer la visualisation IA de votre projet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => {
                // Penalty for re-opening the lab after finalization
                onScoreUpdate(-250, 0);
                setStatus('input');
                setEvaluation(null);
                setGeneratedImageUrl(null);
              }}
              className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-slate-800"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <div className="text-left">
                <div className="text-xs">RÉOUVRIR LE LABO</div>
                <div className="text-[9px] text-red-500">COÛT : -250 PTS</div>
              </div>
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-6 h-6" />
              TERMINER LA MISSION
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
