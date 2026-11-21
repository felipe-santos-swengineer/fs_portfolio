import { FELIPE_LINES, FELIPE_VOICE } from './felipeVoice';

test('cada mensagem de Felipe possui sua gravação local correspondente', () => {
  expect(FELIPE_LINES).toHaveLength(2);
  expect(FELIPE_VOICE.clips.map(clip => clip.text)).toEqual(FELIPE_LINES);
  expect(FELIPE_VOICE.clips.every(clip => Boolean(clip.src))).toBe(true);
});
