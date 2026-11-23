import dialogue from '../components/princessDialogue.json';
import pt1 from '../assets/audio/princess/pt-1.mp3';
import pt2 from '../assets/audio/princess/pt-2.mp3';
import en1 from '../assets/audio/princess/en-1.mp3';
import en2 from '../assets/audio/princess/en-2.mp3';

export const PRINCESS_VOICES = Object.fromEntries(Object.entries({ 'pt-BR': [pt1, pt2], 'en-US': [en1, en2] }).map(([locale, files]) => [locale, { clips: dialogue[locale].map((text, index) => ({ text, src: files[index] })) }]));
