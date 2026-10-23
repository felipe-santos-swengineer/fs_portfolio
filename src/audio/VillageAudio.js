// Short, locally synthesized effects: no network requests or audio downloads.
export default class VillageAudio {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.sources = new Set();
    this.foot = 0;
    this.channels = { steps: true, interactions: true };
    this.channel = 'interactions';
  }

  setChannels(channels) {
    this.channels = { ...this.channels, ...channels };
    for (const source of this.sources) if (!this.channels[source.villageChannel]) { try { source.stop(); } catch { /* Already ended. */ } }
  }

  async enable() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = .65;
        this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      await this.context.resume();
      this.enabled = this.context.state === 'running';
      return this.enabled;
    } catch { return false; }
  }

  mute() {
    this.enabled = false;
    for (const source of [...this.sources]) { try { source.stop(); } catch { /* Already ended. */ } }
    this.sources.clear();
  }

  ready() { return this.enabled && this.context?.state === 'running' && !document.hidden; }

  track(source, nodes, start, duration, noise = false) {
    source.villageChannel = this.channel;
    source.villageEffect = this.effectType;
    this.sources.add(source);
    source.onended = () => { this.sources.delete(source); source.disconnect(); nodes.forEach(n => n.disconnect()); };
    if (noise) source.start(start, Math.random() * .5); else source.start(start);
    source.stop(start + duration + .02);
  }

  tone(frequency, duration, volume, delay = 0, type = 'sine', endFrequency = frequency) {
    if (!this.ready()) return;
    const ctx = this.context, start = ctx.currentTime + delay;
    const source = ctx.createOscillator(), gain = ctx.createGain();
    source.type = type; source.frequency.setValueAtTime(frequency, start);
    source.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(.0001, start); gain.gain.linearRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(gain); gain.connect(this.master); this.track(source, [gain], start, duration);
  }

  rustle(duration, frequency, volume, delay = 0, pan = 0) {
    if (!this.ready()) return;
    const ctx = this.context, start = ctx.currentTime + delay;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = this.noise; filter.type = 'lowpass'; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, start); gain.gain.linearRampToValueAtTime(volume, start + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(gain);
    const nodes = [filter, gain];
    if (ctx.createStereoPanner) { const stereo = ctx.createStereoPanner(); stereo.pan.value = pan; gain.connect(stereo); stereo.connect(this.master); nodes.push(stereo); } else gain.connect(this.master);
    this.track(source, nodes, start, duration, true);
  }

  step(surface) {
    if (!this.ready() || !this.channels.steps) return;
    this.channel = 'steps';
    const stone = surface === 'stone';
    this.foot = 1 - this.foot;
    this.rustle(stone ? .1 : .16, stone ? 1850 : 650, stone ? .14 : .17, 0, this.foot ? .15 : -.15);
    this.tone(stone ? 145 : 88, .09, .075, 0, 'sine', stone ? 65 : 48);
  }

  interact(site) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (site === 0) { // Wooden latch and a quiet tavern chord.
      this.rustle(.19, 650, .16); this.tone(150, .15, .09, 0, 'triangle', 85);
      [196, 247, 294].forEach((f, i) => this.tone(f, .45, .055, .12 + i * .035, 'triangle'));
    } else if (site === 1) { // Pages and a soft magical chime.
      this.rustle(.3, 2600, .12); this.rustle(.2, 2200, .08, .16);
      [523, 659, 784].forEach((f, i) => this.tone(f, .45, .045, .12 + i * .09));
    } else if (site === 2) { // Two strikes on an anvil.
      [0, .2].forEach(delay => { this.rustle(.06, 3400, .12, delay); [430, 973, 1610].forEach((f, i) => this.tone(f, .35, .07 / (i + 1), delay)); });
    } else if (site === 3) { // A brass post-office bell.
      [880, 1760, 2376].forEach((f, i) => this.tone(f, .7, .065 / (i + 1), 0));
      this.rustle(.1, 950, .06, .12);
    }
  }

  closeDoor() { if (!this.channels.interactions) return; this.channel = 'interactions'; this.rustle(.1, 600, .08); this.tone(100, .12, .045, 0, 'triangle', 55); }

  firework(stage) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions'; this.effectType = 'fireworks';
    if (stage === 'launch') {
      this.tone(430, .22, .025, 0, 'triangle', 1700);
      this.rustle(.2, 2800, .045);
    } else if (stage === 'burst') {
      this.rustle(.48, 2200, .2);
      this.tone(110, .28, .12, 0, 'sine', 36);
      for (let i = 0; i < 5; i++) this.rustle(.055, 3700, .05, .08 + i * .075, (i % 2 ? 1 : -1) * .35);
    }
    this.effectType = null;
  }

  stopFireworks() {
    for (const source of this.sources) if (source.villageEffect === 'fireworks') { try { source.stop(); } catch { /* Already ended. */ } }
  }

  dispose() {
    this.mute();
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    this.context = null;
  }
}
