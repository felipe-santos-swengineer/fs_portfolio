import VillageAudio from './VillageAudio';

function node() {
  const parameter = () => ({ value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() });
  return { connect: jest.fn(), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), gain: parameter(), frequency: parameter(), pan: parameter() };
}

class FakeAudioContext {
  constructor() { this.state = 'suspended'; this.sampleRate = 8000; this.currentTime = 1; this.destination = {}; this.created = []; }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
  createGain() { return node(); }
  createBiquadFilter() { return node(); }
  createStereoPanner() { return node(); }
  createBuffer() { return { getChannelData: () => new Float32Array(8000) }; }
  source() { const n = node(); this.created.push(n); return n; }
  createOscillator() { return this.source(); }
  createBufferSource() { return this.source(); }
}

let previousContext;
beforeEach(() => { previousContext = window.AudioContext; window.AudioContext = FakeAudioContext; });
afterEach(() => { window.AudioContext = previousContext; });

test('nenhum áudio é criado antes de ativar o som; silenciar interrompe os efeitos', async () => {
  const audio = new VillageAudio();
  audio.step('stone'); audio.interact(2);
  expect(audio.context).toBeNull();
  expect(await audio.enable()).toBe(true);
  audio.step('stone');
  expect(audio.context.created).toHaveLength(2);
  const sources = [...audio.sources]; audio.mute();
  sources.forEach(s => expect(s.stop).toHaveBeenCalledTimes(2));
  audio.interact(1);
  expect(audio.context.created).toHaveLength(2);
  audio.dispose();
});

test('cada edifício possui uma assinatura sonora e os passos diferenciam pedra e grama', async () => {
  const audio = new VillageAudio(); await audio.enable();
  for (const [site, count] of [[0, 5], [1, 5], [2, 8], [3, 4]]) {
    const before = audio.context.created.length; audio.interact(site);
    expect(audio.context.created.length - before).toBe(count);
  }
  const spy = jest.spyOn(audio, 'rustle');
  audio.step('stone'); expect(spy).toHaveBeenLastCalledWith(.1, 1850, .14, 0, .15);
  audio.step('grass'); expect(spy).toHaveBeenLastCalledWith(.16, 650, .17, 0, -.15);
  audio.dispose();
});

test('desligar uma categoria interrompe só seus efeitos em andamento', async () => {
  const audio = new VillageAudio(); await audio.enable();
  audio.step('stone'); const steps = [...audio.sources];
  audio.interact(0); const interaction = [...audio.sources].filter(s => !steps.includes(s));
  audio.setChannels({ steps: false });
  steps.forEach(s => expect(s.stop).toHaveBeenCalledTimes(2));
  interaction.forEach(s => expect(s.stop).toHaveBeenCalledTimes(1));
  const count = audio.context.created.length; audio.step('grass'); expect(audio.context.created).toHaveLength(count);
  audio.setChannels({ interactions: false }); audio.closeDoor(); audio.interact(3);
  expect(audio.context.created).toHaveLength(count);
  audio.dispose();
});

test('os sons de fogos respeitam o canal de efeitos e podem ser cancelados sem interromper outros sons', async () => {
  const audio = new VillageAudio(); await audio.enable();
  audio.step('stone'); const steps = [...audio.sources];
  audio.firework('launch'); audio.firework('burst');
  const fireworks = [...audio.sources].filter(source => source.villageEffect === 'fireworks');
  expect(fireworks.length).toBeGreaterThan(0);
  audio.stopFireworks();
  steps.forEach(source => expect(source.stop).toHaveBeenCalledTimes(1));
  fireworks.forEach(source => expect(source.stop).toHaveBeenCalledTimes(2));
  audio.setChannels({ interactions: false });
  const count = audio.context.created.length; audio.firework('burst'); expect(audio.context.created).toHaveLength(count);
  audio.dispose();
});
