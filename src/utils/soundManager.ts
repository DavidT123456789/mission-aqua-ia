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
    // Elegant click: very short, high-pitched, no slide
    this.playTone(1600, 'sine', 0.03, 0.1);
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
