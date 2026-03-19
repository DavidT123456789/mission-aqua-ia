class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isMuted: boolean = false;
  initialized: boolean = false;

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
      this.initialized = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.3;
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 1, slideFreq?: number) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.init();
    
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
        }
        
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {}
  }

  playHover() {
    this.playTone(1200, 'sine', 0.02, 0.01);
  }

  playClick() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.init();

    try {
      const now = this.ctx.currentTime;

      // Layer 1: Low-frequency "whoosh" body (gives depth)
      const oscLow = this.ctx.createOscillator();
      const gainLow = this.ctx.createGain();
      oscLow.type = 'sine';
      oscLow.connect(gainLow);
      gainLow.connect(this.masterGain);
      oscLow.frequency.setValueAtTime(400, now);
      oscLow.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gainLow.gain.setValueAtTime(0.12, now);
      gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      oscLow.start(now);
      oscLow.stop(now + 0.08);

      // Layer 2: High-frequency "snap" attack (gives crispness)
      const oscHigh = this.ctx.createOscillator();
      const gainHigh = this.ctx.createGain();
      oscHigh.type = 'triangle';
      oscHigh.connect(gainHigh);
      gainHigh.connect(this.masterGain);
      oscHigh.frequency.setValueAtTime(1800, now);
      oscHigh.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gainHigh.gain.setValueAtTime(0.06, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      oscHigh.start(now);
      oscHigh.stop(now + 0.04);

      // Layer 3: Noise burst for texture
      const bufferSize = this.ctx.sampleRate * 0.03;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 2000;
      noiseFilter.Q.value = 0.5;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noiseSource.start(now);
    } catch (e) {}
  }

  playStart() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.init();

    try {
      const now = this.ctx.currentTime;

      // Phase 1: Deep rumble build-up (0 - 0.3s)
      const rumble = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumble.type = 'sawtooth';
      rumble.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);
      rumble.frequency.setValueAtTime(60, now);
      rumble.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.08, now + 0.15);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      rumble.start(now);
      rumble.stop(now + 0.4);

      // Phase 2: Rising sweep "power-on" (0.1 - 0.5s)
      const sweep = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweep.type = 'sine';
      sweep.connect(sweepGain);
      sweepGain.connect(this.masterGain);
      sweep.frequency.setValueAtTime(200, now + 0.1);
      sweep.frequency.exponentialRampToValueAtTime(800, now + 0.45);
      sweepGain.gain.setValueAtTime(0.001, now);
      sweepGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      sweep.start(now + 0.1);
      sweep.stop(now + 0.55);

      // Phase 3: Confirmation chord (0.35s - 0.9s)
      const chordFreqs = [523.25, 659.25, 783.99]; // C5 - E5 - G5 major chord
      chordFreqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.frequency.setValueAtTime(freq, now + 0.35);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.4 + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now + 0.35);
        osc.stop(now + 0.9);
      });

      // Phase 4: Final "ping" resonance (0.5s)
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.connect(pingGain);
      pingGain.connect(this.masterGain);
      ping.frequency.setValueAtTime(1046.50, now + 0.5); // C6 - octave above
      pingGain.gain.setValueAtTime(0.001, now);
      pingGain.gain.linearRampToValueAtTime(0.08, now + 0.52);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      ping.start(now + 0.5);
      ping.stop(now + 1.0);
    } catch (e) {}
  }

  playError() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.init();
    try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {}
  }

  playSuccess() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.1), i * 100);
    });
  }

  playTyping() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      const freq = 1200 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.005, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
      
      osc.start(now);
      osc.stop(now + 0.01);
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();
