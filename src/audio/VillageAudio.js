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
    if (!this.channels.interactions) this.stopWeather();
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
    this.stopWeather();
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

  setWeather(strength) {
    if (!this.ready() || !this.channels.interactions || strength <= .005) { this.stopWeather(); return; }
    if (!this.weatherSource) {
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
      source.buffer = this.noise; source.loop = true;
      filter.type = 'lowpass'; filter.frequency.value = 850;
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(); this.weatherSource = source; this.weatherGain = gain;
    }
    this.weatherGain.gain.value = Math.min(1, strength) * .035;
  }

  stopWeather() {
    if (!this.weatherSource) return;
    const source = this.weatherSource; this.weatherSource = null; this.weatherGain = null;
    try { source.stop(); } catch { /* Already stopped. */ }
  }

  step(surface) {
    if (!this.ready() || !this.channels.steps) return;
    this.channel = 'steps';
    const stone = surface === 'stone';
    this.foot = 1 - this.foot;
    this.rustle(stone ? .1 : .16, stone ? 1850 : 650, stone ? .07 : .085, 0, this.foot ? .15 : -.15);
    this.tone(stone ? 145 : 88, .09, .0375, 0, 'sine', stone ? 65 : 48);
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

  dungeon(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'attack') { this.rustle(.16, 6500, .16); this.rustle(.08, 9500, .07, .025); this.tone(1900, .13, .025, .015, 'sine', 680); }
    else if (event === 'monsterAttack') { this.rustle(.22, 480, .12); this.tone(145, .25, .085, 0, 'sawtooth', 65); this.tone(93, .2, .05, .025, 'triangle', 55); }
    else if (event === 'defeat') { this.tone(230, .24, .09, 0, 'sawtooth', 70); this.rustle(.2, 900, .1); }
    else if (event === 'collect') { this.tone(660, .18, .06, 0, 'sine', 1000); }
    else if (event === 'wrong') { this.tone(190, .3, .08, 0, 'triangle', 90); }
    else if (event === 'win') { [523,659,784].forEach((f,i)=>this.tone(f,.35,.06,i*.1,'triangle')); }
    else if (event === 'start') { this.tone(300,.25,.055,0,'triangle',620); }
  }

  cave(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'attack') { this.rustle(.16, 6500, .16); this.rustle(.08, 9500, .07, .025); this.tone(1900, .13, .025, .015, 'sine', 680); }
    else if (event === 'defeat') { this.tone(230, .24, .09, 0, 'sawtooth', 70); this.rustle(.2, 900, .1); }
    else if (event === 'monsterHit') { this.tone(660, .18, .06, 0, 'sine', 1000); }
    else if (event === 'lava') { this.rustle(.42, 1800, .13); this.tone(185, .35, .045, 0, 'sawtooth', 95); }
    else if (event === 'spikes') { this.rustle(.1, 3900, .13); this.tone(500, .14, .055, 0, 'triangle', 240); }
    else if (event === 'arrowLaunch') { this.rustle(.12, 1900, .07); this.tone(260, .16, .035, 0, 'triangle', 110); }
    else if (event === 'arrow') { this.rustle(.1, 1600, .12); this.tone(190, .15, .06, 0, 'triangle', 80); }
    else if (event === 'monster') { this.rustle(.25, 500, .12); this.tone(130, .28, .07, 0, 'sawtooth', 55); }
    else if (event === 'lever') { this.rustle(.15, 850, .08); this.tone(170, .18, .05, 0, 'triangle', 105); this.tone(520, .3, .035, .12, 'sine', 780); }
    else if (event === 'heal') { [520, 660, 880].forEach((f, i) => this.tone(f, .3, .045, i * .07, 'sine')); }
    else if (event === 'death') { this.tone(200, .7, .07, 0, 'triangle', 55); this.rustle(.45, 550, .08); }
  }

  dragon(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'anger') { this.rustle(.6, 420, .055); this.tone(88, .65, .045, 0, 'sawtooth', 54); }
  }

  lake(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'shot') { this.rustle(.13, 1800, .075); this.tone(130, .12, .035, 0, 'triangle', 55); }
    else if (event === 'volcano') { this.rustle(.8, 260, .045); this.tone(65, .65, .025, 0, 'sine', 42); }
    else if (event === 'horse') { this.tone(150, .08, .03, 0, 'triangle', 75); this.tone(120, .08, .025, .13, 'triangle', 65); }
    else if (event === 'birds') { this.tone(1800, .12, .015, 0, 'sine', 2400); this.tone(2200, .13, .012, .16, 'sine', 1700); }
  }

  ruins(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'rune') { [520, 780, 1040].forEach((f,i)=>this.tone(f,.55,.045,i*.09,'sine')); }
    else if (event === 'gate') { this.rustle(.8,420,.075); this.tone(90,.75,.045,0,'triangle',55); }
    else if (event === 'stone') { this.rustle(.12,850,.08); this.tone(135,.13,.045,0,'triangle',68); }
    else if (event === 'wood') { this.rustle(.1,500,.06); this.tone(170,.16,.05,0,'triangle',85); }
    else if (event === 'passage') { this.tone(260,.4,.045,0,'sine',420); this.rustle(.3,600,.04); }
    else if (event === 'talk') { this.tone(440,.16,.025,0,'sine',520); }
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
