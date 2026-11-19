import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Droplets, RotateCcw, Star, Award, Clock, Download, ShieldCheck, Shield, FlaskConical, BadgeCheck, Sparkles, Printer, BookOpen } from 'lucide-react';
import TechTerm from '../components/TechTerm';
import NaiaDialogue from '../components/NaiaDialogue';
import BonusMissions, { BonusMissionId } from '../components/BonusMissions';
import { MISSION_DURATION_SECONDS, type Evaluation } from '../constants';
import { FALLBACK_PROTOTYPE_DATA_URI } from '../../shared/fallbackPrototype';
import { EASE_OUT_EXPO, SPRING_SNAPPY, TAB_PANEL_MOTION } from '../utils/motion';

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
  const [activeTab, setActiveTab] = useState<'dossier' | 'bonus' | 'synthese'>('dossier');
  const isDownloading = downloadingMode !== null;

  const rawName = nickname.trim();
  const isAnonymous = !rawName || rawName.toLowerCase() === 'agent anonyme';
  const greetingAgent = isAnonymous
    ? 'Agent'
    : /^agent\b/i.test(rawName)
    ? rawName
    : `Agent ${rawName}`;
  const certificateAgentName = isAnonymous ? 'AGENT' : rawName;

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
    if (score >= 2640) return { title: 'EXPERT SYMBIOSE', icon: <Droplets className="w-8 h-8 text-cyan-400" />, color: 'text-cyan-400', hex: '#22d3ee', bg: 'bg-cyan-400/10', border: 'border-cyan-500/50' };
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
    hidden: { opacity: 0, y: 14 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.42, 
        ease: EASE_OUT_EXPO,
        staggerChildren: 0.06,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.34, ease: EASE_OUT_EXPO },
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border p-4 sm:p-8 sm:rounded-3xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)] max-w-3xl mx-auto text-center backdrop-blur-xl relative overflow-hidden"
    >
      <div className="hidden sm:block absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Compact Victory Header */}
      <motion.div variants={itemVariants} className="flex flex-col items-center mb-4">
        <div className="relative mb-3">
          <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-400 drop-shadow-[0_0_14px_rgba(250,204,21,0.45)]" />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg border-2 border-slate-900">
            <Droplets className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-[0.14em]">
          Mission Accomplie
        </h1>
        <p className="text-emerald-400/85 font-mono text-[11px] sm:text-xs tracking-[0.2em] mt-1">
          OPÉRATION « AQUA IA » · {greetingAgent.toUpperCase()}
        </p>

        {completedBonus.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2.5">
            {completedBonus.includes('gpu_cost') && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                <Star className="w-3 h-3 fill-current shrink-0" />
                Architecte Matériel &amp; GPU
              </span>
            )}
            {completedBonus.includes('rebound') && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                <Star className="w-3 h-3 fill-current shrink-0" />
                Veilleur Anti-Rebond
              </span>
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-5 text-left">
        <NaiaDialogue
          hideHintButton
          message={`Mission accomplie, ${greetingAgent}. Les réserves d'eau potable de la ville remontent déjà : désormais encadrée par la charte municipale et basculée en mode Symbiose, HYDRA protège les réseaux hydriques au lieu de les épuiser.`}
          emotion="happy"
        />
      </motion.div>

      {/* 4 KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 max-w-2xl mx-auto mb-5">
        {[
          { icon: Clock, label: 'Temps', value: formatTime(timeTaken), color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
          { icon: Star, label: 'Score', value: score, sublabel: mistakeCount === 0 ? 'Sans erreur' : `${mistakeCount} erreur${mistakeCount > 1 ? 's' : ''}`, sublabelClass: 'text-yellow-300/75', color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30' },
          { icon: Droplets, label: 'Eau Sauvée', value: `${waterSaved}%`, sublabel: evaluation?.waterSaved ? `${evaluation.waterSaved} L/an` : undefined, sublabelClass: 'text-cyan-300/75', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30' },
          { icon: Award, label: 'Grade', value: grade.title, color: grade.color, bg: grade.bg, border: grade.border }
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`${stat.bg} ${stat.border} border p-3 rounded-xl flex flex-col items-center justify-center`}
          >
            <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mb-1`} />
            <div className={`text-sm sm:text-base font-mono font-bold ${stat.color} truncate max-w-full`}>{stat.value}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{stat.label}</div>
            {stat.sublabel && (
              <div className={`text-[10px] font-mono mt-0.5 ${stat.sublabelClass}`}>{stat.sublabel}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Priority Export & Replay Actions (immediately accessible above the fold) */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5 justify-center mb-6">
        <button
          type="button"
          onClick={() => downloadFullCertificate('dark')}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
            isDownloading
              ? 'bg-emerald-600/50 text-white/50 cursor-wait border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
          }`}
        >
          {downloadingMode === 'dark' ? (
            <div className="w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{downloadingMode === 'dark' ? 'GÉNÉRATION…' : 'DOSSIER A4 (ÉCRAN / ENT)'}</span>
        </button>

        <button
          type="button"
          onClick={() => downloadFullCertificate('light')}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
            isDownloading
              ? 'bg-slate-800/60 text-slate-400 cursor-wait border-slate-700'
              : 'bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-200 border-cyan-500/40 hover:border-cyan-400/70'
          }`}
          title="Version fond clair économe en encre pour impression laser N&B au collège"
        >
          {downloadingMode === 'light' ? (
            <div className="w-4 h-4 border-[3px] border-cyan-300/30 border-t-cyan-200 rounded-full animate-spin" />
          ) : (
            <Printer className="w-4 h-4 text-cyan-300" />
          )}
          <span>{downloadingMode === 'light' ? 'GÉNÉRATION…' : 'ÉCO-IMPRESSION (CLAIR)'}</span>
        </button>

        <button
          type="button"
          onClick={() => onRestart(nickname)}
          className="flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all border border-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>REJOUER</span>
        </button>
      </motion.div>

      {downloadError && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-2.5 mb-5 max-w-xl mx-auto">
          {downloadError}
        </p>
      )}

      {/* Clean 3-Tab Post-Game Explorer */}
      <div className="max-w-2xl mx-auto text-left">
        <div
          role="tablist"
          aria-label="Sections du dossier final"
          className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 mb-4"
        >
          {[
            { id: 'dossier' as const, label: 'Mon Brevet', icon: FlaskConical },
            { id: 'bonus' as const, label: `Défis Bonus (${completedBonus.length}/2)`, icon: Sparkles },
            { id: 'synthese' as const, label: "L'Essentiel", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="outroActiveTab"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-400/40"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0 relative z-10" />
                <span className="truncate relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'dossier' && (
          <motion.div key="outro-dossier" {...TAB_PANEL_MOTION} className="space-y-4">
            {evaluation && (
              <div className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-yellow-400" /> Brevet Innovation Lab
                  </span>
                  <span className="text-xs font-mono font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full">
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
                          ? 'w-32 h-32 object-contain bg-slate-950 rounded-xl border border-cyan-500/20 shrink-0'
                          : 'w-full sm:w-32 h-32 object-cover rounded-xl border border-cyan-500/20 shrink-0'
                      }
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base sm:text-lg truncate">{evaluation.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{evaluation.description}</p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                        {evaluation.waterSaved} L/an économisés
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                        Impact {evaluation.impact}/10
                      </span>
                      {typeof labWaterMl === 'number' && labWaterMl > 0 && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono">
                          Labo : {labWaterMl.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leaderboard && leaderboard.length >= 2 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-yellow-400 font-mono font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Meilleurs scores sur ce poste
                </h3>
                <div className="space-y-1.5">
                  {leaderboard.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center px-3.5 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800/70 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono text-xs w-4">{idx + 1}.</span>
                        <span className={`font-semibold ${entry.name === (rawName || 'Agent Anonyme') ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-yellow-400">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!evaluation && (!leaderboard || leaderboard.length < 2) && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
                Aucun brevet enregistré sur cette session. Explorez les <strong className="text-emerald-300">Défis Bonus</strong> ou la synthèse <strong className="text-cyan-300">L'Essentiel</strong> ci-dessus.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'bonus' && (
          <motion.div key="outro-bonus" {...TAB_PANEL_MOTION}>
            <BonusMissions
              completedMissions={completedBonus}
              onCompleteMission={handleCompleteBonus}
            />
          </motion.div>
        )}

        {activeTab === 'synthese' && (
          <motion.div key="outro-synthese" {...TAB_PANEL_MOTION} className="bg-slate-950/75 p-5 rounded-2xl border border-slate-800 font-sans text-slate-300">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0 text-red-400 font-mono font-black text-sm">1</div>
                <div>
                  <p className="font-bold text-white text-sm">L'<TechTerm term="IA" /> a une empreinte réelle</p>
                  <p className="text-xs mt-1 leading-relaxed text-slate-400">Les <TechTerm term="Datacenter">datacenters</TechTerm> consomment eau (<TechTerm term="Refroidissement" />) et électricité. L'effet volume pèse sur les ressources.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 font-mono font-black text-sm">2</div>
                <div>
                  <p className="font-bold text-white text-sm">L'optimisation change la donne</p>
                  <p className="text-xs mt-1 leading-relaxed text-slate-400">Climat froid (Free Cooling), calculs aux heures bas-carbone et récupération de chaleur réduisent drastiquement l'impact.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 text-emerald-400 font-mono font-black text-sm">3</div>
                <div>
                  <p className="font-bold text-white text-sm">Matériel &amp; hygiène des données</p>
                  <p className="text-xs mt-1 leading-relaxed text-slate-400">Réparer plutôt que jeter et nettoyer les données mortes évite des calculs inutiles et économise l'eau de fabrication.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0 text-purple-400 font-mono font-black text-sm">4</div>
                <div>
                  <p className="font-bold text-white text-sm">Sobriété, équité et règles</p>
                  <p className="text-xs mt-1 leading-relaxed text-slate-400">Choisir le bon outil pour le bon usage, corriger les biais et fixer des règles contraignantes protège les ressources.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

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
                <p className="text-emerald-500/70 font-mono text-sm tracking-[0.2em] font-bold uppercase ml-[3.75rem]">MISSION AQUA IA // SYMBIOSE_{currentYear}</p>
              </div>
            </div>

            {/* Agent Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0" />
                <h2 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                   <BadgeCheck className="w-4 h-4" /> IDENTITÉ DE L'AGENT
                </h2>
                <div className="text-3xl font-black mb-1 uppercase tracking-tight relative z-10 text-white drop-shadow-md">{certificateAgentName}</div>
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
                  <p className="text-[10px] text-slate-400 pl-2 leading-tight">Gestion du cycle de vie du matériel et valorisation de la chaleur fatale.</p>
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
                © {currentYear} Mission Aqua IA · Constellation Echo
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
