import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Droplets, RotateCcw, Star, Award, Clock, Download, ShieldCheck, Zap, Bot } from 'lucide-react';
import { toPng } from 'html-to-image';
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

export default function Outro({ timeLeft, score, waterSaved, onRestart, nickname, evaluation, imageUrl, leaderboard }: { 
  timeLeft: number; 
  score: number; 
  waterSaved: number;
  onRestart: (name: string) => void; 
  nickname: string;
  evaluation?: Evaluation | null;
  imageUrl?: string | null;
  leaderboard?: {name: string, score: number}[];
  key?: string 
}) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [safeImageUrl, setSafeImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        setSafeImageUrl(imageUrl);
        return;
      }
      // Précharger l'image en base64 pour contourner les blocages CORS agressifs de html2canvas
      fetch(imageUrl, { mode: 'cors' })
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => setSafeImageUrl(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error("Impossible de précharger l'image en Base64:", err);
          setSafeImageUrl(imageUrl); // Fallback mais risqué pour html2canvas
        });
    }
  }, [imageUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const timeTaken = 1800 - timeLeft;

  const getGrade = () => {
    if (score >= 1000) return { title: 'COMMANDANT SUPRÊME', icon: <Star className="w-8 h-8 text-yellow-400" />, color: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-400/10', border: 'border-yellow-500/50' };
    if (score >= 800) return { title: 'EXPERT HYDROSAVE', icon: <Droplets className="w-8 h-8 text-cyan-400" />, color: 'text-cyan-400', hex: '#22d3ee', bg: 'bg-cyan-400/10', border: 'border-cyan-500/50' };
    if (score >= 600) return { title: 'AGENT SENIOR', icon: <Award className="w-8 h-8 text-emerald-400" />, color: 'text-emerald-400', hex: '#34d399', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' };
    if (score >= 400) return { title: 'AGENT CONFIRMÉ', icon: <ShieldCheck className="w-8 h-8 text-slate-300" />, color: 'text-slate-300', hex: '#cbd5e1', bg: 'bg-slate-300/10', border: 'border-slate-500/50' };
    return { title: 'AGENT JUNIOR', icon: <Zap className="w-8 h-8 text-orange-400" />, color: 'text-orange-400', hex: '#fb923c', bg: 'bg-orange-400/10', border: 'border-orange-500/50' };
  };

  const grade = getGrade();

  const downloadFullCertificate = async () => {
    if (!certificateRef.current || isDownloading) return;
    setIsDownloading(true);
    
    const element = certificateRef.current;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(certificateRef.current, {
        pixelRatio: 2,
        backgroundColor: '#020617',
        width: 794,
        height: 1123,
      });
      
      const link = document.createElement('a');
      link.download = `DOSSIER_AQUA_IA_${nickname.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur lors du téléchargement du certificat:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-900/90 border border-emerald-500/40 p-6 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15),inset_0_0_20px_rgba(16,185,129,0.05)] max-w-3xl mx-auto text-center backdrop-blur-xl relative overflow-hidden"
    >
      {/* Subtle animated border glow line (optional but cool) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-50" />
      <motion.div variants={itemVariants} className="flex justify-center mb-8">
        <div className="relative group">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} 
            transition={{ duration: 4, repeat: Infinity }}
            className="relative"
          >
            <Trophy className="w-28 h-28 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2.5 shadow-lg border-2 border-slate-900"
          >
            <Droplets className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-[0.2em] drop-shadow-sm">
        Mission Accomplie !
      </motion.h1>
      <motion.p variants={itemVariants} className="text-emerald-400/80 font-mono text-sm tracking-widest mb-8">
        OPÉRATION "HYDROSAVE" TERMINÉE AVEC SUCCÈS
      </motion.p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-10">
        {[
          { icon: Clock, label: 'Temps', value: formatTime(timeTaken), color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
          { icon: Star, label: 'Score', value: score, color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30' },
          { icon: Droplets, label: 'Eau Sauvée', value: `${waterSaved}%`, color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30' },
          { icon: Award, label: 'Grade', value: grade.title, color: grade.color, bg: grade.bg, border: grade.border, fullWidth: true }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`${stat.bg} ${stat.border} border p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg`}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <div className={`text-xl font-mono font-bold ${stat.color} truncate max-w-full`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        variants={itemVariants}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/20 rounded-2xl p-8 mb-8 max-w-xl mx-auto overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <div className="relative z-10">
          <h3 className="text-emerald-500 font-mono font-bold text-xs tracking-[0.3em] mb-4 opacity-70">SOCIÉTÉ HYDROSAVE - CERTIFICAT OFFICIEL</h3>
          
          <div className="flex flex-col items-center mb-6">
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-2 font-mono">Agent de liaison</div>
            <div className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight border-b-2 border-emerald-500/10 pb-4 w-full">
              {nickname || 'ANONYME'}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-3 font-mono">Niveau d'accréditation</div>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${grade.bg} border-2 ${grade.border}`}>
              <div className="shrink-0">{grade.icon}</div>
              <div className={`text-xl font-black font-mono tracking-tighter ${grade.color}`}>
                {grade.title}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {leaderboard && leaderboard.length > 0 && (
        <div className="max-w-xl mx-auto mb-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" /> TOP 5 DES MEILLEURS AGENTS
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center px-4 py-2 bg-slate-900/50 rounded border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}.</span>
                  <span className={`font-bold ${entry.name === nickname ? 'text-emerald-400' : 'text-slate-300'}`}>{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-yellow-500">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
        <button
          onClick={downloadFullCertificate}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-3 relative overflow-hidden group px-8 py-4 rounded-xl font-black transition-all ${isDownloading ? 'bg-emerald-600/50 text-white/50 cursor-wait border border-emerald-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 border-b-4 border-emerald-800'}`}
        >
          {/* Shine effect */}
          {!isDownloading && (
             <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isDownloading ? (
               <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            )}
            {isDownloading ? 'GÉNÉRATION EN COURS...' : 'TÉLÉCHARGER MON DOSSIER COMPLET (A4)'}
          </span>
        </button>
        <button
          onClick={() => onRestart(nickname)}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all hover:bg-slate-750 active:scale-95 border border-slate-700"
        >
          <RotateCcw className="w-5 h-5" />
          REJOUER
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4 text-left bg-slate-950/80 backdrop-blur-md p-8 rounded-2xl border border-slate-800/50 font-sans text-slate-300 shadow-inner">
        <p className="text-xl font-black text-white border-b border-slate-800 pb-4 mb-6 flex items-center gap-3">
          <Bot className="w-6 h-6 text-emerald-500" />
          Ce qu'il faut retenir :
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0 text-red-400 font-black shadow-sm">1</div>
            <div>
              <p className="font-bold text-white text-lg">L'<TechTerm term="IA" /> a une empreinte écologique</p>
              <p className="text-sm mt-2 leading-relaxed opacity-80">Les <TechTerm term="Datacenter">datacenters</TechTerm> consomment énormément d'au pour le <TechTerm term="Refroidissement" /> et d'électricité. Chaque requête a un coût réel.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 font-black shadow-sm">2</div>
            <div>
              <p className="font-bold text-white text-lg">L'optimisation est possible</p>
              <p className="text-sm mt-2 leading-relaxed opacity-80">En choisissant des lieux froids (Free Cooling) et en récupérant la chaleur, on réduit drastiquement cet impact environnemental.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 text-emerald-400 font-black shadow-sm">3</div>
            <div>
              <p className="font-bold text-white text-lg">L'économie circulaire</p>
              <p className="text-sm mt-2 leading-relaxed opacity-80">Réparer le matériel et trier les données (Data Hygiene) évite des calculs inutiles et économise l'eau de fabrication.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0 text-purple-400 font-black shadow-sm">4</div>
            <div>
              <p className="font-bold text-white text-lg">La sobriété et l'éthique</p>
              <p className="text-sm mt-2 leading-relaxed opacity-80">Il faut utiliser le bon modèle pour le bon usage. L'innovation doit s'accompagner de règles pour protéger nos ressources.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hidden A4 Certificate for Download */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div 
          ref={certificateRef}
          className="w-[794px] h-[1123px] bg-[#020617] text-white relative overflow-hidden font-sans flex flex-col items-stretch"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
          
          <div className="absolute inset-0 border-[16px] border-[#020617] m-0 z-20 pointer-events-none" />
          <div className="absolute inset-0 border-[3px] border-emerald-500/30 m-6 rounded-2xl pointer-events-none z-10" />

          <div className="flex-1 p-10 flex flex-col justify-between relative z-10 w-full h-full">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-emerald-500/30 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                   <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">RAPPORT DE MISSION</h1>
                </div>
                <p className="text-emerald-500/70 font-mono text-sm tracking-[0.2em] font-bold uppercase ml-[3.75rem]">AQUA-IA / HYDROSAVE_2024</p>
              </div>
            </div>

            {/* Agent Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0" />
                <h2 className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                   <Bot className="w-4 h-4" /> IDENTITÉ DE L'AGENT
                </h2>
                <div className="text-3xl font-black mb-1 uppercase tracking-tight relative z-10 text-white drop-shadow-md">{nickname}</div>
                <div className={`text-lg font-bold font-mono tracking-widest relative z-10 ${grade.color}`}>{grade.title}</div>
              </div>
              
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-cyan-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent z-0" />
                <h2 className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                   <Trophy className="w-4 h-4" /> STATISTIQUES GLOBALES
                </h2>
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-yellow-400 mb-0.5">{score}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Score Total</div>
                  </div>
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-emerald-400 mb-0.5">{formatTime(timeTaken)}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Temps</div>
                  </div>
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-cyan-400 mb-0.5">{waterSaved}%</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Eau Sauvée</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Innovation Section */}
            {evaluation && (
              <div className="mb-6 pl-1">
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                  <Zap className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> 
                  PROJET : LABORATOIRE D'INNOVATION
                </h2>
                <div className="grid grid-cols-[3fr_2fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{evaluation.title}</h3>
                      <p className="text-slate-300 leading-snug mb-4 italic text-[13px] border-l-2 border-emerald-500/50 pl-3 py-1">"{evaluation.description}"</p>
                      
                      <div className="flex gap-3 mb-3">
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-emerald-500/50">
                            <span className="text-[9px] text-slate-400 uppercase font-mono">Impact</span>
                            <span className="font-black text-emerald-400 text-base">{evaluation.impact}/10</span>
                         </div>
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-blue-500/50">
                            <span className="text-[9px] text-slate-400 uppercase font-mono">Faisabilité</span>
                            <span className="font-black text-blue-400 text-base">{evaluation.feasibility}/10</span>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-purple-500/50">
                            <span className="text-[9px] text-slate-400 uppercase font-mono">Rigueur</span>
                            <span className="font-black text-purple-400 text-base">{evaluation.precision}/10</span>
                         </div>
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-yellow-500/20 flex justify-between items-center shadow-[inset_0_0_15px_rgba(234,179,8,0.1)]">
                            <span className="text-[9px] text-yellow-500 uppercase font-mono font-bold">Score Global</span>
                            <span className="font-black text-yellow-400 text-lg">{evaluation.score}%</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTYsMTg1LDEyOSwwLjIpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest font-mono z-10 w-24 leading-snug">Épargne Projetée</span>
                      <span className="text-2xl font-black text-emerald-400 z-10 drop-shadow-sm">{evaluation.waterSaved} <span className="text-sm text-emerald-500/70">L/AN</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] overflow-hidden flex items-center justify-center relative p-2 h-full">
                     <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-emerald-500/5 z-0" />
                    {safeImageUrl || imageUrl ? (
                      <img src={safeImageUrl || imageUrl || ''} alt="Prototype" className="w-full h-full object-cover rounded-xl relative z-10" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center relative z-10">
                        <Bot className="w-16 h-16 text-cyan-500/30 mx-auto mb-3" />
                        <span className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-mono">Image non disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Learnings Section */}
            <div className="mt-auto pl-1">
              <h2 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                 <Award className="w-4 h-4" /> COMPÉTENCES ACQUISES
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 relative group overflow-hidden transition-colors hover:bg-slate-800/60 hover:border-emerald-500/30">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50" />
                  <h4 className="font-bold text-white text-xs mb-1 pl-2">Écoconception Numérique</h4>
                  <p className="text-[10px] text-slate-400 pl-2 leading-tight">Compréhension de l'impact des datacenters et des méthodes de refroidissement durable.</p>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 relative group overflow-hidden transition-colors hover:bg-slate-800/60 hover:border-cyan-500/30">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                  <h4 className="font-bold text-white text-xs mb-1 pl-2">Sobriété de l'IA</h4>
                  <p className="text-[10px] text-slate-400 pl-2 leading-tight">Capacité à choisir le bon modèle pour le bon usage et à optimiser les données.</p>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 relative group overflow-hidden transition-colors hover:bg-slate-800/60 hover:border-blue-500/30">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50" />
                  <h4 className="font-bold text-white text-xs mb-1 pl-2">Économie Circulaire</h4>
                  <p className="text-[10px] text-slate-400 pl-2 leading-tight">Gestion du cycle de vie du matériel et valorisation de la chaleur fatale (Energy Reuse).</p>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 relative group overflow-hidden transition-colors hover:bg-slate-800/60 hover:border-purple-500/30">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50" />
                  <h4 className="font-bold text-white text-xs mb-1 pl-2">Éthique Environnementale</h4>
                  <p className="text-[10px] text-slate-400 pl-2 leading-tight">Sensibilisation à la responsabilité des créateurs d'IA face à l'épuisement des ressources.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-end relative">
              <div className="text-[10px] text-slate-500 font-mono">
                GÉNÉRÉ PAR SYSTÈME // NAÏA-OS V1.4<br />
                © 2024 Aqua-IA Education Program
              </div>
              
              <div className="w-32 h-32 absolute left-1/2 -translate-x-1/2 -bottom-4 opacity-10 pointer-events-none">
                 <ShieldCheck className="w-full h-full text-white" />
              </div>

              <div className="text-right">
                <div className="text-[9px] text-cyan-500/70 shadow-sm uppercase mb-2 font-bold tracking-widest border border-cyan-500/20 px-2 py-1 rounded inline-block bg-cyan-950/30">
                   Signature Numérique Validée
                </div>
                <div className="font-mono text-emerald-400 text-[10px] tracking-[0.2em] uppercase">NAIA_AUTH_TOKEN_OX45FA9</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
