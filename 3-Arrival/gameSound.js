class GameSoundManager {
  constructor() {
    this.enabled = true;
    this.ready = false;
    this.ambient = null;
    this.effectOscillator = null;
    this.loading = false;
    this.lastAmbientChangeAt = 0;
    this.noteIndex = 0;
    this.notes = [82, 98, 110, 98, 73, 87];
  }

  start() {
    if (!this.enabled || this.ready || this.loading) return;
    if (typeof p5.Oscillator !== 'function') {
      this.loading = true;
      const script = document.createElement('script');
      script.src = 'libraries/p5.sound.min.js';
      script.onload = () => {
        this.loading = false;
        this.start();
      };
      script.onerror = () => {
        this.loading = false;
        console.error('Impossible de charger p5.sound.min.js');
      };
      document.head.appendChild(script);
      return;
    }
    if (!this.ambient) this.ambient = new p5.Oscillator('sine');
    if (!this.effectOscillator) this.effectOscillator = new p5.Oscillator('triangle');
    this.ambient.freq(82);
    this.ambient.amp(0);
    this.effectOscillator.amp(0);
    this.ambient.start();
    this.effectOscillator.start();
    this.ambient.amp(0.025, 0.8);
    this.ready = true;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.start();
    } else if (this.ready) {
      this.ambient.amp(0, 0.15);
      this.effectOscillator.amp(0, 0.05);
      this.ambient.stop();
      this.effectOscillator.stop();
      this.ready = false;
    }
    return this.enabled;
  }

  play(frequency, duration = 0.12, volume = 0.12) {
    if (!this.enabled || !this.ready) return;
    this.effectOscillator.freq(frequency);
    this.effectOscillator.amp(volume, 0.01);
    this.effectOscillator.amp(0, duration);
  }

  playEntry() {
    if (!this.enabled || !this.ready) return;
    this.play(440, 0.16, 0.13);
    this.ambient.freq(220);
    this.ambient.freq(660, 0.7);
  }

  playDeath() {
    if (!this.enabled || !this.ready) return;
    this.play(90, 0.6, 0.2);
    this.effectOscillator.freq(260);
    this.effectOscillator.freq(48, 0.9);
    this.effectOscillator.amp(0.22, 0.02);
    this.effectOscillator.amp(0, 0.95);
  }

  update(now) {
    if (!this.ready || !this.enabled || now - this.lastAmbientChangeAt < 1200) return;
    this.noteIndex = (this.noteIndex + 1) % this.notes.length;
    this.ambient.freq(this.notes[this.noteIndex]);
    this.lastAmbientChangeAt = now;
  }

  stop() {
    if (!this.ready) return;
    this.ambient.stop();
    this.effectOscillator.stop();
    this.ready = false;
  }
}
