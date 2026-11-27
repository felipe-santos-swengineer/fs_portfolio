import castleGateClip from '../assets/audio/effects/cursed-gate.ogg';
import castleScream1 from '../assets/audio/effects/cursed-scream-1.ogg';
import castleScream2 from '../assets/audio/effects/cursed-scream-2.ogg';
import castleScream3 from '../assets/audio/effects/cursed-scream-3.ogg';
import witch1 from '../assets/audio/effects/witches/1.mp3';
import witch2 from '../assets/audio/effects/witches/2.mp3';
import witch3 from '../assets/audio/effects/witches/3.mp3';
import witch4 from '../assets/audio/effects/witches/4.mp3';
import witchIntroLaugh from '../assets/audio/effects/witch-dialogue/intro-laugh.mp3';
import witchLightningReaction from '../assets/audio/effects/witch-dialogue/lightning-reaction.mp3';
import { nextWitchLaugh } from './witchAmbience';
import { KING_LAUGHS } from './kingVoices';
import parchmentOpen from '../assets/audio/effects/parchment-open.wav';
import parchmentClose from '../assets/audio/effects/parchment-close.wav';
import parchmentButton from '../assets/audio/effects/parchment-button.wav';

const WITCH_LAUGHS=[witch1,witch2,witch3,witch4];
const PARCHMENT_SAMPLES = { open: parchmentOpen, close: parchmentClose, button: parchmentButton };

// Local effects, synthesized or played from bundled audio clips.
export default class VillageAudio {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.sources = new Set();
    this.channels = { interactions: true };
    this.channel = 'interactions';
    this.castleEffectRevision = 0;
    this.castleSamples = new Map();
    this.parchmentRevision = 0;
    this.witchGeneration=0; this.witchActive=false; this.witchTimer=null; this.witchSource=null; this.witchPrevious=-1;
    this.witchCompletion = null;
    this.witchLaughState = null;
    this.kingLaughState = { active: false, generation: 0, timer: null, source: null, previous: -1 };
  }

  setChannels(channels) {
    this.channels = { ...this.channels, ...channels };
    if (!this.channels.interactions) { this.stopWeather(); this.stopCastleEffects(); this.stopWitchAmbience(); this.stopKingLaughs(); this.stopParchment(); }
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
      if (this.enabled && this.channels.interactions) {
        Object.values(PARCHMENT_SAMPLES).forEach(url => this.loadSample(url).catch(() => {}));
      }
      return this.enabled;
    } catch { return false; }
  }

  mute() {
    this.stopWitchAmbience();
    this.stopKingLaughs();
    this.stopCastleEffects();
    this.stopWeather();
    this.stopParchment();
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
    else if (event === 'attack') { this.rustle(.16, 6500, .16); this.rustle(.08, 9500, .07, .025); this.tone(1900, .13, .025, .015, 'sine', 680); }
    else if (event === 'fireball') { this.rustle(.3, 1300, .09); this.tone(340, .3, .035, 0, 'sawtooth', 120); }
    else if (event === 'inhale') { this.rustle(.5, 500, .07); this.tone(105, .5, .045, 0, 'triangle', 175); }
    else if (event === 'impact') { this.rustle(.5, 650, .18); this.rustle(.35, 2400, .08, .03); this.tone(105, .55, .12, 0, 'sine', 38); }
    else if (event === 'breath') { this.rustle(1.1, 1200, .16); this.rustle(.75, 320, .13, .1); this.tone(95, .9, .08, 0, 'sawtooth', 55); }
  }

  loadSample(url) {
    if (!this.castleSamples.has(url)) {
      const context = this.context;
      const promise = fetch(url).then(response => {
        if (!response.ok) throw new Error('Unable to load sound effect');
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data)).catch(error => {
        if (this.castleSamples.get(url) === promise) this.castleSamples.delete(url);
        throw error;
      });
      this.castleSamples.set(url, promise);
    }
    return this.castleSamples.get(url);
  }

  loadCastleSample(url) { return this.loadSample(url); }

  stopParchment() {
    this.parchmentRevision++;
    for (const source of this.sources) {
      if (source.villageEffect === 'parchment') {
        try { source.stop(); } catch { /* Already ended. */ }
      }
    }
  }

  parchment(cue) {
    if (!this.ready() || !this.channels.interactions) return;
    if (cue !== 'button') this.stopParchment();
    const context = this.context;
    const revision = this.parchmentRevision;
    const start = context.currentTime;
    this.loadSample(PARCHMENT_SAMPLES[cue]).then(buffer => {
      if (this.context !== context || revision !== this.parchmentRevision || !this.ready() || !this.channels.interactions) return;
      // Skip the elapsed portion so the wooden tap stays aligned with the roll.
      const elapsed = context.currentTime - start;
      if (elapsed >= buffer.duration) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = cue === 'button' ? .38 : .70;
      source.connect(gain);
      gain.connect(this.master);
      source.villageEffect = cue === 'button' ? 'parchmentButton' : 'parchment';
      source.villageChannel = 'interactions';
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
        gain.disconnect();
      };
      source.start(0, elapsed);
    }).catch(() => {});
  }

  stopCastleEffects() {
    this.castleEffectRevision++;
    for (const source of this.sources) if (source.villageEffect === 'cursedCastleGate') {
      try { source.stop(); } catch { /* Already stopped. */ }
    }
  }

  stopWitchAmbience() {
    this.witchActive=false;this.witchGeneration++;
    if (this.witchTimer!==null) { clearTimeout(this.witchTimer);this.witchTimer=null; }
    if (this.witchSource) { const source=this.witchSource;this.witchSource=null;try { source.stop(); } catch { /* Already ended. */ } }
    const complete = this.witchCompletion;
    this.witchCompletion = null;
    const laughState = this.witchLaughState;
    this.witchLaughState = null;
    laughState?.(false);
    complete?.();
  }

  startWitchAmbience({ clip, onDone, battleLaugh, maxDuration } = {}) {
    if (this.witchActive || !this.ready() || !this.channels.interactions) { onDone?.(); return; }
    this.witchCompletion = onDone;
    this.witchLaughState = battleLaugh;
    this.witchActive=true;const generation=++this.witchGeneration;
    const schedule=delay=>{this.witchTimer=setTimeout(play,delay);};
    const play=async()=>{
      this.witchTimer=null;
      if (!this.witchActive || generation!==this.witchGeneration || !this.ready() || !this.channels.interactions) { this.stopWitchAmbience();return; }
      const index=clip ? -1 : nextWitchLaugh(this.witchPrevious),context=this.context;
      try {
        const buffer=await this.loadCastleSample(clip || WITCH_LAUGHS[index]);
        if (!this.witchActive || generation!==this.witchGeneration) return;
        if (this.context!==context || !this.ready() || !this.channels.interactions) { this.stopWitchAmbience(); return; }
        const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=.22;source.connect(gain);gain.connect(this.master);
        source.villageChannel='interactions';source.villageEffect='witchAmbience';this.sources.add(source);this.witchSource=source;
        if (!clip) this.witchPrevious=index;
        source.onended = () => {
          this.sources.delete(source);
          source.disconnect();
          gain.disconnect();
          if (this.witchSource === source) this.witchSource = null;
          if (!this.witchActive || generation !== this.witchGeneration) return;
          if (clip) this.stopWitchAmbience();
          else {
            battleLaugh?.(false);
            schedule(battleLaugh ? 1300 + Math.random() * 1000 : 5000 + Math.random() * 4000);
          }
        };
        if (maxDuration && buffer.duration > maxDuration) {
          const now = context.currentTime;
          gain.gain.setValueAtTime(.22, now + maxDuration - .45);
          gain.gain.linearRampToValueAtTime(0, now + maxDuration);
          source.start(now, 0, maxDuration);
        } else {
          source.start();
        }
        battleLaugh?.(true);
      } catch {
        if (!this.witchActive || generation !== this.witchGeneration) return;
        if (clip) this.stopWitchAmbience();
        else schedule(10000);
      }
    };
    if (clip) return play();
    schedule(battleLaugh ? 450 : 3000);
  }

  stopKingLaughs() {
    const state = this.kingLaughState;
    state.active = false;
    state.generation++;
    if (state.timer !== null) { clearTimeout(state.timer); state.timer = null; }
    if (state.source) {
      const source = state.source;
      state.source = null;
      try { source.stop(); } catch { /* Already ended. */ }
    }
  }

  startKingLaughs() {
    const state = this.kingLaughState;
    if (state.active || !this.ready() || !this.channels.interactions) return;
    state.active = true;
    const generation = ++state.generation;
    const schedule = delay => { state.timer = setTimeout(play, delay); };
    const play = async () => {
      state.timer = null;
      if (!state.active || generation !== state.generation || !this.ready() || !this.channels.interactions) {
        this.stopKingLaughs();
        return;
      }
      const index = nextWitchLaugh(state.previous), context = this.context;
      try {
        const buffer = await this.loadCastleSample(KING_LAUGHS[index]);
        if (!state.active || generation !== state.generation) return;
        if (this.context !== context || !this.ready() || !this.channels.interactions) {
          this.stopKingLaughs();
          return;
        }
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = .28;
        source.connect(gain);
        gain.connect(this.master);
        source.villageChannel = 'interactions';
        source.villageEffect = 'kingLaugh';
        this.sources.add(source);
        state.source = source;
        state.previous = index;
        source.onended = () => {
          this.sources.delete(source);
          source.disconnect();
          gain.disconnect();
          if (state.source === source) state.source = null;
          if (!state.active || generation !== state.generation) return;
          schedule(3500 + Math.random() * 5500);
        };
        source.start();
      } catch {
        if (!state.active || generation !== state.generation) return;
        schedule(8000);
      }
    };
    schedule(1600 + Math.random() * 2400);
  }

  async cursedCastle(event, onDone) {
    if (event === 'king-laugh-start') { this.startKingLaughs(); return; }
    if (event === 'king-laugh-stop') { this.stopKingLaughs(); return; }
    if (event === 'witch-start') { this.startWitchAmbience(); return; }
    if (event === 'witch-battle-laugh') { this.startWitchAmbience({ battleLaugh: onDone }); return; }
    if (event === 'witch-intro-laugh') return this.startWitchAmbience({ clip: witchIntroLaugh });
    if (event === 'witch-lightning') {
      this.dragon('impact');
      return this.startWitchAmbience({ clip: witchLightningReaction, onDone, maxDuration: 3.4 });
    }
    if (event === 'witch-electric-floor') {
      if (!this.ready() || !this.channels.interactions) return;
      this.channel = 'interactions';
      this.rustle(.65, 4200, .095);
      this.tone(135, .45, .035, 0, 'sawtooth', 230);
      return;
    }
    if (event === 'witch-hit') { this.dragon('impact'); return; }
    if (event === 'witch-stop') { this.stopWitchAmbience(); return; }
    if (event === 'stop') { this.stopCastleEffects(); return; }
    if (event !== 'gate' || !this.ready() || !this.channels.interactions) return;
    const revision=++this.castleEffectRevision, context=this.context;
    try {
      const clips=await Promise.all([castleGateClip,castleScream1,castleScream2,castleScream3].map(url=>this.loadCastleSample(url)));
      if (revision!==this.castleEffectRevision || this.context!==context || !this.ready() || !this.channels.interactions) return;
      // Two metallic creaks accompany the lift; the soldiers cry out in succession.
      const events=[[0,0,.32],[0,.72,.26],[1,.25,.18],[2,.65,.17],[3,1.05,.17]];
      this.channel='interactions'; this.effectType='cursedCastleGate';
      events.forEach(([index,delay,volume])=>{const source=context.createBufferSource(),gain=context.createGain();source.buffer=clips[index];gain.gain.value=volume;source.connect(gain);gain.connect(this.master);this.track(source,[gain],context.currentTime+delay,source.buffer.duration);});
      this.effectType=null;
    } catch { /* Missing or blocked effects do not interrupt the scene. */ }
  }

  lake(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'shot') { this.rustle(.13, 1800, .075); this.tone(130, .12, .035, 0, 'triangle', 55); }
    else if (event === 'volcano') { this.rustle(.8, 260, .045); this.tone(65, .65, .025, 0, 'sine', 42); }
    else if (event === 'horse') { this.tone(150, .08, .03, 0, 'triangle', 75); this.tone(120, .08, .025, .13, 'triangle', 65); }
    else if (event === 'birds') { this.tone(1800, .12, .015, 0, 'sine', 2400); this.tone(2200, .13, .012, .16, 'sine', 1700); }
  }

  chessAttack(type) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    const attacks = {
      p: () => {
        this.rustle(.21, 5800, .14);
        this.tone(1070, .22, .055, .025, 'triangle', 720);
      },
      n: () => {
        this.rustle(.09, 950, .14);
        this.tone(163, .16, .11, 0, 'triangle', 52);
        this.tone(128, .1, .06, .065, 'sine', 57);
      },
      r: () => {
        this.rustle(.32, 370, .17);
        this.tone(102, .32, .13, 0, 'triangle', 29);
        this.rustle(.16, 1280, .09, .12);
      },
      b: () => {
        this.rustle(.39, 1450, .07);
        [392, 523, 659, 784].forEach((note, index) => this.tone(note, .28, .04, index * .055, 'sine', note * 1.25));
      },
      q: () => {
        this.rustle(.07, 2600, .13);
        this.tone(680, .08, .08, .025, 'sine', 380);
        this.tone(980, .19, .047, .08, 'sine', 1310);
      },
      k: () => {
        this.rustle(.16, 1750, .17);
        this.tone(228, .16, .09, 0, 'triangle', 76);
        this.rustle(.12, 900, .1, .095);
      },
    };
    attacks[type]?.();
  }

  chessPiece({ type, color }) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    const undead = color === 'b';
    const pitch = undead ? .55 : 1;
    const ring = (note, duration, delay = 0, shape = 'triangle', end = note) =>
      this.tone(note * pitch, duration, .04, delay, undead ? 'sawtooth' : shape, end * pitch);
    const accents = {
      k: () => { ring(220, .22); ring(330, .28, .11); },
      q: () => { ring(392, .21, 0, 'sine'); ring(587, .25, .09, 'sine'); },
      b: () => { ring(523, .31, 0, 'sine'); ring(785, .25, .035, 'sine'); },
      n: () => { ring(340, .17, 0, 'triangle', 530); ring(450, .16, .13, 'triangle', 270); },
      r: () => { this.rustle(.16, 450, .065); ring(136, .26, 0, 'sine', 78); },
      p: () => { this.rustle(.09, 2050, .055); ring(265, .14, 0, 'triangle', 180); },
    };
    accents[type]?.();
    if (undead) this.rustle(.22, 580, .055);
  }

  ruins(event) {
    if (!this.ready() || !this.channels.interactions) return;
    this.channel = 'interactions';
    if (event === 'rune') { [520, 780, 1040].forEach((f,i)=>this.tone(f,.55,.045,i*.09,'sine')); }
    else if (event === 'gate') { this.rustle(.8,420,.075); this.tone(90,.75,.045,0,'triangle',55); }
    else if (event === 'stone') { this.rustle(.12,850,.08); this.tone(135,.13,.045,0,'triangle',68); }
    else if (event === 'wood') { this.rustle(.1,500,.06); this.tone(170,.16,.05,0,'triangle',85); }
    else if (event === 'passage') { this.tone(260,.4,.045,0,'sine',420); this.rustle(.3,600,.04); }
    else if (event === 'echo') { this.rustle(.09,760,.035); this.tone(180,.14,.03,.1,'triangle',120); this.tone(150,.2,.015,.24,'sine',100); }
    else if (event === 'drip') { this.tone(1280,.09,.035,0,'sine',620); this.tone(910,.13,.014,.16,'sine',480); }
    else if (event === 'wind') { this.rustle(1.5,420,.035); this.rustle(.9,720,.018,.35,-.4); this.rustle(.8,620,.014,.7,.4); }
    else if (event === 'deep') { this.tone(62,1.4,.045,0,'sine',44); this.rustle(1.1,180,.025,.2); }
    else if (event === 'fire') { this.rustle(.1,2600,.03); this.rustle(.07,1800,.022,.09,.3); this.tone(420,.07,.012,.04,'triangle',280); }
    else if (event === 'village') { [392,523,659].forEach((f,i)=>this.tone(f,.65,.022,i*.13,'sine')); this.rustle(.8,1100,.02,.25); }
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
    this.castleSamples.clear();
  }
}
