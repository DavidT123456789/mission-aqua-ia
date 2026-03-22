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

export default function BonusLevel({ onComplete, onScoreUpdate, nickname, onFinalize }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; nickname: string; onFinalize?: (evaluation: any, imageUrl: string | null) => void; key?: string }) {
  const [idea, setIdea] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [status, setStatus] = useState<'input' | 'draft' | 'final'>('input');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [patentNumber, setPatentNumber] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const dossierRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score < 50) return { text: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10', label: 'BRONZE' };
    if (score < 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', label: 'ARGENT' };
    return { text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', label: 'LÉGENDAIRE' };
  };

  const scoreStyle = evaluation ? getScoreColor(evaluation.score) : null;

  const analyzeDraft = async () => {
    if (!idea.trim() || idea.length < 20) return;

    setIsAnalyzing(true);
    setError(null);
    setLoadingStep('Analyse préliminaire de votre concept');
    setGeneratedImageUrl(null);

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
      console.error(err);
      setError("Désolé, la connexion avec HYDRA a été interrompue. Réessayez !");
      setIsAnalyzing(false);
    }
  };

  const finalizeProject = async () => {
    if (!evaluation) return;

    setIsFinalizing(true);
    setLoadingStep('Génération du brevet officiel et du prototype');
    setPatentNumber(`FR-${Math.floor(100000 + Math.random() * 900000)}`);

    try {
      if (evaluation.score >= 50) {
        setLoadingStep('Score > 50% : Matérialisation du prototype en cours');
        
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: evaluation.title,
            description: evaluation.description
          })
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur lors de la génération de l'image");
        }

        const data = await resp.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
        }
      }

      onScoreUpdate(evaluation.score * 5, 100);
      setStatus('final');
      if (onFinalize) {
        onFinalize(evaluation, generatedImageUrl);
      }
      setIsFinalizing(false);

    } catch (err) {
      console.error(err);
      setError("Erreur lors de la finalisation. Réessayez.");
      setIsFinalizing(false);
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
      className="sm:bg-slate-900 border-transparent sm:border-emerald-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-2xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Sparkles className="w-8 h-8 text-yellow-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          NIVEAU BONUS : L'INNOVATION LAB
        </h2>
      </div>

      {status === 'input' && !isAnalyzing && (
        <div className="space-y-4">
          <NaiaDialogue 
            message="Agent, HYDRA est sous contrôle. Il est temps de passer à l'offensive. Développez votre propre concept d'innovation pour sauver l'eau. Plus votre description sera précise et technique, plus votre score sera élevé. Si vous atteignez 50% d'innovation, je matérialiserai votre prototype !"
            emotion="happy"
          />

          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Décrivez votre invention en détails : fonctionnement, capteurs utilisés, impact attendu (min. 20 caractères)"
              className="w-full h-48 bg-slate-950 border border-emerald-900/50 rounded-xl p-4 text-emerald-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-sans"
            />
            <div className={`absolute bottom-4 right-4 text-xs ${idea.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
              {idea.length} / 20 caractères min.
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={analyzeDraft}
              disabled={!idea.trim() || idea.length < 20}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] ${
                !idea.trim() || idea.length < 20
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
              }`}
            >
              <Send className="w-5 h-5" />
              ANALYSER MON CONCEPT
            </button>
          </div>
          
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </div>
      )}

      {(isAnalyzing || isFinalizing) && (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-emerald-500" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-emerald-400">{loadingStep}</p>
            <p className="text-slate-500 text-sm">L'IA de NAÏA traite vos données</p>
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

            <div className="bg-slate-950 border border-emerald-500/20 p-6 rounded-2xl flex flex-col">
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
        </motion.div>
      )}

      {status === 'final' && evaluation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div ref={dossierRef} className="p-4 rounded-3xl bg-slate-950 border border-emerald-500/20">
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
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed italic">
                  "{evaluation.description}"
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Impact</div>
                      <div className="font-bold text-emerald-400 text-sm">{evaluation.impact}/10</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Faisabilité</div>
                      <div className="font-bold text-blue-400 text-sm">{evaluation.feasibility}/10</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Rigueur</div>
                      <div className="font-bold text-purple-400 text-sm">{evaluation.precision}/10</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase mb-1">Originalité</div>
                      <div className="font-bold text-yellow-400 text-sm">{evaluation.originality}/10</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Droplets className="w-4 h-4" />
                      EAU ÉCONOMISÉE
                    </div>
                    <div className="font-bold text-emerald-400">{evaluation.waterSaved} litres / an</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Score Innovation</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-yellow-400">{evaluation.score}</span>
                      <span className="text-yellow-400/50 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Card (Reward) */}
              <div className="bg-slate-950 border-2 border-cyan-500/30 rounded-2xl p-2 flex flex-col items-center justify-center min-h-[300px] relative">
                {evaluation.score >= 50 ? (
                  <>
                    {generatedImageUrl ? (
                      <motion.img 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={generatedImageUrl} 
                        alt={evaluation.title}
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600">
                        <Loader2 className="w-12 h-12 mb-2 animate-spin" />
                        <p className="text-xs">Génération du prototype</p>
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
              onClick={downloadDossier}
              className="group flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-4 rounded-xl font-bold transition-all"
            >
              <Download className="w-5 h-5 group-hover:bounce" />
              TÉLÉCHARGER MON DOSSIER
            </button>
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
