class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isMuted: boolean = false;
  initialized: boolean = false;

  // Cached MP3 buffers (loaded once, played many times)
  private clickBuffer: AudioBuffer | null = null;
  private startBuffer: AudioBuffer | null = null;

  // MP3 URLs from V1
  private static CLICK_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
  private static START_URL = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';

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

      // Preload MP3 buffers in background
      this.loadBuffer(SoundManager.CLICK_URL).then(buf => { this.clickBuffer = buf; });
      this.loadBuffer(SoundManager.START_URL).then(buf => { this.startBuffer = buf; });
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error("Failed to load audio:", url, e);
      return null;
    }
  }

  private playBuffer(buffer: AudioBuffer | null, volume = 0.4) {
    if (this.isMuted || !this.ctx || !this.masterGain || !buffer) return;
    try {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(this.masterGain);
      gain.gain.value = volume;
      source.start(0);
    } catch (e) {}
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
    // MP3 click from V1 — each call creates a new source,
    // so rapid clicks overlap naturally = louder with fast clicks
    if (this.clickBuffer) {
      this.playBuffer(this.clickBuffer, 0.3);
    } else {
      // Fallback if buffer not loaded yet
      this.playTone(1600, 'sine', 0.03, 0.1);
    }
  }

  playStart() {
    if (this.isMuted) return;
    // MP3 start sound from V1 — dramatic game launch sound
    if (this.startBuffer) {
      this.playBuffer(this.startBuffer, 0.5);
    } else {
      // Buffer not loaded yet (first interaction) — play directly via Audio element
      const audio = new Audio(SoundManager.START_URL);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
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
