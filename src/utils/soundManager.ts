interface VoiceOptions {
  freq: number;
  endFreq?: number;
  type?: OscillatorType;
  delay?: number;
  attack?: number;
  duration: number;
  vol: number;
  filterFreq?: number;
  filterEndFreq?: number;
  filterQ?: number;
  detune?: number;
}

class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  compressor: DynamicsCompressorNode | null = null;
  isMuted: boolean = false;
  initialized: boolean = false;
  private lastClickAt: number = 0;
  private lastFeedbackAt: number = 0;

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();

      // Master chain: masterGain -> gentle compressor -> destination (prevents clipping & harshness)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.34;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.34, this.ctx.currentTime, 0.015);
    }
  }

  private getNowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private markFeedback() {
    this.lastFeedbackAt = this.getNowMs();
  }

  private ensureReady(allowInit = true): boolean {
    if (this.isMuted) return false;
    if (allowInit) {
      this.init();
    } else if (!this.initialized || !this.ctx || this.ctx.state !== 'running') {
      return false;
    }
    return Boolean(this.ctx && this.masterGain);
  }

  /**
   * Sample-accurate synthesized voice with smooth ADSR attack/decay & optional low-pass filter sweep.
   */
  private scheduleVoice({
    freq,
    endFreq,
    type = 'sine',
    delay = 0,
    attack = 0.008,
    duration,
    vol,
    filterFreq,
    filterEndFreq,
    filterQ = 0.8,
    detune = 0,
  }: VoiceOptions) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const start = this.ctx.currentTime + delay;
      const end = start + duration;
      const safeAttack = Math.min(attack, duration * 0.4);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), start);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), end);
      }
      if (detune !== 0) {
        osc.detune.setValueAtTime(detune, start);
      }

      if (filterFreq !== undefined) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(filterQ, start);
        filter.frequency.setValueAtTime(Math.max(40, filterFreq), start);
        if (filterEndFreq !== undefined) {
          filter.frequency.exponentialRampToValueAtTime(Math.max(40, filterEndFreq), end);
        }
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.masterGain);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + safeAttack);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.start(start);
      osc.stop(end + 0.015);
    } catch {
      /* ignore audio errors */
    }
  }

  /**
   * Crystalline "aquatic glass" note: warm fundamental + delicate harmonic shimmer.
   */
  private scheduleCrystalNote(
    freq: number,
    delay: number,
    duration: number,
    vol: number,
    brightness = 0.22
  ) {
    this.scheduleVoice({
      freq,
      type: 'sine',
      delay,
      attack: 0.009,
      duration,
      vol,
    });
    // Soft triangle body for warmth
    this.scheduleVoice({
      freq,
      type: 'triangle',
      delay,
      attack: 0.01,
      duration: duration * 0.72,
      vol: vol * 0.35,
      filterFreq: Math.min(4800, freq * 3.2),
      filterEndFreq: Math.max(400, freq * 1.4),
      detune: 3,
    });
    // Subtle octave shimmer (short decay = glassy sparkle without harshness)
    if (brightness > 0 && freq * 2 < 7500) {
      this.scheduleVoice({
        freq: freq * 2,
        type: 'sine',
        delay,
        attack: 0.006,
        duration: duration * 0.45,
        vol: vol * brightness,
      });
    }
  }

  playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol = 1,
    slideFreq?: number,
    allowInit = true
  ) {
    if (!this.ensureReady(allowInit)) return;
    this.scheduleVoice({
      freq,
      endFreq: slideFreq,
      type,
      duration,
      vol,
      attack: 0.006,
    });
  }

  playHover() {
    if (!this.ensureReady(false)) return;
    this.scheduleVoice({
      freq: 1100,
      type: 'sine',
      duration: 0.025,
      vol: 0.015,
      attack: 0.004,
    });
  }

  /**
   * Crisp, understated tactile UI click (suppressed automatically if a richer feedback sound just fired).
   */
  playClick() {
    const now = this.getNowMs();
    if (now - this.lastClickAt < 40) return;
    if (now - this.lastFeedbackAt < 75) return;
    this.lastClickAt = now;
    if (!this.ensureReady(true)) return;

    this.scheduleVoice({
      freq: 760,
      endFreq: 320,
      type: 'triangle',
      duration: 0.03,
      vol: 0.13,
      attack: 0.003,
      filterFreq: 2000,
      filterEndFreq: 650,
    });
    this.scheduleVoice({
      freq: 520,
      endFreq: 240,
      type: 'sine',
      duration: 0.026,
      vol: 0.07,
      attack: 0.002,
    });
  }

  /**
   * Confident, welcoming mission initialization chime.
   */
  playStart() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    // Warm low foundation pad
    this.scheduleVoice({
      freq: 130.81, // C3
      type: 'triangle',
      delay: 0,
      attack: 0.03,
      duration: 0.56,
      vol: 0.11,
      filterFreq: 420,
    });

    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
      const isLast = i === notes.length - 1;
      this.scheduleCrystalNote(freq, i * 0.07, isLast ? 0.44 : 0.22, isLast ? 0.18 : 0.14, 0.2);
    });
  }

  /**
   * Damped, smooth error feedback (no harsh raw sawtooth buzz).
   */
  playError() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    // First muted thud
    this.scheduleVoice({
      freq: 215,
      endFreq: 195,
      type: 'triangle',
      delay: 0,
      attack: 0.008,
      duration: 0.12,
      vol: 0.2,
      filterFreq: 620,
    });
    this.scheduleVoice({
      freq: 215,
      type: 'sawtooth',
      delay: 0,
      attack: 0.01,
      duration: 0.11,
      vol: 0.08,
      filterFreq: 520,
      filterEndFreq: 260,
    });

    // Second lower drop
    this.scheduleVoice({
      freq: 162,
      endFreq: 128,
      type: 'triangle',
      delay: 0.11,
      attack: 0.008,
      duration: 0.22,
      vol: 0.22,
      filterFreq: 520,
      filterEndFreq: 220,
    });
    this.scheduleVoice({
      freq: 162,
      endFreq: 128,
      type: 'sawtooth',
      delay: 0.11,
      attack: 0.01,
      duration: 0.2,
      vol: 0.08,
      filterFreq: 420,
      filterEndFreq: 190,
    });
  }

  /**
   * Crisp 2-note confirmation ping for intermediate sub-steps inside a level.
   */
  playStep() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    this.scheduleCrystalNote(523.25, 0, 0.14, 0.14, 0.16); // C5
    this.scheduleCrystalNote(783.99, 0.075, 0.24, 0.16, 0.22); // G5
  }

  /**
   * Full level completion / validation arpeggio.
   */
  playSuccess() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const isLast = i === notes.length - 1;
      this.scheduleCrystalNote(freq, i * 0.08, isLast ? 0.52 : 0.24, isLast ? 0.19 : 0.15, isLast ? 0.26 : 0.18);
    });
    // Subtle warm harmonic sustain under the top note
    this.scheduleVoice({
      freq: 659.25, // E5
      type: 'sine',
      delay: 0.24,
      attack: 0.02,
      duration: 0.45,
      vol: 0.08,
    });
  }

  /**
   * Delicate crystalline water-droplet chime for glossary term discovery (+15 pts).
   */
  playDiscover() {
    if (!this.ensureReady(true)) return;

    // Gentle upward droplet transient
    this.scheduleVoice({
      freq: 740,
      endFreq: 783.99, // G5
      type: 'sine',
      delay: 0,
      attack: 0.006,
      duration: 0.13,
      vol: 0.13,
    });
    this.scheduleCrystalNote(1174.66, 0.065, 0.24, 0.12, 0.18); // D6
  }

  /**
   * Luminous "insight unlocked" chime when purchasing a hint.
   */
  playHintUnlock() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    // Open stacked fifths (D5 -> A5 -> E6) — bright, clear, "aha!" feeling
    this.scheduleCrystalNote(587.33, 0, 0.17, 0.14, 0.2); // D5
    this.scheduleCrystalNote(880.0, 0.068, 0.22, 0.16, 0.24); // A5
    this.scheduleCrystalNote(1318.51, 0.135, 0.34, 0.14, 0.22); // E6
  }

  /**
   * Warm, comforting vitality bloom when buying or restoring a heart/life.
   */
  playHeartRestore() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    // First gentle heartbeat swell (C4 + G4)
    this.scheduleVoice({
      freq: 261.63,
      type: 'sine',
      delay: 0,
      attack: 0.016,
      duration: 0.2,
      vol: 0.15,
    });
    this.scheduleVoice({
      freq: 392.0,
      type: 'triangle',
      delay: 0.01,
      attack: 0.016,
      duration: 0.19,
      vol: 0.11,
      filterFreq: 1100,
    });

    // Second warm bloom (E4 + C5 + soft G5 shimmer)
    this.scheduleVoice({
      freq: 329.63,
      type: 'sine',
      delay: 0.125,
      attack: 0.02,
      duration: 0.42,
      vol: 0.13,
    });
    this.scheduleCrystalNote(523.25, 0.125, 0.44, 0.16, 0.18); // C5
    this.scheduleVoice({
      freq: 783.99,
      type: 'sine',
      delay: 0.17,
      attack: 0.022,
      duration: 0.36,
      vol: 0.09,
    });
  }

  /**
   * Shimmering reward chord when unlocking a bonus badge or special access.
   */
  playBadgeUnlock() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    this.scheduleCrystalNote(392.0, 0, 0.18, 0.14, 0.16); // G4
    this.scheduleCrystalNote(493.88, 0.065, 0.2, 0.14, 0.18); // B4
    this.scheduleCrystalNote(587.33, 0.13, 0.22, 0.15, 0.2); // D5
    this.scheduleCrystalNote(783.99, 0.2, 0.5, 0.18, 0.26); // G5
    this.scheduleVoice({
      freq: 987.77, // B5 subtle sparkle
      type: 'sine',
      delay: 0.22,
      attack: 0.015,
      duration: 0.44,
      vol: 0.09,
    });
  }

  /**
   * Noble, uplifting victory fanfare played once when completing the entire mission (Outro).
   */
  playVictory() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    const melody = [
      { freq: 392.0, delay: 0.0, dur: 0.2 }, // G4
      { freq: 523.25, delay: 0.09, dur: 0.2 }, // C5
      { freq: 659.25, delay: 0.18, dur: 0.22 }, // E5
      { freq: 783.99, delay: 0.27, dur: 0.24 }, // G5
      { freq: 1046.5, delay: 0.38, dur: 0.85 }, // C6
    ];

    melody.forEach(({ freq, delay, dur }, i) => {
      const isFinal = i === melody.length - 1;
      this.scheduleCrystalNote(freq, delay, dur, isFinal ? 0.19 : 0.14, isFinal ? 0.28 : 0.18);
    });

    // Warm resolving chord swell under final note
    const chord = [
      { freq: 130.81, type: 'triangle' as OscillatorType, vol: 0.11, filterFreq: 460 }, // C3
      { freq: 392.0, type: 'sine' as OscillatorType, vol: 0.1 }, // G4
      { freq: 523.25, type: 'sine' as OscillatorType, vol: 0.11, detune: -4 }, // C5
      { freq: 659.25, type: 'sine' as OscillatorType, vol: 0.1, detune: 4 }, // E5
      { freq: 783.99, type: 'sine' as OscillatorType, vol: 0.09 }, // G5
    ];
    chord.forEach((v) => {
      this.scheduleVoice({
        freq: v.freq,
        type: v.type,
        delay: 0.38,
        attack: 0.035,
        duration: 1.05,
        vol: v.vol,
        filterFreq: v.filterFreq,
        detune: v.detune,
      });
    });
  }

  /**
   * Restrained descending firewall-lock / power-down sound on Game Over (0 lives).
   */
  playGameOver() {
    this.markFeedback();
    if (!this.ensureReady(true)) return;

    const steps = [
      { freq: 329.63, delay: 0.0, dur: 0.22 }, // E4
      { freq: 261.63, delay: 0.16, dur: 0.24 }, // C4
      { freq: 196.0, delay: 0.32, dur: 0.34 }, // G3
    ];

    steps.forEach(({ freq, delay, dur }) => {
      this.scheduleVoice({
        freq,
        endFreq: freq * 0.96,
        type: 'triangle',
        delay,
        attack: 0.012,
        duration: dur,
        vol: 0.17,
        filterFreq: 850,
        filterEndFreq: 320,
      });
    });

    // Soft low power-down tail
    this.scheduleVoice({
      freq: 146.83, // D3
      endFreq: 87.31, // F2
      type: 'sine',
      delay: 0.36,
      attack: 0.02,
      duration: 0.45,
      vol: 0.18,
    });
  }

  /**
   * Single subtle double-ping sonar alert when crossing the 5-minute critical timer threshold.
   */
  playTimeWarning() {
    if (!this.ensureReady(true)) return;

    this.scheduleVoice({
      freq: 880,
      type: 'sine',
      delay: 0,
      attack: 0.008,
      duration: 0.18,
      vol: 0.11,
      filterFreq: 1800,
    });
    this.scheduleVoice({
      freq: 880,
      type: 'sine',
      delay: 0.2,
      attack: 0.008,
      duration: 0.24,
      vol: 0.12,
      filterFreq: 1800,
    });
  }

  /**
   * Ultra-delicate typewriter micro-blip for NAÏA's speech bubble.
   */
  playTyping() {
    if (!this.ensureReady(false)) return;
    const freq = 1050 + Math.random() * 280;
    this.scheduleVoice({
      freq,
      type: 'sine',
      duration: 0.016,
      vol: 0.012,
      attack: 0.004,
    });
  }
}

export const soundManager = new SoundManager();
