const FALLBACK_PROTOTYPE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#041e2f"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#10b981" stroke-opacity="0.14" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#grid)"/>
  <circle cx="300" cy="280" r="190" fill="none" stroke="#22d3ee" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="10 8"/>
  <circle cx="300" cy="280" r="140" fill="none" stroke="#34d399" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="300" cy="280" r="95" fill="#0f172a" fill-opacity="0.72" stroke="#10b981" stroke-opacity="0.5" stroke-width="2"/>
  <path d="M 110 280 L 205 280 M 395 280 L 490 280 M 300 90 L 300 185 M 300 375 L 300 445" stroke="#22d3ee" stroke-opacity="0.45" stroke-width="2"/>
  <circle cx="110" cy="280" r="8" fill="#020617" stroke="#22d3ee" stroke-width="2.5"/>
  <circle cx="490" cy="280" r="8" fill="#020617" stroke="#22d3ee" stroke-width="2.5"/>
  <circle cx="300" cy="90" r="8" fill="#020617" stroke="#34d399" stroke-width="2.5"/>
  <path d="M 300 205 C 300 205 348 260 348 296 C 348 324 326 346 300 346 C 274 346 252 324 252 296 C 252 260 300 205 300 205 Z" fill="url(#drop)" fill-opacity="0.9"/>
  <path d="M 281 260 C 272 275 268 289 270 301" fill="none" stroke="#ecfeff" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round"/>
  <rect x="150" y="470" width="300" height="38" rx="19" fill="#020617" fill-opacity="0.86" stroke="#10b981" stroke-opacity="0.5"/>
  <text x="300" y="494" text-anchor="middle" fill="#6ee7b7" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="1.5">BREVET DERNIÈRE SOURCE</text>
</svg>`;

export const FALLBACK_PROTOTYPE_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_PROTOTYPE_SVG)}`;

export interface SoberBlueprintOptions {
  title: string;
  description: string;
  waterSaved: string;
  score: number;
  patentNumber?: string | null;
  inventor?: string;
  isSoberChoice?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['BREVET DERNIÈRE SOURCE'];
  const lines: string[] = [];
  let current = '';
  let truncated = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else if (current) {
      if (lines.length === maxLines - 1) {
        truncated = true;
        break;
      }
      lines.push(current);
      current = word.length > maxCharsPerLine ? `${word.slice(0, maxCharsPerLine - 1)}…` : word;
      if (word.length > maxCharsPerLine && lines.length === maxLines - 1 && i < words.length - 1) {
        truncated = true;
        break;
      }
    } else {
      current = `${word.slice(0, maxCharsPerLine - 1)}…`;
      if (lines.length === maxLines - 1) {
        if (i < words.length - 1) truncated = true;
        break;
      }
      lines.push(current);
      current = '';
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (truncated && lines.length > 0) {
    const lastIdx = lines.length - 1;
    const last = lines[lastIdx];
    if (!last.endsWith('…')) {
      lines[lastIdx] = last.length >= maxCharsPerLine ? `${last.slice(0, maxCharsPerLine - 1)}…` : `${last}…`;
    }
  }
  return lines;
}

interface BlueprintModule {
  code: string;
  label: string;
  sub: string;
  accent: string;
  pattern: RegExp;
}

const BLUEPRINT_MODULES: BlueprintModule[] = [
  { code: 'M-01', label: 'CAPTEURS IoT', sub: 'Mesure en continu', accent: '#22d3ee', pattern: /capteur|iot|sonde|humidit|pression|debit|mesur|detect/ },
  { code: 'M-02', label: 'CIRCUIT FERME', sub: 'Recyclage & filtration', accent: '#34d399', pattern: /ferm|recycl|reutilis|filtr|epur|recuper|pluie|grise|boucle/ },
  { code: 'M-03', label: 'THERMIQUE', sub: 'Chaleur valorisee', accent: '#fb923c', pattern: /chaleur|thermiq|chauff|serre|refroid|evapor|radiateur|echangeur/ },
  { code: 'M-04', label: 'IA SOBRE', sub: 'Pilotage basse conso', accent: '#a78bfa', pattern: /\bia\b|algo|modele|predict|analyse|alerte|optimis|intellig|logiciel/ },
  { code: 'M-05', label: 'IRRIGATION', sub: 'Arrosage de precision', accent: '#4ade80', pattern: /agri|irrig|arros|plante|culture|champ|sol|jardin|potager/ },
  { code: 'M-06', label: 'ENERGIE VERTE', sub: 'Alimentation sobre', accent: '#facc15', pattern: /solaire|eolien|hydro|renouvel|energie|electri|batterie|panneau/ },
  { code: 'M-07', label: 'RESEAU & VANNES', sub: 'Regulation anti-fuites', accent: '#38bdf8', pattern: /vanne|fuite|canalisation|tuyau|reseau|pompe|compteur|ville|quartier/ },
];

const DEFAULT_MODULES: BlueprintModule[] = [
  BLUEPRINT_MODULES[0],
  BLUEPRINT_MODULES[1],
  BLUEPRINT_MODULES[3],
  BLUEPRINT_MODULES[6],
];

export function buildSoberBlueprintDataUri(options: SoberBlueprintOptions): string {
  const combined = normalizeForMatch(`${options.title} ${options.description}`);
  const matched = BLUEPRINT_MODULES.filter((mod) => mod.pattern.test(combined));
  const selectedModules: BlueprintModule[] = [...matched];
  for (const fallback of DEFAULT_MODULES) {
    if (selectedModules.length >= 4) break;
    if (!selectedModules.some((m) => m.code === fallback.code)) {
      selectedModules.push(fallback);
    }
  }
  const modules = selectedModules.slice(0, 4);

  const titleLines = wrapText(options.title || 'Brevet Dernière Source', 28, 2);
  const patentLabel = escapeXml(options.patentNumber || 'FR-SOBRE');
  const inventorLabel = escapeXml((options.inventor || 'Agent').slice(0, 22));
  const waterSavedLabel = escapeXml((options.waterSaved || '—').slice(0, 18));
  const scoreLabel = `${Math.max(0, Math.min(100, Math.round(options.score || 0)))}%`;
  const badgeLabel = options.isSoberChoice ? 'BLUEPRINT SOBRE · 0 mL IA' : 'SCHEMA TECHNIQUE LOCAL';

  const nodePositions = [
    { x: 42, y: 158, cx: 196, cy: 194, tx: 248, ty: 274 },
    { x: 378, y: 158, cx: 378, cy: 194, tx: 352, ty: 274 },
    { x: 42, y: 364, cx: 196, cy: 400, tx: 248, ty: 332 },
    { x: 378, y: 364, cx: 378, cy: 400, tx: 352, ty: 332 },
  ];

  const moduleNodesSvg = modules
    .map((mod, idx) => {
      const pos = nodePositions[idx];
      const safeLabel = escapeXml(mod.label);
      const safeSub = escapeXml(mod.sub);
      const midX = Math.round((pos.cx + pos.tx) / 2);
      return `
  <path d="M ${pos.cx} ${pos.cy} L ${midX} ${pos.cy} L ${pos.tx} ${pos.ty}" fill="none" stroke="${mod.accent}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="${pos.cx}" cy="${pos.cy}" r="4.5" fill="#020617" stroke="${mod.accent}" stroke-width="2"/>
  <g>
    <rect x="${pos.x}" y="${pos.y}" width="180" height="72" rx="10" fill="#071426" fill-opacity="0.92" stroke="${mod.accent}" stroke-opacity="0.55" stroke-width="1.5"/>
    <rect x="${pos.x + 10}" y="${pos.y + 10}" width="38" height="16" rx="4" fill="${mod.accent}" fill-opacity="0.16" stroke="${mod.accent}" stroke-opacity="0.45" stroke-width="1"/>
    <text x="${pos.x + 29}" y="${pos.y + 21}" text-anchor="middle" fill="${mod.accent}" font-family="monospace" font-size="9" font-weight="bold">${mod.code}</text>
    <text x="${pos.x + 10}" y="${pos.y + 44}" fill="#f1f5f9" font-family="monospace" font-size="12" font-weight="bold">${safeLabel}</text>
    <text x="${pos.x + 10}" y="${pos.y + 60}" fill="#94a3b8" font-family="sans-serif" font-size="10">${safeSub}</text>
  </g>`;
    })
    .join('');

  const titleSvg = titleLines
    .map(
      (line, idx) =>
        `<text x="300" y="${84 + idx * 24}" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="0.4">${escapeXml(line)}</text>`
    )
    .join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bpBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="55%" stop-color="#041b2d"/>
      <stop offset="100%" stop-color="#022520"/>
    </linearGradient>
    <linearGradient id="coreDrop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <pattern id="bpGridFine" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22d3ee" stroke-opacity="0.08" stroke-width="0.8"/>
    </pattern>
    <pattern id="bpGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#22d3ee" stroke-opacity="0.16" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="600" height="600" fill="url(#bpBg)"/>
  <rect width="600" height="600" fill="url(#bpGridFine)"/>
  <rect width="600" height="600" fill="url(#bpGridMajor)"/>

  <!-- Blueprint frame & corner ticks -->
  <rect x="16" y="16" width="568" height="568" rx="16" fill="none" stroke="#22d3ee" stroke-opacity="0.32" stroke-width="1.5"/>
  <path d="M 16 42 L 16 16 L 42 16 M 558 16 L 584 16 L 584 42 M 16 558 L 16 584 L 42 584 M 558 584 L 584 584 L 584 558" fill="none" stroke="#34d399" stroke-width="2.5"/>

  <!-- Header bar -->
  <rect x="32" y="30" width="218" height="24" rx="12" fill="#022c22" stroke="#34d399" stroke-opacity="0.65" stroke-width="1"/>
  <text x="141" y="46" text-anchor="middle" fill="#6ee7b7" font-family="monospace" font-size="10" font-weight="bold" letter-spacing="0.8">${badgeLabel}</text>
  <text x="566" y="46" text-anchor="end" fill="#67e8f9" font-family="monospace" font-size="11" font-weight="bold">BREVET ${patentLabel}</text>

  <!-- Invention Title -->
  ${titleSvg}
  <line x1="90" y1="126" x2="510" y2="126" stroke="#22d3ee" stroke-opacity="0.25" stroke-width="1"/>

  <!-- Central Core Schematic -->
  <circle cx="300" cy="303" r="106" fill="none" stroke="#22d3ee" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="8 6"/>
  <circle cx="300" cy="303" r="76" fill="none" stroke="#34d399" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="300" cy="303" r="56" fill="#071426" fill-opacity="0.92" stroke="#10b981" stroke-opacity="0.65" stroke-width="2"/>
  <path d="M 300 264 C 300 264 326 294 326 314 C 326 329 314 341 300 341 C 286 341 274 329 274 314 C 274 294 300 264 300 264 Z" fill="url(#coreDrop)"/>
  <path d="M 290 296 C 285 305 283 313 284 320" fill="none" stroke="#ecfeff" stroke-opacity="0.65" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Dynamic Subsystem Modules -->
  ${moduleNodesSvg}

  <!-- Bottom Technical Title Block -->
  <rect x="32" y="468" width="536" height="84" rx="12" fill="#020617" fill-opacity="0.88" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="226" y1="478" x2="226" y2="542" stroke="#1e293b" stroke-width="1"/>
  <line x1="398" y1="478" x2="398" y2="542" stroke="#1e293b" stroke-width="1"/>

  <text x="50" y="492" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold">ECONOMIE PROJETEE</text>
  <text x="50" y="516" fill="#34d399" font-family="monospace" font-size="16" font-weight="bold">${waterSavedLabel}</text>
  <text x="50" y="534" fill="#94a3b8" font-family="monospace" font-size="10">litres / an</text>

  <text x="244" y="492" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold">CONCEPTEUR</text>
  <text x="244" y="516" fill="#e2e8f0" font-family="sans-serif" font-size="13" font-weight="bold">${inventorLabel}</text>
  <text x="244" y="534" fill="#22d3ee" font-family="monospace" font-size="10">ARCHITECTURE VERIFIEE</text>

  <text x="416" y="492" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold">SCORE LABO</text>
  <text x="416" y="522" fill="#facc15" font-family="monospace" font-size="24" font-weight="bold">${scoreLabel}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
