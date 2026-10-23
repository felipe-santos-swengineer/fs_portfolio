import VillagerSpeech from './VillagerSpeech';
import { VILLAGER_VOICES } from './villagerClips';
import { VILLAGERS } from '../components/villagers';
import manifest from '../assets/audio/villagers/manifest.json';

let previousAudio;
beforeEach(() => {
  previousAudio = window.Audio;
  window.Audio = jest.fn().mockImplementation(src => ({ src, play: jest.fn().mockResolvedValue(), pause: jest.fn() }));
});
afterEach(() => { window.Audio = previousAudio; });

test('cada NPC tem gravações próprias, com duas vozes femininas e duas masculinas distintas', () => {
  expect(new Set(manifest.map(entry => entry.voice)).size).toBe(4);
  expect(manifest).toHaveLength(8);
  expect(new Set(manifest.map(entry => entry.file)).size).toBe(8);
  for (const person of VILLAGERS) {
    const clips = VILLAGER_VOICES[person.name].clips;
    expect(clips.map(clip => clip.text)).toEqual(person.lines);
    expect(clips.every(clip => Boolean(clip.src))).toBe(true);
  }
  expect(VILLAGER_VOICES.Bia.gender).toBe('female');
  expect(VILLAGER_VOICES.Lia.gender).toBe('female');
  expect(VILLAGER_VOICES.Tom.gender).toBe('male');
  expect(VILLAGER_VOICES.Rui.gender).toBe('male');
});

test('reproduz a gravação correspondente ao texto sem alterar o timbre ou a velocidade', () => {
  const speech = new VillagerSpeech(), done = jest.fn();
  const person = VILLAGERS[0];
  expect(speech.speak(person.lines[0], VILLAGER_VOICES.Bia, done)).toBe(true);
  const first = speech.audio;
  expect(first.src).toBe(VILLAGER_VOICES.Bia.clips[0].src);
  expect(first.play).toHaveBeenCalledTimes(1);
  expect(first.playbackRate).toBeUndefined();
  speech.speak(person.lines[1], VILLAGER_VOICES.Bia);
  expect(first.pause).toHaveBeenCalledTimes(1);
  expect(first.onended).toBeNull();
  expect(done).toHaveBeenCalledWith(true);
  speech.stop(); expect(speech.playing).toBe(false);
});

test('uma falha na reprodução mantém o diálogo em texto e permite tentar novamente', async () => {
  const speech = new VillagerSpeech(), done = jest.fn();
  window.Audio.mockImplementationOnce(() => ({ play: jest.fn().mockRejectedValue(new Error('Blocked')), pause: jest.fn() }));
  speech.speak(VILLAGERS[0].lines[0], VILLAGER_VOICES.Bia, done);
  await Promise.resolve();
  expect(done).toHaveBeenCalledWith(false);
  expect(speech.playing).toBe(false);
  expect(speech.speak('Texto sem gravação', VILLAGER_VOICES.Bia)).toBe(false);
});
