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

export default function Outro({ timeLeft, score, onRestart, nickname, evaluation, imageUrl, leaderboard }: { 
  timeLeft: number; 
  score: number; 
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
    if (score >= 1000) return { title: 'COMMANDANT SUPRÊME', icon: '🌟', color: 'text-yellow-400', hex: '#facc15' };
    if (score >= 800) return { title: 'EXPERT HYDROSAVE', icon: '💎', color: 'text-cyan-400', hex: '#22d3ee' };
    if (score >= 600) return { title: 'AGENT SENIOR', icon: '🥇', color: 'text-emerald-400', hex: '#34d399' };
    if (score >= 400) return { title: 'AGENT CONFIRMÉ', icon: '🥈', color: 'text-slate-300', hex: '#cbd5e1' };
    return { title: 'AGENT JUNIOR', icon: '🥉', color: 'text-orange-400', hex: '#fb923c' };
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-emerald-500/50 p-8 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-3xl mx-auto text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Trophy className="w-24 h-24 text-yellow-400" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2"
          >
            <Droplets className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-widest">
        Mission Accomplie !
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto my-8">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-lg">
          <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-emerald-400">{formatTime(timeTaken)}</div>
          <div className="text-xs text-slate-400 uppercase">Temps</div>
        </div>
        <div className="bg-yellow-950/30 border border-yellow-500/30 p-4 rounded-lg">
          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-yellow-400">{score}</div>
          <div className="text-xs text-slate-400 uppercase">Score</div>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-500/30 p-4 rounded-lg">
          <Droplets className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-2xl font-mono font-bold text-cyan-400">100%</div>
          <div className="text-xs text-slate-400 uppercase">Eau Sauvée</div>
        </div>
        <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-lg">
          <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className={`text-xl font-bold ${grade.color}`}>{grade.icon}</div>
          <div className="text-xs text-slate-400 uppercase">Grade</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-2 border-cyan-500/30 rounded-xl p-6 mb-5 max-w-xl mx-auto">
        <h3 className="text-cyan-400 font-mono font-bold mb-2">CERTIFICAT HYDROSAVE</h3>
        <p className="text-slate-300 text-sm mb-1">Cette équipe a sauvé les réserves d'eau mondiales !</p>
        <div className="text-white font-bold mb-4 uppercase tracking-widest border-b border-cyan-500/20 pb-2">
          Agent : {nickname}
        </div>
        <div className={`text-2xl font-bold font-mono tracking-widest ${grade.color}`}>
          {grade.title}
        </div>
      </div>

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

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
        <button
          onClick={downloadFullCertificate}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Download className="w-5 h-5" />
          TÉLÉCHARGER MON DOSSIER COMPLET (A4)
        </button>
        <button
          onClick={() => onRestart(nickname)}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          REJOUER
        </button>
      </div>

      <div className="space-y-4 text-left bg-slate-950 p-6 rounded-lg border border-slate-800 font-sans text-slate-300">
        <p className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          Ce qu'il faut retenir :
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center shrink-0 text-red-400 font-bold">1</div>
            <div>
              <p className="font-bold text-white">L'<TechTerm term="IA" /> a une empreinte écologique</p>
              <p className="text-sm mt-1">Les <TechTerm term="Datacenter">datacenters</TechTerm> consomment énormément d'eau pour le <TechTerm term="Refroidissement" /> et d'électricité pour le calcul. Chaque requête a un coût environnemental.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-400 font-bold">2</div>
            <div>
              <p className="font-bold text-white">L'optimisation est possible</p>
              <p className="text-sm mt-1">En choisissant des lieux froids (Free Cooling), en récupérant la chaleur fatale et en entraînant les modèles quand l'énergie est décarbonée, on réduit drastiquement cet impact.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-400 font-bold">3</div>
            <div>
              <p className="font-bold text-white">L'économie circulaire et la donnée</p>
              <p className="text-sm mt-1">Réparer le matériel plutôt que le remplacer économise l'eau de fabrication. De même, trier les données d'entraînement (Data Hygiene) évite des calculs inutiles.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center shrink-0 text-purple-400 font-bold">4</div>
            <div>
              <p className="font-bold text-white">La sobriété et la régulation</p>
              <p className="text-sm mt-1">Il ne faut pas utiliser un modèle massif pour une tâche simple. L'innovation doit s'accompagner de règles éthiques pour garantir un équilibre entre progrès et préservation.</p>
            </div>
          </div>
        </div>
      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Score Total</div>
                  <div className="text-2xl font-bold text-yellow-400">{score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Temps de Mission</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatTime(timeTaken)}</div>
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
