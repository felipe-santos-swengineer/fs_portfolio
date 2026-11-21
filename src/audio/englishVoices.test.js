import english from '../content.en.json';
import { ENGLISH_VOICES, ENGLISH_FELIPE_VOICE, ENGLISH_NARRATION } from './englishVoices';

test('as vozes inglesas correspondem aos dialogos e narracoes', () => {
  for (const person of english.VILLAGERS) {
    expect(ENGLISH_VOICES[person.name].clips.map(clip => clip.text)).toEqual(person.lines);
    expect(ENGLISH_VOICES[person.name].clips.every(clip => clip.src)).toBe(true);
  }
  expect(ENGLISH_FELIPE_VOICE.clips.map(clip => clip.text)).toEqual(english.felipe);
  expect(ENGLISH_NARRATION).toHaveLength(4);
  expect(ENGLISH_NARRATION.every(Boolean)).toBe(true);
});
