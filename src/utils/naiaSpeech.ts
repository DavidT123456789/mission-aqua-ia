export type NaiaSpeechEmotion = 'neutral' | 'alert' | 'happy' | 'thinking';

export interface RankedFrenchVoice {
  voice: SpeechSynthesisVoice;
  score: number;
  isNatural: boolean;
}

export interface SpeechSegment {
  text: string;
  pauseAfterMs: number;
  isQuestion: boolean;
  isExclamation: boolean;
}

const NOVELTY_OR_ROBOTIC_PATTERNS = [
  'eddy',
  'flo',
  'grandma',
  'grandpa',
  'reed',
  'rocko',
  'sandy',
  'shelley',
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'good news',
  'jester',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'espeak',
  'mbrola',
  'festival',
  'eloquence',
];

const PREMIUM_FEMALE_WEIGHTS: Array<[string, number]> = [
  ['denise', 235],
  ['vivienne', 225],
  ['eloise', 215],
  ['brigitte', 200],
  ['celeste', 200],
  ['coralie', 200],
  ['josephine', 195],
  ['sylvie', 190],
  ['charline', 190],
  ['ariane', 190],
  ['audrey', 140],
  ['aurelie', 135],
  ['amelie', 130],
  ['marie', 125],
  ['julie', 100],
  ['celine', 92],
  ['virginie', 90],
  ['caroline', 90],
  ['nathalie', 88],
  ['lea', 88],
  ['chloe', 88],
  ['claire', 85],
  ['sophie', 85],
  ['manon', 85],
  ['margaux', 85],
  ['solene', 85],
  ['camille', 85],
  ['alice', 82],
  ['emma', 82],
  ['louise', 82],
  ['hortense', 68],
];

const MALE_VOICE_NAMES = [
  'paul',
  'thomas',
  'henri',
  'remi',
  'alain',
  'claude',
  'jerome',
  'maurice',
  'antoine',
  'jean',
  'nicolas',
  'daniel',
  'jacques',
  'fabrice',
  'yannick',
  'thierry',
  'mathieu',
  'guillaume',
  'lucas',
  'fr-fr-x-frb',
  'fr-fr-x-frd',
  'fr-ca-x-cab',
  'fr-ca-x-cad',
];

const ANDROID_FEMALE_CODES = ['fr-fr-x-fra', 'fr-fr-x-frc', 'fr-ca-x-caa', 'fr-ca-x-cac'];

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isNaturalFrenchVoice(voice: SpeechSynthesisVoice): boolean {
  const norm = normalizeForMatch(`${voice.name} ${voice.voiceURI}`);
  return (
    norm.includes('natural') ||
    norm.includes('neural') ||
    norm.includes('premium') ||
    norm.includes('enhanced') ||
    norm.includes('amelioree') ||
    norm.includes('wavenet') ||
    norm.includes('siri') ||
    (norm.includes('google') && !norm.includes('espeak'))
  );
}

function scoreFrenchVoice(voice: SpeechSynthesisVoice): RankedFrenchVoice {
  const normName = normalizeForMatch(voice.name);
  const normUri = normalizeForMatch(voice.voiceURI);
  const combined = `${normName} ${normUri}`;
  const lang = voice.lang.toLowerCase();

  let score = 0;

  // Strongly penalize novelty / joke / ultra-robotic synth engines
  if (NOVELTY_OR_ROBOTIC_PATTERNS.some((p) => combined.includes(p))) {
    score -= 500;
  }

  // Quality engine signals (Natural / Neural / Premium / Enhanced / Google)
  const hasNeural = combined.includes('natural') || combined.includes('neural') || combined.includes('wavenet');
  const hasPremium = combined.includes('premium');
  const hasEnhanced = combined.includes('enhanced') || combined.includes('amelioree');
  const hasGoogle = combined.includes('google') && !combined.includes('espeak');
  const hasSiri = combined.includes('siri');

  if (hasNeural) score += 130;
  if (hasPremium) score += 100;
  if (hasEnhanced) score += 75;
  if (hasGoogle) score += 165;
  if (hasSiri) score += 145;
  if (combined.includes('online') && !NOVELTY_OR_ROBOTIC_PATTERNS.some((p) => combined.includes(p))) {
    score += 25;
  }
  if (combined.includes('compact')) score -= 18;
  if (combined.includes('desktop')) score -= 12;

  // Match known French female voice names (best persona fit for NAÏA)
  for (const [name, weight] of PREMIUM_FEMALE_WEIGHTS) {
    if (normName.includes(name) || normUri.includes(name)) {
      score += weight;
      break;
    }
  }

  if (ANDROID_FEMALE_CODES.some((code) => combined.includes(code))) {
    score += 110;
  }

  // Rank male voices below female voices (still kept as fallback)
  if (
    MALE_VOICE_NAMES.some((male) => {
      const escaped = male.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(combined);
    })
  ) {
    score -= 55;
  }

  // Locale preference (fr-FR preferred for French curriculum context)
  if (lang === 'fr-fr') score += 25;
  else if (lang === 'fr-be' || lang === 'fr-ch') score += 12;
  else if (lang === 'fr-ca') score += 8;

  return {
    voice,
    score,
    isNatural: isNaturalFrenchVoice(voice),
  };
}

export function pickNaiaVoice(): RankedFrenchVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const rawVoices = window.speechSynthesis.getVoices();
  if (!rawVoices.length) return null;

  let best: RankedFrenchVoice | null = null;
  for (const v of rawVoices) {
    if (!v.lang || !v.lang.toLowerCase().startsWith('fr')) continue;
    const candidate = scoreFrenchVoice(v);
    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Normalizes technical notation, units, acronyms, and symbols for clear French speech synthesis.
 */
export function formatNaiaSpeechText(raw: string): string {
  return raw
    // Strip emojis / pictographs so engines never read them out loud
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    // Normalize game names & casing so all-caps words aren't spelled letter-by-letter
    .replace(/\bNAÏA\b/g, 'Naïa')
    .replace(/\bNAIA\b/g, 'Naïa')
    .replace(/\bHYDRA\b/g, 'Hydra')
    // Typographic separators -> gentle spoken pauses / natural phrasing
    .replace(/\s*[→➔➜]\s*/g, ', vers ')
    .replace(/\s*[—–·•]\s*/g, ', ')
    .replace(/[«»]/g, '')
    .replace(/≈\s*/g, 'environ ')
    .replace(/≥\s*/g, 'supérieur ou égal à ')
    .replace(/≤\s*/g, 'inférieur ou égal à ')
    .replace(/(\d)\s*[×x]\s*(\d)/gi, '$1 fois $2')
    // Compound scientific / energy / water units
    .replace(/gCO[₂2]\s*\/\s*kWh/gi, 'grammes de CO2 par kilowattheure')
    .replace(/kgCO[₂2]/gi, 'kilogrammes de CO2')
    .replace(/tCO[₂2]/gi, 'tonnes de CO2')
    .replace(/CO₂/g, 'CO2')
    .replace(/L\s*\/\s*MWh/g, 'litres par mégawattheure')
    .replace(/L\s*\/\s*kWh/g, 'litres par kilowattheure')
    .replace(/L\s*\/\s*min/g, 'litres par minute')
    .replace(/L\s*\/\s*s\b/g, 'litres par seconde')
    .replace(/L\s*\/\s*h\b/g, 'litres par heure')
    .replace(/m³/g, 'mètres cubes')
    .replace(/°C/g, ' degrés Celsius')
    // Numeric units (handles space-grouped numbers like "1 500 kWh" and decimals like "1,5 L")
    .replace(/(\d)\s*mL\b/g, '$1 millilitres')
    .replace(/(\d)\s*cL\b/g, '$1 centilitres')
    .replace(/(\d)\s*L\b/g, '$1 litres')
    .replace(/(\d)\s*ms\b/g, '$1 millisecondes')
    .replace(/(\d)\s*TWh\b/g, '$1 térawattheures')
    .replace(/(\d)\s*GWh\b/g, '$1 gigawattheures')
    .replace(/(\d)\s*MWh\b/g, '$1 mégawattheures')
    .replace(/(\d)\s*kWh\b/g, '$1 kilowattheures')
    .replace(/(\d)\s*Wh\b/g, '$1 wattheures')
    .replace(/(\d)\s*GW\b/g, '$1 gigawatts')
    .replace(/(\d)\s*MW\b/g, '$1 mégawatts')
    .replace(/(\d)\s*kW\b/g, '$1 kilowatts')
    .replace(/(\d)\s*W\b/g, '$1 watts')
    .replace(/(\d)\s*To\b/g, '$1 téraoctets')
    .replace(/(\d)\s*Go\b/g, '$1 gigaoctets')
    .replace(/(\d)\s*Mo\b/g, '$1 mégaoctets')
    .replace(/(\d)\s*Ko\b/g, '$1 kilooctets')
    .replace(/(\d)\s*pts\b/gi, '$1 points')
    .replace(/(\d)\s*min\b/g, '$1 minutes')
    .replace(/(\d)\s*%/g, '$1 pour cent')
    // Acronyms that French voices often mangle
    .replace(/\bPUE\b/g, 'P U E')
    .replace(/\bWUE\b/g, 'W U E')
    .replace(/\bDEEE\b/g, 'D 3 E')
    .replace(/\bLLM\b/g, 'L L M')
    .replace(/\bGPU\b/g, 'G P U')
    .replace(/\bCPU\b/g, 'C P U')
    .replace(/\bNPU\b/g, 'N P U')
    .replace(/\bTPU\b/g, 'T P U')
    .replace(/\bIoT\b/g, 'I o T')
    .replace(/\bACV\b/g, 'A C V')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bRGPD\b/g, 'R G P D')
    .replace(/\bSSD\b/g, 'S S D')
    // Clean whitespace and stray doubled punctuation
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitLongSentence(sentence: string, maxLen = 165): string[] {
  if (sentence.length <= maxLen) return [sentence];

  const parts: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxLen) {
    // Prefer splitting at semicolon, colon, or comma near the middle
    const ideal = Math.floor(remaining.length / 2);
    let splitIdx = -1;
    let bestDist = Infinity;

    const candidateRegex = /[;:,]\s+/g;
    let match: RegExpExecArray | null;
    while ((match = candidateRegex.exec(remaining)) !== null) {
      const endPos = match.index + match[0].length;
      if (endPos < 35 || remaining.length - endPos < 25) continue;
      const dist = Math.abs(endPos - ideal);
      if (endPos <= maxLen && dist < bestDist) {
        bestDist = dist;
        splitIdx = endPos;
      }
    }

    if (splitIdx === -1) {
      // Fallback: split on nearest space under maxLen
      splitIdx = remaining.lastIndexOf(' ', maxLen);
      if (splitIdx < 30) splitIdx = maxLen;
    }

    parts.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
}

function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '…') continue;

    // Consume consecutive punctuation (e.g., "...", "?!", "!!")
    while (i + 1 < text.length && '.!?…'.includes(text[i + 1])) {
      i += 1;
    }

    const nextChar = text[i + 1];
    const prevChar = i > 0 ? text[i - 1] : '';

    // Do not split decimal numbers (e.g., "1.5") or common short abbreviations
    if (ch === '.' && /\d/.test(prevChar) && nextChar && /\d/.test(nextChar)) {
      continue;
    }

    if (nextChar && /\s/.test(nextChar)) {
      const slice = text.slice(start, i + 1).trim();
      // Avoid splitting after short French abbreviations like "M.", "Dr.", "ex."
      if (ch === '.' && /(?:^|\s)(?:M|Mme|Mlle|Dr|ex|env|etc|cf)\.$/i.test(slice)) {
        continue;
      }
      if (slice) sentences.push(slice);
      start = i + 1;
    }
  }

  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

/**
 * Breaks dialogue blocks into natural prosodic segments with tuned breath pauses
 * and protects against Chromium's ~15-second long-utterance cutoff bug.
 */
export function buildSpeechSegments(blocks: string[]): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  const cleanedBlocks = blocks.map(formatNaiaSpeechText).filter(Boolean);

  cleanedBlocks.forEach((block, blockIndex) => {
    const isLastBlock = blockIndex === cleanedBlocks.length - 1;
    const rawSentences = splitIntoSentences(block);

    rawSentences.forEach((sentence, sIndex) => {
      const isLastSentenceInBlock = sIndex === rawSentences.length - 1;
      const chunks = splitLongSentence(sentence);

      chunks.forEach((chunk, cIndex) => {
        const isLastChunk = cIndex === chunks.length - 1;
        const isQuestion = chunk.endsWith('?');
        const isExclamation = chunk.endsWith('!');

        let pauseAfterMs = 95;
        if (isLastChunk) {
          if (isLastSentenceInBlock && !isLastBlock) {
            pauseAfterMs = 270; // Natural breath before "Objectif : ..."
          } else if (isLastSentenceInBlock && isLastBlock) {
            pauseAfterMs = 0;
          } else if (isQuestion) {
            pauseAfterMs = 210;
          } else if (isExclamation) {
            pauseAfterMs = 185;
          } else {
            pauseAfterMs = 165;
          }
        }

        segments.push({
          text: chunk,
          pauseAfterMs,
          isQuestion,
          isExclamation,
        });
      });
    });
  });

  return segments;
}

function getProsodyForEmotion(
  emotion: NaiaSpeechEmotion,
  isNatural: boolean,
  segment: SpeechSegment
): { rate: number; pitch: number } {
  // Neural/Online voices sound cleanest very close to 1.0 pitch;
  // classic local OS voices benefit from a subtle warmth lift.
  const baseProfiles: Record<NaiaSpeechEmotion, { rate: number; pitch: number }> = isNatural
    ? {
        neutral: { rate: 1.01, pitch: 1.01 },
        happy: { rate: 1.04, pitch: 1.03 },
        alert: { rate: 1.04, pitch: 0.99 },
        thinking: { rate: 0.97, pitch: 1.0 },
      }
    : {
        neutral: { rate: 0.98, pitch: 1.04 },
        happy: { rate: 1.02, pitch: 1.08 },
        alert: { rate: 1.03, pitch: 1.0 },
        thinking: { rate: 0.94, pitch: 1.02 },
      };

  const base = baseProfiles[emotion];
  let pitch = base.pitch;
  let rate = base.rate;

  if (segment.isQuestion) {
    pitch += isNatural ? 0.015 : 0.025;
  } else if (segment.isExclamation && emotion !== 'alert') {
    rate += 0.015;
    pitch += isNatural ? 0.01 : 0.02;
  }

  return {
    rate: Math.max(0.85, Math.min(1.15, rate)),
    pitch: Math.max(0.92, Math.min(1.15, pitch)),
  };
}

class NaiaSpeechEngine {
  private sessionId = 0;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private activeOnEnd: (() => void) | null = null;

  private clearTimers() {
    if (this.pauseTimer !== null) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  stop(notifyCallback = true) {
    this.sessionId += 1;
    this.clearTimers();

    const prevEnd = this.activeOnEnd;
    this.activeOnEnd = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    if (notifyCallback && prevEnd) {
      prevEnd();
    }
  }

  speak({
    blocks,
    emotion = 'neutral',
    onStart,
    onEnd,
  }: {
    blocks: string[];
    emotion?: NaiaSpeechEmotion;
    onStart?: () => void;
    onEnd?: () => void;
  }): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

    const segments = buildSpeechSegments(blocks);
    if (!segments.length) return false;

    const chosen = pickNaiaVoice();
    this.stop(true);

    const currentSession = this.sessionId;
    this.activeOnEnd = onEnd ?? null;

    const finish = () => {
      if (currentSession !== this.sessionId) return;
      this.clearTimers();
      const cb = this.activeOnEnd;
      this.activeOnEnd = null;
      cb?.();
    };

    const speakIndex = (idx: number) => {
      if (currentSession !== this.sessionId) return;
      if (idx >= segments.length) {
        finish();
        return;
      }

      const segment = segments[idx];
      const utterance = new SpeechSynthesisUtterance(segment.text);

      if (chosen) {
        utterance.voice = chosen.voice;
        utterance.lang = chosen.voice.lang;
      } else {
        utterance.lang = 'fr-FR';
      }

      const prosody = getProsodyForEmotion(emotion, chosen?.isNatural ?? false, segment);
      utterance.rate = prosody.rate;
      utterance.pitch = prosody.pitch;
      utterance.volume = 1;

      utterance.onend = () => {
        if (currentSession !== this.sessionId) return;
        this.clearTimers();

        if (idx + 1 >= segments.length) {
          finish();
          return;
        }

        if (segment.pauseAfterMs > 0) {
          this.pauseTimer = setTimeout(() => {
            this.pauseTimer = null;
            speakIndex(idx + 1);
          }, segment.pauseAfterMs);
        } else {
          speakIndex(idx + 1);
        }
      };

      utterance.onerror = (event) => {
        if (currentSession !== this.sessionId) return;
        // Ignore intentional cancellations
        if (event.error === 'interrupted' || event.error === 'canceled') return;
        finish();
      };

      // Chrome/Chromium safeguard: gently ping resume if an utterance runs long
      this.clearTimers();
      this.keepAliveTimer = setInterval(() => {
        if (currentSession !== this.sessionId) {
          this.clearTimers();
          return;
        }
        try {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          /* ignore */
        }
      }, 9000);

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    };

    onStart?.();

    // Small delay after cancel() avoids a Chrome/Safari bug where immediate speak() is silently dropped
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      speakIndex(0);
    }, 35);

    return true;
  }
}

export const naiaSpeech = new NaiaSpeechEngine();

if (typeof window !== 'undefined') {
  window.addEventListener('naiaStopSpeech', () => {
    naiaSpeech.stop(true);
  });
}
