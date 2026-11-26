import {
  LEVEL_NAMES,
  MISSION_ACTS,
  MISSION_DURATION_MINUTES,
  MAX_LIVES,
  HEART_COST_POINTS,
  LOCKOUT_RESTORE_LIVES,
  MID_ACT_TWO_HEAL_LEVEL,
} from '../constants';

export type SessionFormatId = 'two_sessions' | 'one_session';

export interface SessionStep {
  duration: string;
  label: string;
  detail: string;
}

export interface SessionPlan {
  id: SessionFormatId;
  tabLabel: string;
  title: string;
  subtitle: string;
  recommended?: boolean;
  steps: SessionStep[];
  footnote: string;
}

export interface QuickEssential {
  id: string;
  title: string;
  summary: string;
}

export interface ClassroomGuide {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

export type LevelRefCode =
  | 'N1'
  | 'N2'
  | 'N3'
  | 'N4'
  | 'N5'
  | 'N6'
  | 'N7'
  | 'N8'
  | 'N9'
  | 'N10'
  | 'N11'
  | 'N12'
  | 'N13'
  | 'B1'
  | 'B2'
  | 'ALL';

export interface ResolvedLevelRef {
  code: LevelRefCode;
  shortLabel: string;
  title: string;
  context: string;
}

export interface CurriculumRow {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  details: string[];
  levelRefs: LevelRefCode[];
}

export interface InterdisciplinaryBridge {
  id: string;
  discipline: string;
  cycle: string;
  summary: string;
  levelRefs: LevelRefCode[];
}

export interface DebatePrompt {
  id: string;
  timing: 'Dès 1 h' | 'Dès 1 h ou 2 h' | 'Format 2 h';
  tag: string;
  levelRefs: LevelRefCode[];
  question: string;
  keyPoints: string[];
}

const BONUS_REF_INFO: Record<'B1' | 'B2', { shortLabel: string; title: string; context: string }> = {
  B1: {
    shortLabel: 'Bonus 1',
    title: 'Coût des puces (GPU) & eau ultra-pure',
    context: 'Défi bonus (écran final) · Fabrication matérielle et mutualisation',
  },
  B2: {
    shortLabel: 'Bonus 2',
    title: 'Effet rebond (Paradoxe de Jevons)',
    context: 'Défi bonus (écran final) · Explosion des volumes et plafonds',
  },
};

export function resolveLevelRef(code: LevelRefCode): ResolvedLevelRef {
  if (code === 'ALL') {
    return {
      code,
      shortLabel: 'N1–N13',
      title: 'Parcours complet',
      context: 'Les 13 niveaux principaux + les 2 défis bonus finaux',
    };
  }
  if (code === 'B1' || code === 'B2') {
    return {
      code,
      ...BONUS_REF_INFO[code],
    };
  }
  const num = Number(code.slice(1));
  const act = MISSION_ACTS.find((a) => num >= a.startLevel && num <= a.endLevel);
  const name = LEVEL_NAMES[num] ?? `Niveau ${num}`;
  return {
    code,
    shortLabel: code,
    title: `Niveau ${num} : ${name}`,
    context: act ? `${act.label} · ${act.title}` : 'Parcours principal',
  };
}

export const SESSION_PLANS: Record<SessionFormatId, SessionPlan> = {
  two_sessions: {
    id: 'two_sessions',
    tabLabel: '2 séances (2 × 55 min)',
    title: 'Parcours complet en 2 séances',
    subtitle: 'Recommandé · 55 à 75 min de jeu + débat approfondi',
    recommended: true,
    steps: [
      {
        duration: 'Séance 1 · 55 min',
        label: 'Actes I & II (Niveaux 1 à 10)',
        detail:
          '5 min de lancement en binômes · 40 min d’autonomie (N1 à N10) · 10 min de mini-bilan sur les biais (N9) et le greenwashing (N10).',
      },
      {
        duration: 'Séance 2 · 55 min',
        label: 'Acte III, Défis bonus & Débat',
        detail:
          '5 min de reprise sur le même poste · 35 min pour N11 à N13, défis bonus et export du dossier A4 · 15 min de débat oral collectif.',
      },
    ],
    footnote:
      'Coupure naturelle conseillée à la fin du Niveau 10 : la progression est sauvegardée automatiquement sur le poste.',
  },
  one_session: {
    id: 'one_session',
    tabLabel: '1 séance (55 min)',
    title: 'Format express en 1 séance',
    subtitle: 'Découverte ciblée · Actes I & II + débrief rapide',
    steps: [
      {
        duration: '5 min',
        label: 'Lancement',
        detail: 'Mise en binômes, présentation du scénario HYDRA et des repères à l’écran.',
      },
      {
        duration: '40 min',
        label: 'Mission en autonomie',
        detail: 'Objectif Niveaux 1 à 10 (et jusqu’au Niveau 12 pour les binômes les plus rapides).',
      },
      {
        duration: '10 min',
        label: 'Débrief oral collectif',
        detail: 'Animer 2 questions « Dès 1 h » (onglet Débat) pour formaliser les notions clés.',
      },
    ],
    footnote:
      'Prolongement optionnel : le Niveau 13 (Innovation Lab, chrono en pause) peut être repris en atelier court.',
  },
};

export const QUICK_ESSENTIALS: QuickEssential[] = [
  {
    id: 'pairs',
    title: 'Binômes conseillés',
    summary: '2 élèves par poste pour stimuler l’argumentation et la lecture active.',
  },
  {
    id: 'timer',
    title: `Chrono ${MISSION_DURATION_MINUTES} min non bloquant`,
    summary: 'Prolongation libre après 00:00 ; pause auto pendant les transitions et le N13.',
  },
  {
    id: 'audio',
    title: 'Son facultatif',
    summary: 'Casques ou mode muet : tout ce que dit NAÏA reste lisible à l’écran.',
  },
  {
    id: 'save',
    title: 'Pause & sauvegarde locale',
    summary: 'Le bouton Pause masque le jeu pour un point classe ; reprise exacte sur le même poste.',
  },
];

export const CLASSROOM_GUIDES: ClassroomGuide[] = [
  {
    id: 'anti-block',
    title: 'Vies, indices gratuits & filet anti-blocage',
    summary: 'Aucun élève ne repart au Niveau 1 en milieu de séance.',
    bullets: [
      `${MAX_LIVES} vies au départ, avec indices méthodologiques gratuits dans NAÏA à chaque niveau et achat d’une vie possible (${HEART_COST_POINTS} pts).`,
      `1 Seconde chance par partie : reprise immédiate sur le niveau en cours avec ${LOCKOUT_RESTORE_LIVES}/${MAX_LIVES} vies.`,
      `Points de contrôle automatiques à l’entrée de l’Acte II (N4) et de l’Acte III (N11) avec restauration ${MAX_LIVES}/${MAX_LIVES} vies, plus +1 vie au Niveau ${MID_ACT_TWO_HEAL_LEVEL}.`,
      `Chrono objectif ${MISSION_DURATION_MINUTES} min non bloquant (N1 à N12) : au-delà de 00:00, la partie bascule en prolongation libre sans Game Over.`,
    ],
  },
  {
    id: 'acts-overview',
    title: 'Vue d’ensemble des 3 actes (sans corrigés)',
    summary: 'Repérer rapidement ce que travaillent les élèves du N1 au N13.',
    bullets: [
      ...MISSION_ACTS.map((act) => {
        const names: string[] = [];
        for (let lvl = act.startLevel; lvl <= act.endLevel; lvl++) {
          names.push(`N${lvl} ${LEVEL_NAMES[lvl]}`);
        }
        return `${act.label} — ${act.title} (N${act.startLevel}–N${act.endLevel}) : ${names.join(' · ')}.`;
      }),
      'Écran final (chrono arrêté) : 2 défis bonus (Coût des puces GPU & Effet rebond) + attestation / dossier A4.',
    ],
  },
  {
    id: 'logistics',
    title: 'Salle informatique, Niveau 13 & impression',
    summary: 'Détails pratiques pour préparer les postes et l’export élève.',
    bullets: [
      'En format 2 séances, replacer chaque binôme sur le même ordinateur (sauvegarde dans le navigateur du poste).',
      'Le bouton Pause (barre supérieure, N1 à N12) suspend le chrono et masque l’écran pour capter l’attention.',
      'Niveau 13 (Innovation Lab) : chrono automatiquement en pause ; fonctionne avec évaluation locale de secours et visuel SVG sobre si la génération IA est indisponible.',
      'Attestation / dossier final : export PNG au format A4 disponible en mode sombre ou en mode clair « éco-encre » pour l’impression.',
      'Raccourcis enseignant : Alt+Shift+P ou double-clic sur le crédit en pied de page (ce kit reste accessible sans mot de passe).',
    ],
  },
];

export const TECHNO_CURRICULUM_ROWS: CurriculumRow[] = [
  {
    id: 'techno-usages',
    title: 'Usages, cycle de vie & impacts environnementaux',
    subtitle: 'Technologie · Cycle 4',
    summary: 'Empreinte hydrique, réparabilité (DEEE), biais de données & cadre éthique.',
    details: [
      'Mesurer l’impact environnemental d’un service numérique : eau de refroidissement, gravure des puces (GPU) et effet rebond (N1, Bonus 1, Bonus 2).',
      'Prolonger la durée de vie d’un équipement : diagnostic de panne, réparabilité et recyclage DEEE (N7).',
      'Analyser les enjeux sociétaux : biais de représentativité, greenwashing et usage raisonné de l’IA (N9, N10, N13).',
    ],
    levelRefs: ['N1', 'N7', 'N9', 'N10', 'N13', 'B1', 'B2'],
  },
  {
    id: 'techno-systemes',
    title: 'Fonctionnement des systèmes, énergie & capteurs',
    subtitle: 'Technologie · Cycle 4',
    summary: 'Chaîne d’énergie, refroidissement (PUE), capteurs & boucle thermique fermée.',
    details: [
      'Analyser un système technique et repérer une anomalie grâce aux capteurs de débit et de pression (N2, N3).',
      'Optimiser la chaîne d’énergie d’un datacenter : latence, PUE, Free Cooling et intensité carbone horaire (N4, N5).',
      'Modéliser un circuit thermique en boucle fermée valorisant la chaleur fatale (N8).',
    ],
    levelRefs: ['N2', 'N3', 'N4', 'N5', 'N8'],
  },
  {
    id: 'techno-conception',
    title: 'Algorithmique, sobriété logicielle & innovation',
    subtitle: 'Technologie · Cycle 4',
    summary: 'Architecture logicielle sobre, algorithme si / sinon, arbitrages & prototype.',
    details: [
      'Choisir une architecture logicielle proportionnée au besoin : règles simples, modèle spécialisé ou LLM (N6).',
      'Compléter et tester un algorithme conditionnel (si / sinon, opérateur OU) piloté par capteurs (N11).',
      'Arbitrer sous contraintes multiples (eau/puissance) et concevoir une solution éco-innovante (N12, N13).',
    ],
    levelRefs: ['N6', 'N11', 'N12', 'N13'],
  },
  {
    id: 'pix',
    title: 'Pix · Numérique responsable',
    subtitle: 'Compétences numériques',
    summary: '4.3 Environnement, 1.1–1.2 Recherche & données, 3.4 Programmer.',
    details: [
      '4.3 Protéger la santé, le bien-être et l’environnement : cycle de vie, sobriété eau/CO₂ et effet rebond.',
      '1.1 & 1.2 Mener une recherche et gérer des données : choisir le bon outil, trier les données et repérer les biais.',
      '3.4 Programmer : compléter et valider un algorithme conditionnel (N11).',
    ],
    levelRefs: ['ALL'],
  },
];

export const INTERDISCIPLINARY_BRIDGES: InterdisciplinaryBridge[] = [
  {
    id: 'maths',
    discipline: 'Mathématiques',
    cycle: 'Cycle 4',
    summary: 'Conversions (L/mL), combinaisons de débits, lecture de courbes & moyennes, arbitrages multi-contraintes.',
    levelRefs: ['N1', 'N2', 'N5', 'N12'],
  },
  {
    id: 'svt',
    discipline: 'SVT',
    cycle: 'Cycle 4',
    summary: 'Gestion de la ressource en eau et fuites réseau, mix électrique & intensité carbone, préservation des milieux.',
    levelRefs: ['N3', 'N5', 'N8', 'N12'],
  },
  {
    id: 'emi-emc',
    discipline: 'EMI / EMC',
    cycle: 'Cycle 4 & Lycée',
    summary: 'Esprit critique face à l’IA : biais de représentativité, repérage du greenwashing et choix collectifs.',
    levelRefs: ['N9', 'N10', 'N13', 'B2'],
  },
  {
    id: 'snt',
    discipline: 'SNT',
    cycle: 'Seconde',
    summary: 'Données structurées, impact du cloud et des datacenters, sobriété algorithmique et passage Scratch → Python.',
    levelRefs: ['N4', 'N6', 'N9', 'N11', 'B2'],
  },
];

export const DEBATE_PROMPTS: DebatePrompt[] = [
  {
    id: 'biais',
    timing: 'Dès 1 h',
    tag: 'Biais des données',
    levelRefs: ['N9'],
    question:
      '« Une IA qui calcule très vite est-elle forcément juste ? Pourquoi HYDRA a-t-elle “oublié” le Quartier Nord ? »',
    keyPoints: [
      'L’IA reproduit les angles morts de ses données (biais de représentativité) : ajouter des GPU accélère une décision injuste sans la corriger.',
      'Copier la moyenne du Centre-Ville masque les besoins réels d’un autre territoire : il faut collecter des relevés terrain équilibrés.',
    ],
  },
  {
    id: 'greenwashing',
    timing: 'Dès 1 h',
    tag: 'Greenwashing vs règles',
    levelRefs: ['N10'],
    question:
      '« Planter des arbres ailleurs ou afficher un label “Éco-IA” auto-déclaré suffit-il à rendre un datacenter écologique ? »',
    keyPoints: [
      'Distinction clé : compensation symbolique ou promesse sans contrôle ≠ obligation locale vérifiable (transparence eau, chaleur fatale).',
      'Interroger les critères d’une vraie règle : chiffrée, contrôlable et appliquée avant tout déploiement.',
    ],
  },
  {
    id: 'sobriete',
    timing: 'Dès 1 h ou 2 h',
    tag: 'Effet volume & usage sobre',
    levelRefs: ['N1', 'N6', 'N13', 'B1'],
    question:
      '« Si une requête IA ne coûte que quelques millilitres, pourquoi est-ce un sujet ? Quand vaut-il mieux ne PAS utiliser l’IA ? »',
    keyPoints: [
      'L’impact vient de l’effet volume (milliards de requêtes par jour) et de l’eau ultra-pure mobilisée pour graver les puces (Bonus 1).',
      'Réflexe sobre : moteur de recherche ou règle simple quand l’IA n’apporte rien ; sinon, 1 prompt clair et structuré en un seul envoi.',
    ],
  },
  {
    id: 'rebond',
    timing: 'Format 2 h',
    tag: 'Effet rebond & arbitrages',
    levelRefs: ['N12', 'B2'],
    question:
      '« Si une IA consomme 5 fois moins d’eau par requête, consommera-t-on forcément moins d’eau au total ? »',
    keyPoints: [
      'Effet rebond (paradoxe de Jevons) : si la baisse du coût unitaire multiplie les usages par 10, la consommation globale double.',
      'La sobriété demande aussi des plafonds globaux et des choix collectifs : prioriser climat et services essentiels avant le superflu.',
    ],
  },
];

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPrintableHtml(): string {
  const oneSessionHtml = SESSION_PLANS.one_session.steps
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.duration)} · ${escapeHtml(s.label)} :</strong> ${escapeHtml(s.detail)}</li>`
    )
    .join('');

  const twoSessionHtml = SESSION_PLANS.two_sessions.steps
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.duration)} · ${escapeHtml(s.label)} :</strong> ${escapeHtml(s.detail)}</li>`
    )
    .join('');

  const essentialsHtml = QUICK_ESSENTIALS.map(
    (item) => `<li><strong>${escapeHtml(item.title)} :</strong> ${escapeHtml(item.summary)}</li>`
  ).join('');

  const antiBlockHtml = CLASSROOM_GUIDES[0].bullets
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('');

  const curriculumHtml = TECHNO_CURRICULUM_ROWS.map((row) => {
    const levelsLabel = row.levelRefs.map((ref) => resolveLevelRef(ref).shortLabel).join(', ');
    return `
      <tr>
        <td><strong>${escapeHtml(row.title)}</strong><br/><span class="muted">${escapeHtml(row.subtitle)}</span></td>
        <td>${escapeHtml(row.summary)}<ul class="compact-list">${row.details
          .map((d) => `<li>${escapeHtml(d)}</li>`)
          .join('')}</ul></td>
        <td class="nowrap">${escapeHtml(levelsLabel)}</td>
      </tr>`;
  }).join('');

  const bridgesHtml = INTERDISCIPLINARY_BRIDGES.map((bridge) => {
    const levelsLabel = bridge.levelRefs.map((ref) => resolveLevelRef(ref).shortLabel).join(', ');
    return `<li><strong>${escapeHtml(bridge.discipline)} (${escapeHtml(bridge.cycle)}) :</strong> ${escapeHtml(bridge.summary)} <span class="nowrap">[${escapeHtml(levelsLabel)}]</span></li>`;
  }).join('');

  const debateHtml = DEBATE_PROMPTS.map((item) => {
    const levelsLabel = item.levelRefs.map((ref) => resolveLevelRef(ref).shortLabel).join(', ');
    return `
      <div class="debate-card">
        <div class="debate-meta"><strong>${escapeHtml(item.tag)}</strong> · <span>${escapeHtml(item.timing)}</span> · <span>${escapeHtml(levelsLabel)}</span></div>
        <p class="debate-q">${escapeHtml(item.question)}</p>
        <ul>${item.keyPoints.map((kp) => `<li>${escapeHtml(kp)}</li>`).join('')}</ul>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Mission Aqua IA · Kit enseignant</title>
  <style>
    @page { size: A4; margin: 11mm 13mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      font-size: 10px;
      line-height: 1.4;
    }
    header {
      border-bottom: 1.5px solid #0f766e;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    header h1 {
      margin: 0;
      font-size: 15px;
      color: #0f172a;
    }
    header span {
      font-size: 9.5px;
      color: #475569;
      font-weight: 600;
    }
    h2 {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f766e;
      margin: 11px 0 6px;
      padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
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
      padding: 7px 9px;
      background: #f8fafc;
    }
    .box h3 {
      margin: 0 0 4px;
      font-size: 10.5px;
      color: #0f172a;
    }
    .note {
      margin: 5px 0 0;
      color: #475569;
      font-style: italic;
      font-size: 9.2px;
    }
    ul {
      margin: 3px 0 0;
      padding-left: 15px;
    }
    li { margin-bottom: 2px; }
    .compact-list {
      margin-top: 2px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 9.5px;
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
    .muted { color: #64748b; font-size: 9px; }
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
      font-size: 9px;
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
      font-size: 8.8px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <header>
    <h1>Mission Aqua IA · Kit enseignant</h1>
    <span>Technologie (Cycle 4) &amp; Pix · Fiche sans corrigés</span>
  </header>

  <h2>1. Déroulé de séance (1 h ou 2 h)</h2>
  <div class="grid-2">
    <div class="box">
      <h3>2 séances (2 × 55 min · Recommandé)</h3>
      <ul>${twoSessionHtml}</ul>
      <p class="note">${escapeHtml(SESSION_PLANS.two_sessions.footnote)}</p>
    </div>
    <div class="box">
      <h3>1 séance (55 min · Express)</h3>
      <ul>${oneSessionHtml}</ul>
      <p class="note">${escapeHtml(SESSION_PLANS.one_session.footnote)}</p>
    </div>
  </div>
  <div class="grid-2">
    <div class="box">
      <h3>Repères salle informatique</h3>
      <ul>${essentialsHtml}</ul>
    </div>
    <div class="box">
      <h3>Vies, chrono &amp; filet anti-blocage</h3>
      <ul>${antiBlockHtml}</ul>
    </div>
  </div>

  <h2>2. Ancrage Technologie (Cycle 4) &amp; Pix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 24%;">Thème / Cadre</th>
        <th>Notions &amp; compétences mobilisées</th>
        <th style="width: 17%;">Niveaux</th>
      </tr>
    </thead>
    <tbody>${curriculumHtml}</tbody>
  </table>
  <div class="box" style="margin-top: 7px;">
    <h3>Passerelles interdisciplinaires &amp; EPI — pistes facultatives</h3>
    <ul>${bridgesHtml}</ul>
  </div>

  <h2>3. Pistes de débat oral (10–15 min)</h2>
  <div class="debate-grid">${debateHtml}</div>

  <footer>
    <span>Mission Aqua IA · Escape game éducatif IA &amp; Eau</span>
    <span>Fiche sans corrigés : réponses protégées dans le Mode Enseignant (Alt+Shift+P ou double-clic en pied de page).</span>
  </footer>
</body>
</html>`;
}
