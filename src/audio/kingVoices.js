import dialogue from '../components/kingDialogue.json';
import pt1 from '../assets/audio/castle-king/pt-1.mp3';
import pt2 from '../assets/audio/castle-king/pt-2.mp3';
import pt3 from '../assets/audio/castle-king/pt-3.mp3';
import en1 from '../assets/audio/castle-king/en-1.mp3';
import en2 from '../assets/audio/castle-king/en-2.mp3';
import en3 from '../assets/audio/castle-king/en-3.mp3';
import laugh1 from '../assets/audio/castle-king/laugh-1.mp3';
import laugh2 from '../assets/audio/castle-king/laugh-2.mp3';
import laugh3 from '../assets/audio/castle-king/laugh-3.mp3';
import laugh4 from '../assets/audio/castle-king/laugh-4.mp3';

const ptFiles = [pt1, pt2, pt3];
const enFiles = [en1, en2, en3];

export const KING_VOICES = {
  'pt-BR': { clips: dialogue['pt-BR'].map((text, index) => ({ text, src: ptFiles[index] })) },
  'en-US': { clips: dialogue['en-US'].map((text, index) => ({ text, src: enFiles[index] })) },
};

export const KING_LAUGHS = [laugh1, laugh2, laugh3, laugh4];
