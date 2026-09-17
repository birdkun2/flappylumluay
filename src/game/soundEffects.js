// Tiny synthesized effects: no audio downloads or asset conversion at startup.
class SoundEffects {
  constructor() {
    this.enabled = true;
    try { this.enabled = localStorage.getItem('flappy-lumluay-sound') !== 'off'; } catch { /* Session preference. */ }
    this.context = null; this.master = null; this.lastMeow = -Infinity;
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('flappy-lumluay-sound', this.enabled ? 'on' : 'off'); } catch { /* Session preference. */ }
    if (this.master) this.master.gain.setValueAtTime(this.enabled ? .35 : 0, this.context.currentTime);
    if (this.enabled) this.meow();
    return this.enabled;
  }
  ready() {
    if (!this.enabled) return false;
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        this.context = new Audio(); this.master = this.context.createGain();
        this.master.gain.value = .35; this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return this.context.state !== 'closed';
    } catch { return false; }
  }
  meow() {
    if (!this.ready()) return;
    const c = this.context, t = c.currentTime;
    if (t - this.lastMeow < .07) return;
    this.lastMeow = t;
    const voice = c.createOscillator(), formant = c.createBiquadFilter(), envelope = c.createGain();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(640, t);
    voice.frequency.exponentialRampToValueAtTime(940, t + .045);
    voice.frequency.exponentialRampToValueAtTime(460, t + .21);
    formant.type = 'lowpass'; formant.Q.value = 2.5;
    formant.frequency.setValueAtTime(2100, t);
    formant.frequency.exponentialRampToValueAtTime(750, t + .21);
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(.15, t + .025);
    envelope.gain.exponentialRampToValueAtTime(.001, t + .22);
    voice.connect(formant); formant.connect(envelope); envelope.connect(this.master);
    voice.start(t); voice.stop(t + .23);
    voice.onended = () => { voice.disconnect(); formant.disconnect(); envelope.disconnect(); };
  }
  pow() {
    if (!this.ready()) return;
    const c = this.context, t = c.currentTime;
    const tone = c.createOscillator(), envelope = c.createGain();
    tone.type = 'triangle'; tone.frequency.setValueAtTime(210, t);
    tone.frequency.exponentialRampToValueAtTime(45, t + .16);
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(.3, t + .006);
    envelope.gain.exponentialRampToValueAtTime(.001, t + .19);
    tone.connect(envelope); envelope.connect(this.master); tone.start(t); tone.stop(t + .2);
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * .1), c.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 3;
    const noise = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    noise.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1100; gain.gain.value = .14;
    noise.connect(filter); filter.connect(gain); gain.connect(this.master); noise.start(t);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
}
export const soundEffects = new SoundEffects();
