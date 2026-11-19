import { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Droplets, RotateCcw, Star, Award, Clock, Download, ShieldCheck, Shield, FlaskConical, BadgeCheck, Sparkles, Printer } from 'lucide-react';
import TechTerm from '../components/TechTerm';
import NaiaDialogue, { NaiaAvatar } from '../components/NaiaDialogue';
import BonusMissions, { BonusMissionId } from '../components/BonusMissions';
import { MISSION_DURATION_SECONDS, type Evaluation } from '../constants';
import { FALLBACK_PROTOTYPE_DATA_URI } from '../../shared/fallbackPrototype';

export default function Outro({ timeLeft, extraTimeBought = 0, score, waterSaved, mistakeCount = 0, onRestart, nickname, evaluation, imageUrl, labWaterMl = null, leaderboard, completedBonus = [], onCompleteBonus }: { 
  timeLeft: number; 
  extraTimeBought?: number;
  score: number; 
  waterSaved: number;
  mistakeCount?: number;
  onRestart: (name: string) => void; 
  nickname: string;
  evaluation?: Evaluation | null;
  imageUrl?: string | null;
  labWaterMl?: number | null;
  leaderboard?: {name: string, score: number}[];
  completedBonus?: BonusMissionId[];
  onCompleteBonus?: (id: BonusMissionId) => void;
  key?: string 
}) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloadingMode, setDownloadingMode] = useState<'dark' | 'light' | null>(null);
  const [certPrintMode, setCertPrintMode] = useState<'dark' | 'light'>('dark');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [safeImageUrl, setSafeImageUrl] = useState<string | null>(null);
  const isDownloading = downloadingMode !== null;

  const handleCompleteBonus = (id: BonusMissionId) => {
    onCompleteBonus?.(id);
  };

  useEffect(() => {
    if (!imageUrl) {
      setSafeImageUrl(null);
      return;
    }
    if (imageUrl.startsWith('data:')) {
      setSafeImageUrl(imageUrl);
      return;
    }
    // Précharger l'image en base64 pour éviter les blocages CORS lors de l'export html-to-image
    fetch(imageUrl, { mode: 'cors' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setSafeImageUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.warn("Image externe inaccessible, repli sur le prototype SVG local:", err);
        setSafeImageUrl(FALLBACK_PROTOTYPE_DATA_URI);
      });
  }, [imageUrl]);

  const resolvedImageSrc = safeImageUrl || imageUrl || '';
  const isSvgPrototype = resolvedImageSrc.startsWith('data:image/svg+xml');
  const currentYear = new Date().getFullYear();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const timeTaken = Math.max(0, MISSION_DURATION_SECONDS + extraTimeBought - timeLeft);

  const authToken = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = `${(nickname || 'ANONYME').trim().toUpperCase()}|${score}|${waterSaved}|${timeTaken}|${today}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
    return `NAIA_AUTH_${hex}`;
  }, [nickname, score, waterSaved, timeTaken]);

  const getGrade = () => {
    if (score >= 2830) return { title: 'COMMANDANT SUPRÊME', icon: <Star className="w-8 h-8 text-yellow-400" />, color: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-400/10', border: 'border-yellow-500/50' };
    if (score >= 2640) return { title: 'EXPERT HYDROSAVE', icon: <Droplets className="w-8 h-8 text-cyan-400" />, color: 'text-cyan-400', hex: '#22d3ee', bg: 'bg-cyan-400/10', border: 'border-cyan-500/50' };
    if (score >= 2430) return { title: 'AGENT SENIOR', icon: <Award className="w-8 h-8 text-emerald-400" />, color: 'text-emerald-400', hex: '#34d399', bg: 'bg-emerald-400/10', border: 'border-emerald-500/50' };
    if (score >= 2220) return { title: 'AGENT CONFIRMÉ', icon: <ShieldCheck className="w-8 h-8 text-slate-300" />, color: 'text-slate-300', hex: '#cbd5e1', bg: 'bg-slate-300/10', border: 'border-slate-500/50' };
    return { title: 'AGENT JUNIOR', icon: <Shield className="w-8 h-8 text-orange-400" />, color: 'text-orange-400', hex: '#fb923c', bg: 'bg-orange-400/10', border: 'border-orange-500/50' };
  };

  const grade = getGrade();

  const downloadFullCertificate = async (mode: 'dark' | 'light' = 'dark') => {
    if (!certificateRef.current || isDownloading) return;
    setDownloadingMode(mode);
    setCertPrintMode(mode);
    setDownloadError(null);

    try {
      const [{ toPng }] = await Promise.all([
        import('html-to-image'),
        new Promise(resolve => setTimeout(resolve, 300)),
      ]);

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const baseOptions = {
        pixelRatio: 2,
        backgroundColor: mode === 'light' ? '#ffffff' : '#020617',
        width: 794,
        height: 1123,
        imagePlaceholder: FALLBACK_PROTOTYPE_DATA_URI,
      };

      let dataUrl: string;
      try {
        dataUrl = await toPng(certificateRef.current, baseOptions);
      } catch {
        // Repli si les polices externes (Google Fonts) sont bloquées par un pare-feu scolaire
        dataUrl = await toPng(certificateRef.current, { ...baseOptions, skipFonts: true });
      }

      const link = document.createElement('a');
      const suffix = mode === 'light' ? '_ECO' : '';
      link.download = `DOSSIER_AQUA_IA_${(nickname || 'AGENT').toUpperCase()}${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur lors du téléchargement du certificat:", err);
      setDownloadError("Impossible de générer le PNG sur ce navigateur. Vous pouvez faire une capture d'écran de votre certificat ci-dessus.");
    } finally {
      setDownloadingMode(null);
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
      className="bg-slate-900/90 border border-white/10 p-5 sm:p-8 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)] max-w-3xl mx-auto text-center backdrop-blur-xl relative overflow-hidden"
    >
      {/* Subtle animated border glow line (optional but cool) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-50" />
      <motion.div variants={itemVariants} className="flex justify-center mb-4">
        <div className="relative group">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} 
            transition={{ duration: 4, repeat: Infinity }}
            className="relative"
          >
            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg border-2 border-slate-900"
          >
            <Droplets className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-black text-white mb-1.5 uppercase tracking-[0.18em] drop-shadow-sm">
        Mission Accomplie !
      </motion.h1>
      <motion.p variants={itemVariants} className="text-emerald-400/80 font-mono text-xs sm:text-sm tracking-widest mb-4">
        OPÉRATION "HYDROSAVE" TERMINÉE AVEC SUCCÈS
      </motion.p>

      <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-5 text-left">
        <NaiaDialogue
          hideHintButton
          message={`Félicitations, ${nickname.trim() ? (/^agent\b/i.test(nickname.trim()) ? nickname.trim() : `agent ${nickname.trim()}`) : 'agent Anonyme'} ! Les réserves d'eau potable de la ville remontent déjà. Désormais encadrée par la charte municipale et basculée en mode Symbiose, HYDRA protège nos réseaux hydriques au lieu de les épuiser.`}
          emotion="happy"
        />
      </motion.div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
        {[
          { icon: Clock, label: 'Temps', value: formatTime(timeTaken), color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
          { icon: Star, label: 'Score', value: score, sublabel: mistakeCount === 0 ? 'Sans erreur' : `${mistakeCount} erreur${mistakeCount > 1 ? 's' : ''}`, sublabelClass: 'text-yellow-300/75', color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30' },
          { icon: Droplets, label: 'Eau Sauvée', value: `${waterSaved}%`, sublabel: evaluation?.waterSaved ? `${evaluation.waterSaved} L/an` : undefined, sublabelClass: 'text-cyan-300/75', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30' },
          { icon: Award, label: 'Grade', value: grade.title, color: grade.color, bg: grade.bg, border: grade.border, fullWidth: true }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className={`${stat.bg} ${stat.border} border p-3 rounded-xl flex flex-col items-center justify-center`}
          >
            <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mb-1.5`} />
            <div className={`text-base sm:text-lg font-mono font-bold ${stat.color} truncate max-w-full`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{stat.label}</div>
            {stat.sublabel && (
              <div className={`text-[11px] font-mono mt-0.5 ${stat.sublabelClass}`}>{stat.sublabel}</div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div 
        variants={itemVariants}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/20 rounded-2xl p-5 sm:p-6 mb-5 max-w-xl mx-auto overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <div className="relative z-10">
          <h3 className="text-emerald-500 font-mono font-bold text-xs tracking-[0.25em] mb-3 opacity-70">OPÉRATION HYDROSAVE - CERTIFICAT OFFICIEL</h3>
          
          <div className="flex flex-col items-center mb-4">
            <div className="text-slate-400 text-[11px] uppercase tracking-widest mb-1 font-mono">Agent de liaison</div>
            <div className="text-2xl font-black text-white uppercase tracking-tight border-b-2 border-emerald-500/10 pb-2.5 w-full">
              {nickname || 'ANONYME'}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-slate-400 text-[11px] uppercase tracking-widest mb-2 font-mono">Niveau d'accréditation</div>
            <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full ${grade.bg} border-2 ${grade.border}`}>
              <div className="shrink-0">{grade.icon}</div>
              <div className={`text-base sm:text-lg font-black font-mono tracking-tighter ${grade.color}`}>
                {grade.title}
              </div>
            </div>
            {completedBonus.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {completedBonus.includes('gpu_cost') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                    <Star className="w-3 h-3 fill-current shrink-0" />
                    Architecte Matériel & GPU
                  </span>
                )}
                {completedBonus.includes('rebound') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                    <Star className="w-3 h-3 fill-current shrink-0" />
                    Veilleur Anti-Rebond
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {evaluation && (
        <motion.div
          variants={itemVariants}
          className="max-w-xl mx-auto mb-5 bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-4 text-left"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-yellow-400" /> Prototype Innovation Lab
            </span>
            <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full">
              {evaluation.score}%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {resolvedImageSrc && (
              <img
                src={resolvedImageSrc}
                alt={evaluation.title}
                className={
                  isSvgPrototype
                    ? 'w-36 h-36 object-contain bg-slate-950 rounded-xl border border-cyan-500/20 shrink-0'
                    : 'w-full sm:w-36 h-36 object-cover rounded-xl border border-cyan-500/20 shrink-0'
                }
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="space-y-2 flex-1 min-w-0">
              <h4 className="font-black text-white text-lg truncate">{evaluation.title}</h4>
              <p className="text-xs text-slate-300 italic line-clamp-3">"{evaluation.description}"</p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                  {evaluation.waterSaved} L/an économisés
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  Impact {evaluation.impact}/10
                </span>
                {typeof labWaterMl === 'number' && labWaterMl > 0 && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono">
                    Coût IA Labo : {labWaterMl.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mL
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {leaderboard && leaderboard.length >= 2 && (
        <div className="max-w-xl mx-auto mb-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-3 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" /> MEILLEURS SCORES (CE POSTE)
          </h3>
          <div className="space-y-1.5">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center px-3.5 py-1.5 bg-slate-900/50 rounded border border-slate-800/50 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-xs w-4">{idx + 1}.</span>
                  <span className={`font-bold ${entry.name === (nickname.trim() || 'Agent Anonyme') ? 'text-emerald-400' : 'text-slate-300'}`}>{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-yellow-500">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BonusMissions
        completedMissions={completedBonus}
        onCompleteMission={handleCompleteBonus}
      />

      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center mb-6">
        <button
          type="button"
          onClick={() => downloadFullCertificate('dark')}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 relative overflow-hidden group px-5 py-3 rounded-xl text-sm font-black transition-all border ${isDownloading ? 'bg-emerald-600/50 text-white/50 cursor-wait border-emerald-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'}`}
        >
          {/* Shine effect */}
          {!isDownloading && (
             <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {downloadingMode === 'dark' ? (
               <div className="w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            )}
            {downloadingMode === 'dark' ? 'GÉNÉRATION...' : 'DOSSIER A4 (ÉCRAN / ENT)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => downloadFullCertificate('light')}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${isDownloading ? 'bg-slate-800/60 text-slate-400 cursor-wait border-slate-700' : 'bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-200 border-cyan-500/40 hover:border-cyan-400/70 hover:shadow-[0_0_16px_rgba(34,211,238,0.2)]'}`}
          title="Version fond clair économe en encre pour impression laser N&B au collège"
        >
          {downloadingMode === 'light' ? (
            <div className="w-4 h-4 border-[3px] border-cyan-300/30 border-t-cyan-200 rounded-full animate-spin" />
          ) : (
            <Printer className="w-4 h-4 text-cyan-300" />
          )}
          <span>{downloadingMode === 'light' ? 'GÉNÉRATION...' : 'VERSION ÉCO-IMPRESSION (CLAIR)'}</span>
        </button>

        <button
          type="button"
          onClick={() => onRestart(nickname)}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:shadow-[0_0_12px_rgba(148,163,184,0.2)]"
        >
          <RotateCcw className="w-4 h-4" />
          REJOUER
        </button>
      </motion.div>

      {downloadError && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-2.5 mb-5 max-w-xl mx-auto">
          {downloadError}
        </p>
      )}

      <motion.div variants={itemVariants} className="space-y-4 text-left bg-slate-950/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-800/50 font-sans text-slate-300 shadow-inner">
        <div className="text-lg sm:text-xl font-black text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-3">
          <NaiaAvatar emotion="happy" size="sm" />
          <span>Ce qu'il faut retenir :</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-5">
          <div className="flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0 text-red-400 font-black shadow-sm">1</div>
            <div>
              <p className="font-bold text-white text-base">L'<TechTerm term="IA" /> a une empreinte écologique</p>
              <p className="text-sm mt-1 leading-relaxed opacity-80">Les <TechTerm term="Datacenter">datacenters</TechTerm> consomment énormément d'eau pour le <TechTerm term="Refroidissement" /> et d'électricité. Chaque requête a un coût réel.</p>
            </div>
          </div>
          
          <div className="flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 font-black shadow-sm">2</div>
            <div>
              <p className="font-bold text-white text-base">L'optimisation est possible</p>
              <p className="text-sm mt-1 leading-relaxed opacity-80">En choisissant des lieux froids (Free Cooling) et en récupérant la chaleur, on réduit drastiquement cet impact environnemental.</p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 text-emerald-400 font-black shadow-sm">3</div>
            <div>
              <p className="font-bold text-white text-base">L'économie circulaire</p>
              <p className="text-sm mt-1 leading-relaxed opacity-80">Réparer le matériel et trier les données (Data Hygiene) évite des calculs inutiles et économise l'eau de fabrication.</p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0 text-purple-400 font-black shadow-sm">4</div>
            <div>
              <p className="font-bold text-white text-base">La sobriété et l'éthique</p>
              <p className="text-sm mt-1 leading-relaxed opacity-80">Il faut utiliser le bon modèle pour le bon usage. L'innovation doit s'accompagner de règles pour protéger nos ressources.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hidden A4 Certificate for Download */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div 
          ref={certificateRef}
          className={`w-[794px] h-[1123px] bg-[#020617] text-white relative overflow-hidden font-sans flex flex-col items-stretch ${certPrintMode === 'light' ? 'cert-eco-print' : ''}`}
        >
          {/* Background Decorations */}
          <div className="cert-dark-blob absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="cert-dark-blob absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
          <div className="cert-dark-blob absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
          
          <div className="cert-outer-border absolute inset-0 border-[16px] border-[#020617] m-0 z-20 pointer-events-none" />
          <div className="cert-inner-border absolute inset-0 border-[3px] border-emerald-500/30 m-6 rounded-2xl pointer-events-none z-10" />

          <div className="flex-1 p-10 flex flex-col justify-between relative z-10 w-full h-full">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-emerald-500/30 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                   <h1 className="cert-title-gradient text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">RAPPORT DE MISSION</h1>
                </div>
                <p className="text-emerald-500/70 font-mono text-sm tracking-[0.2em] font-bold uppercase ml-[3.75rem]">AQUA-IA / HYDROSAVE_{currentYear}</p>
              </div>
            </div>

            {/* Agent Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0" />
                <h2 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                   <BadgeCheck className="w-4 h-4" /> IDENTITÉ DE L'AGENT
                </h2>
                <div className="text-3xl font-black mb-1 uppercase tracking-tight relative z-10 text-white drop-shadow-md">{nickname || 'ANONYME'}</div>
                <div className={`text-lg font-bold font-mono tracking-widest relative z-10 ${grade.color}`}>{grade.title}</div>
                {completedBonus.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 relative z-10">
                    {completedBonus.includes('gpu_cost') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                        <Star className="w-2.5 h-2.5 fill-current shrink-0" />
                        ARCHITECTE GPU
                      </span>
                    )}
                    {completedBonus.includes('rebound') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                        <Star className="w-2.5 h-2.5 fill-current shrink-0" />
                        ANTI-REBOND
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-cyan-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent z-0" />
                <h2 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                   <Trophy className="w-4 h-4" /> STATISTIQUES GLOBALES
                </h2>
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-yellow-400 mb-0.5">{score}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Score Total</div>
                  </div>
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-emerald-400 mb-0.5">{formatTime(timeTaken)}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Temps</div>
                  </div>
                  <div className="text-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-black text-cyan-400 mb-0.5">{waterSaved} %</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Eau Sauvée</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Innovation Section */}
            {evaluation && (
              <div className="mb-6 pl-1">
                <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                  <FlaskConical className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> 
                  PROJET : LABORATOIRE D'INNOVATION
                </h2>
                <div className="grid grid-cols-[3fr_2fr] gap-4">
                  <div className="space-y-3">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight line-clamp-2 break-words">{evaluation.title}</h3>
                      <p className="text-slate-300 leading-snug mb-4 italic text-[13px] border-l-2 border-emerald-500/50 pl-3 py-1 line-clamp-5 break-words">"{evaluation.description}"</p>
                      
                      <div className="flex gap-3 mb-3">
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-emerald-500/50">
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Impact</span>
                            <span className="font-black text-emerald-400 text-base">{evaluation.impact}/10</span>
                         </div>
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-blue-500/50">
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Faisabilité</span>
                            <span className="font-black text-blue-400 text-base">{evaluation.feasibility}/10</span>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-purple-500/50">
                            <span className="text-[10px] text-slate-400 uppercase font-mono">Rigueur</span>
                            <span className="font-black text-purple-400 text-base">{evaluation.precision}/10</span>
                         </div>
                         <div className="flex-1 bg-slate-950/80 p-2.5 rounded-xl border border-yellow-500/20 flex justify-between items-center shadow-[inset_0_0_15px_rgba(234,179,8,0.1)]">
                            <span className="text-[10px] text-yellow-500 uppercase font-mono font-bold">Score Global</span>
                            <span className="font-black text-yellow-400 text-lg">{evaluation.score}%</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTYsMTg1LDEyOSwwLjIpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
                      <div className="z-10">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono block leading-snug">Épargne Projetée</span>
                        {typeof labWaterMl === 'number' && labWaterMl > 0 && (
                          <span className="text-[10px] text-cyan-300/80 font-mono block mt-0.5">
                            Coût conception IA : {labWaterMl.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mL
                          </span>
                        )}
                      </div>
                      <span className="text-2xl font-black text-emerald-400 z-10 drop-shadow-sm">{evaluation.waterSaved} <span className="text-sm text-emerald-500/70">L/AN</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] overflow-hidden flex items-center justify-center relative p-2 h-full">
                     <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-emerald-500/5 z-0" />
                    {resolvedImageSrc ? (
                      <img
                        src={resolvedImageSrc}
                        alt="Prototype"
                        className={`w-full h-full rounded-xl relative z-10 ${isSvgPrototype ? 'object-contain' : 'object-cover'}`}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center relative z-10">
                        <Sparkles className="w-14 h-14 text-cyan-500/40 mx-auto mb-3" />
                        <span className="text-[10px] text-cyan-500/70 uppercase tracking-widest font-mono">Image non disponible</span>
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
                GÉNÉRÉ PAR SYSTÈME // NAÏA v2.5<br />
                © {currentYear} Aqua-IA Education Program
              </div>
              
              <div className="cert-watermark w-32 h-32 absolute left-1/2 -translate-x-1/2 -bottom-4 opacity-10 pointer-events-none">
                 <ShieldCheck className="w-full h-full text-white" />
              </div>

              <div className="text-right">
                <div className="text-[10px] text-cyan-500/70 shadow-sm uppercase mb-2 font-bold tracking-widest border border-cyan-500/20 px-2 py-1 rounded inline-block bg-cyan-950/30">
                   Signature Numérique Validée
                </div>
                <div className="font-mono text-emerald-400 text-[10px] tracking-[0.2em] uppercase">{authToken}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
