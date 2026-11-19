import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Clock,
  BookOpen,
  MessageSquare,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface TeacherKitModalProps {
  onClose: () => void;
}

type KitTab = 'deroule' | 'programmes' | 'debat';

interface CurriculumRow {
  discipline: string;
  cycle: string;
  notions: string;
  levels: string;
}

interface DebatePrompt {
  id: string;
  tag: string;
  levels: string;
  question: string;
  keyPoints: string[];
}

const LOGISTICS_TIPS = [
  'Binômes conseillés (2 élèves/poste) pour favoriser la verbalisation et l’entraide.',
  'Son coupé ou casques : la voix NAIA est facultative, tout est lisible à l’écran.',
  'Bouton « Pause » en haut de l’écran pour figer le chrono et masquer le jeu lors d’un point classe.',
  'Sauvegarde automatique sur le poste : reprise exacte possible d’une séance à l’autre.',
];

const CURRICULUM_ROWS: CurriculumRow[] = [
  {
    discipline: 'Mathématiques',
    cycle: 'Cycle 4',
    notions: 'Conversions (L/mL), proportionnalité, combinaisons de débits, lecture de courbes, arbitrage multi-contraintes.',
    levels: 'N1, N2, N5, N12',
  },
  {
    discipline: 'Technologie',
    cycle: 'Cycle 4',
    notions: 'Chaîne d’énergie & refroidissement (PUE, Free Cooling), diagnostic matériel & cycle de vie (DEEE), boucle fermée, algorithme si / sinon.',
    levels: 'N4, N7, N8, N11, Bonus 1',
  },
  {
    discipline: 'SVT',
    cycle: 'Cycle 4',
    notions: 'Gestion de la ressource en eau et fuites réseau, mix électrique & intensité carbone, préservation des milieux, sobriété.',
    levels: 'N3, N5, N8, N12',
  },
  {
    discipline: 'EMI / EMC',
    cycle: 'Cycle 4 & Lycée',
    notions: 'Biais de représentativité dans les jeux de données, repérage du greenwashing vs obligations mesurables, esprit critique face à l’IA.',
    levels: 'N9, N10, N13, Bonus 2',
  },
  {
    discipline: 'SNT',
    cycle: 'Seconde',
    notions: 'Données structurées (tri, données mortes, équité), impact environnemental des datacenters & du cloud, sobriété algorithmique.',
    levels: 'N4, N6, N9, N11',
  },
  {
    discipline: 'Pix',
    cycle: 'Numérique responsable',
    notions: '4.3 Protéger la santé, le bien-être et l’environnement (cycle de vie, sobriété eau/CO₂), 1.1–1.2 Choix d’outil adapté & données, 3.4 Programmer.',
    levels: 'Parcours complet',
  },
];

const DEBATE_PROMPTS: DebatePrompt[] = [
  {
    id: 'biais',
    tag: 'Biais des données',
    levels: 'Niveau 9 (Quartier Nord)',
    question: '« Une IA qui calcule très vite est-elle forcément juste ? Pourquoi HYDRA a-t-elle "oublié" le Quartier Nord ? »',
    keyPoints: [
      'L’IA reproduit les angles morts de ses données (biais de représentativité) : ajouter des GPU n’efface jamais un biais.',
      'Copier la moyenne du Centre-Ville masque les besoins réels d’un autre territoire : il faut collecter des données terrain équilibrées.',
    ],
  },
  {
    id: 'greenwashing',
    tag: 'Greenwashing vs règles',
    levels: 'Niveau 10 (Charte éthique)',
    question: '« Planter des arbres ou promettre la "neutralité" suffit-il à rendre un datacenter écologique ? »',
    keyPoints: [
      'Distinction clé : promesse vague ou compensation symbolique ≠ obligation vérifiable (transparence eau, récupération chaleur fatale).',
      'Interroger les critères d’une vraie règle : chiffrée, contrôlable et appliquée avant le déploiement.',
    ],
  },
  {
    id: 'sobriete',
    tag: 'Effet volume & usage',
    levels: 'Niveaux 1, 6 & 13 (Prompt sobre)',
    question: '« Si une requête IA ne coûte que quelques gouttes, pourquoi est-ce un sujet ? Quand vaut-il mieux ne PAS utiliser l’IA ? »',
    keyPoints: [
      'L’impact vient de l’effet volume (milliards de requêtes) et de l’eau ultra-pure mobilisée pour fabriquer les puces (Bonus 1).',
      'Réflexe sobre : moteur de recherche ou règle simple quand l’IA n’apporte rien ; sinon, 1 prompt clair et structuré.',
    ],
  },
  {
    id: 'rebond',
    tag: 'Effet rebond & choix collectifs',
    levels: 'Niveau 12 & Bonus 2',
    question: '« Si l’IA devient 2 fois plus économe par requête, consommera-t-on forcément moins d’eau au total ? »',
    keyPoints: [
      'Effet rebond : un outil plus efficace mais utilisé 5 fois plus finit par consommer davantage.',
      'La sobriété est aussi un arbitrage d’utilité sociale : prioriser climat et services essentiels avant le superflu.',
    ],
  },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrintableHtml(): string {
  const tipsHtml = LOGISTICS_TIPS.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  const curriculumHtml = CURRICULUM_ROWS.map(
    (row) => `
      <tr>
        <td><strong>${escapeHtml(row.discipline)}</strong><br/><span class="muted">${escapeHtml(row.cycle)}</span></td>
        <td>${escapeHtml(row.notions)}</td>
        <td class="nowrap">${escapeHtml(row.levels)}</td>
      </tr>`
  ).join('');
  const debateHtml = DEBATE_PROMPTS.map(
    (item) => `
      <div class="debate-card">
        <div class="debate-meta"><strong>${escapeHtml(item.tag)}</strong> · <span>${escapeHtml(item.levels)}</span></div>
        <p class="debate-q">${escapeHtml(item.question)}</p>
        <ul>${item.keyPoints.map((kp) => `<li>${escapeHtml(kp)}</li>`).join('')}</ul>
      </div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Mission Aqua-IA · Kit Enseignant</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      font-size: 10.5px;
      line-height: 1.42;
    }
    header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    header h1 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }
    header span {
      font-size: 10px;
      color: #475569;
      font-weight: 600;
    }
    h2 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0f766e;
      margin: 12px 0 6px;
      border-left: 3px solid #0f766e;
      padding-left: 7px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .box h3 {
      margin: 0 0 4px;
      font-size: 11px;
      color: #1e293b;
    }
    ul {
      margin: 4px 0 0;
      padding-left: 16px;
    }
    li { margin-bottom: 2.5px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    .muted { color: #64748b; font-size: 9.5px; }
    .nowrap { white-space: nowrap; font-weight: 600; color: #0f766e; }
    .debate-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .debate-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 9px;
      break-inside: avoid;
    }
    .debate-meta {
      font-size: 9.5px;
      color: #4338ca;
      margin-bottom: 3px;
    }
    .debate-q {
      margin: 0 0 4px;
      font-weight: 700;
      color: #0f172a;
    }
    footer {
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <header>
    <h1>Mission Aqua-IA · Kit Enseignant</h1>
    <span>Collège (Cycle 4) &amp; Seconde SNT · Fiche sans corrigés</span>
  </header>

  <h2>1. Déroulé de séance (1 h ou 2 h)</h2>
  <div class="grid-2">
    <div class="box">
      <h3>1 séance (55 min · Express)</h3>
      <ul>
        <li><strong>5 min :</strong> Lancement (binômes, objectif et règles du jeu).</li>
        <li><strong>40 min :</strong> Mission en autonomie (<strong>Niveaux 1 à 10</strong>, ou N12 pour les plus rapides).</li>
        <li><strong>10 min :</strong> Débrief oral collectif (2 questions ci-dessous).</li>
        <li><em>Option :</em> Niveau 13 (Innovation Lab) en atelier court ou prolongement.</li>
      </ul>
    </div>
    <div class="box">
      <h3>2 séances (2 × 55 min · Recommandé)</h3>
      <ul>
        <li><strong>Séance 1 :</strong> Lancement (5 min) · <strong>Niveaux 1 à 10</strong> (40 min) · mini-bilan biais &amp; greenwashing (10 min).</li>
        <li><strong>Séance 2 :</strong> Reprise sur le même poste (5 min) · <strong>Niveaux 11 à 13</strong> + bonus + dossier A4 (35 min) · débat oral (15 min).</li>
        <li><em>Coupure naturelle :</em> fin du Niveau 10 (sauvegarde automatique sur le poste).</li>
      </ul>
    </div>
  </div>
  <div class="box">
    <h3>Repères salle informatique</h3>
    <ul>${tipsHtml}</ul>
  </div>

  <h2>2. Ancrage programmes &amp; Pix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Discipline / Cadre</th>
        <th>Notions &amp; compétences mobilisées</th>
        <th style="width: 18%;">Niveaux</th>
      </tr>
    </thead>
    <tbody>${curriculumHtml}</tbody>
  </table>

  <h2>3. Pistes de débat oral (10–15 min)</h2>
  <div class="debate-grid">${debateHtml}</div>

  <footer>
    <span>Mission Aqua-IA · Escape game éducatif IA &amp; Eau</span>
    <span>Fiche sans corrigés : réponses protégées dans le Mode Enseignant (Alt+Shift+P ou double-clic en pied de page).</span>
  </footer>
</body>
</html>`;
}

export default function TeacherKitModal({ onClose }: TeacherKitModalProps) {
  const [activeTab, setActiveTab] = useState<KitTab>('deroule');

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
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-kit-title"
      className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/25 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)]"
      >
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 id="teacher-kit-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                KIT ENSEIGNANT
              </h2>
              <p className="text-xs text-slate-400">
                Fiche express pour préparer et débriefer Mission Aqua-IA en classe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-colors"
              title="Imprimer ou enregistrer en PDF (fiche A4 complète)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le kit enseignant"
              className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-5 py-2.5 border-b border-white/10 bg-slate-950/40 shrink-0 overflow-x-auto" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'deroule'}
            onClick={() => setActiveTab('deroule')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'deroule'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Déroulé 1 h / 2 h</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'programmes'}
            onClick={() => setActiveTab('programmes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'programmes'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Programmes &amp; Pix</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'debat'}
            onClick={() => setActiveTab('debat')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'debat'
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Débat oral (10–15 min)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'deroule' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-cyan-300">1 séance (55 min)</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                      Express
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <li className="flex items-baseline gap-2.5">
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[11px] shrink-0 w-14 text-center">
                        5 min
                      </span>
                      <span>Lancement : binômes, objectif et règles du jeu.</span>
                    </li>
                    <li className="flex items-baseline gap-2.5">
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[11px] shrink-0 w-14 text-center">
                        40 min
                      </span>
                      <span>Mission en autonomie : <strong className="text-white">Niveaux 1 à 10</strong> (ou N12 pour les plus rapides).</span>
                    </li>
                    <li className="flex items-baseline gap-2.5">
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[11px] shrink-0 w-14 text-center">
                        10 min
                      </span>
                      <span>Débrief oral collectif (2 questions dans l’onglet Débat).</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic pt-2 mt-auto border-t border-white/5">
                    Prolongement : le Niveau 13 (Innovation Lab) peut se faire lors d’un atelier court.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-emerald-500/25 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-emerald-300">2 séances (2 × 55 min)</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                      Recommandé
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                    <div className="bg-slate-900/70 border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="font-bold text-emerald-200">Séance 1 · Actes I &amp; II</div>
                      <p>
                        Lancement <span className="font-mono text-slate-400">(5 min)</span> · <strong className="text-white">Niveaux 1 à 10</strong> <span className="font-mono text-slate-400">(40 min)</span> · mini-bilan biais &amp; greenwashing <span className="font-mono text-slate-400">(10 min)</span>.
                      </p>
                    </div>
                    <div className="bg-slate-900/70 border border-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="font-bold text-emerald-200">Séance 2 · Acte III &amp; Débat</div>
                      <p>
                        Reprise <span className="font-mono text-slate-400">(5 min)</span> · <strong className="text-white">Niveaux 11 à 13</strong> + bonus + dossier A4 <span className="font-mono text-slate-400">(35 min)</span> · débat oral <span className="font-mono text-slate-400">(15 min)</span>.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic pt-2 mt-auto border-t border-white/5">
                    Coupure naturelle : fin du Niveau 10 (progression sauvegardée sur le poste).
                  </p>
                </div>
              </div>

              <div className="bg-indigo-950/25 border border-indigo-500/25 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5">
                  Repères pratiques en salle informatique
                </h3>
                <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300 leading-relaxed">
                  {LOGISTICS_TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {activeTab === 'programmes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Le scénario croise sciences, technologie et esprit critique du <strong className="text-white">Cycle 4 (5e–3e)</strong> jusqu’à la <strong className="text-white">Seconde (SNT)</strong>. Idéal en EPI ou en co-animation.
              </p>

              <div className="border border-white/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                      <th className="py-2.5 px-3 font-bold">Discipline / Cadre</th>
                      <th className="py-2.5 px-3 font-bold">Notions &amp; compétences mobilisées</th>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">Niveaux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {CURRICULUM_ROWS.map((row) => (
                      <tr key={row.discipline} className="bg-slate-950/35 hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-white">{row.discipline}</div>
                          <div className="text-[11px] text-slate-400">{row.cycle}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 leading-relaxed align-top">
                          {row.notions}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-cyan-300 whitespace-nowrap align-top">
                          {row.levels}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'debat' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                4 amorces prêtes à l’emploi pour transformer la partie en temps de recul critique (choisir <strong className="text-white">2 questions en format 1 h</strong>, ou les 4 en séance 2).
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {DEBATE_PROMPTS.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/60 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                        {item.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.levels}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {item.question}
                    </p>
                    <ul className="space-y-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-2">
                      {item.keyPoints.map((kp) => (
                        <li key={kp} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-white/10 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Fiche sans corrigés : les réponses restent protégées dans le Mode Enseignant.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
