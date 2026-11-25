import dialogue from '../components/princessDialogue.json';
import castleDialogue from '../components/castlePrincessDialogue.json';
import pt1 from '../assets/audio/princess/pt-1.mp3';
import pt2 from '../assets/audio/princess/pt-2.mp3';
import en1 from '../assets/audio/princess/en-1.mp3';
import en2 from '../assets/audio/princess/en-2.mp3';
import castlePt1 from '../assets/audio/princess/castle-pt-1.mp3';
import castlePt2 from '../assets/audio/princess/castle-pt-2.mp3';
import castleEn1 from '../assets/audio/princess/castle-en-1.mp3';
import castleEn2 from '../assets/audio/princess/castle-en-2.mp3';

const buildProfile = (lines, filesByLocale) => Object.fromEntries(
  Object.entries(filesByLocale).map(([locale, files]) => [
    locale,
    { clips: lines[locale].map((text, index) => ({ text, src: files[index] })) },
  ])
);

export const PRINCESS_VOICES = buildProfile(dialogue, { 'pt-BR': [pt1, pt2], 'en-US': [en1, en2] });
export const CASTLE_PRINCESS_VOICES = buildProfile(castleDialogue, {
  'pt-BR': [castlePt1, castlePt2],
  'en-US': [castleEn1, castleEn2],
});
