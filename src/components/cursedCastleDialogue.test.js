import lore from './cursedCastleDialogue.json';
import { CURSED_CASTLE_VOICES } from '../audio/cursedCastleVoices';

test('Alden has matching dialogue and voice clips in both languages', () => {
  for (const locale of ['pt-BR', 'en-US']) {
    expect(lore[locale]).toHaveLength(3);
    expect(CURSED_CASTLE_VOICES[locale].clips.map(clip => clip.text)).toEqual(lore[locale]);
    CURSED_CASTLE_VOICES[locale].clips.forEach(clip => expect(clip.src).toBeTruthy());
  }
});
