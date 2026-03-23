import { useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Droplets, RotateCcw, Star, Award, Clock, Download, ShieldCheck, Zap, Bot } from 'lucide-react';
import html2canvas from 'html2canvas';
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
    if (!certificateRef.current) return;
    
    // Temporarily show the hidden certificate for capture
    const element = certificateRef.current;
    element.style.display = 'block';
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `CERTIFICAT_AQUA_IA_${nickname.toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erreur lors du téléchargement du certificat:", err);
    } finally {
      element.style.display = 'none';
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
            <Trophy className="w-4 h-4" /> MEILLEURS AGENTS
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
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
        >
          <Download className="w-5 h-5" />
          TÉLÉCHARGER MON DOSSIER COMPLET (A4)
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
      <div style={{ display: 'none' }}>
        <div 
          ref={certificateRef}
          className="w-[794px] min-h-[1123px] bg-slate-950 text-white p-12 relative overflow-hidden font-sans"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-emerald-500/30 pb-8 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-emerald-400 mb-2">AQUA-IA : RAPPORT DE MISSION</h1>
              <p className="text-slate-400 font-mono text-sm">Réf: MISSION_HYDROSAVE_2024_001</p>
            </div>
            <ShieldCheck className="w-16 h-16 text-emerald-400" />
          </div>

          {/* Agent Info */}
          <div className="grid grid-cols-2 gap-5 mb-12">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-emerald-500/20">
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">IDENTITÉ DE L'AGENT</h2>
              <div className="text-3xl font-bold mb-2">{nickname}</div>
              <div className={`text-xl font-bold font-mono ${grade.color}`}>{grade.title}</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-emerald-500/20">
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">STATISTIQUES DE MISSION</h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Score Total</div>
                  <div className="text-xl font-bold text-yellow-400">{score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Temps</div>
                  <div className="text-xl font-bold text-emerald-400">{formatTime(timeTaken)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Eau Sauvée</div>
                  <div className="text-xl font-bold text-cyan-400">{waterSaved}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Innovation Section */}
          {evaluation && (
            <div className="mb-12">
              <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4" /> DOSSIER D'INNOVATION TECHNOLOGIQUE
              </h2>
              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 space-y-4">
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-cyan-500/30">
                    <h3 className="text-2xl font-bold text-white mb-2">{evaluation.title}</h3>
                    <p className="text-slate-300 leading-relaxed mb-6 italic">"{evaluation.description}"</p>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Impact</div>
                        <div className="font-bold text-emerald-400">{evaluation.impact}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Faisabilité</div>
                        <div className="font-bold text-blue-400">{evaluation.feasibility}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Rigueur</div>
                        <div className="font-bold text-purple-400">{evaluation.precision}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Score IA</div>
                        <div className="font-bold text-yellow-400">{evaluation.score}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">EAU ÉCONOMISÉE ESTIMÉE :</span>
                    <span className="text-2xl font-black text-emerald-400">{evaluation.waterSaved} L / AN</span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[200px]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Prototype" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  ) : (
                    <Bot className="w-12 h-12 text-slate-800" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Learnings Section */}
          <div className="mt-auto">
            <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-6">COMPÉTENCES ACQUISES</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-1">Écoconception Numérique</h4>
                <p className="text-[10px] text-slate-400">Compréhension de l'impact des datacenters et des méthodes de refroidissement durable.</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-1">Sobriété de l'IA</h4>
                <p className="text-[10px] text-slate-400">Capacité à choisir le bon modèle pour le bon usage et à optimiser les données.</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-1">Économie Circulaire</h4>
                <p className="text-[10px] text-slate-400">Gestion du cycle de vie du matériel et valorisation de la chaleur fatale.</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-1">Éthique Environnementale</h4>
                <p className="text-[10px] text-slate-400">Sensibilisation à la responsabilité des créateurs d'IA face aux ressources naturelles.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex justify-between items-end">
            <div className="text-[10px] text-slate-500">
              Généré par NAÏA - Système de Protection des Ressources<br />
              © 2024 Aqua-IA Education Program
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase mb-2">Signature de l'IA Centrale</div>
              <div className="font-mono text-emerald-400 text-xs tracking-widest">NAIA_AUTH_TOKEN_VALIDATED</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
