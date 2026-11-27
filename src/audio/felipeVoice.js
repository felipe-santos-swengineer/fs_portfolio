import lines from '../assets/audio/pt-br/villagers/felipe-dialogues.json';
import first from '../assets/audio/pt-br/villagers/felipe-1.mp3';
import second from '../assets/audio/pt-br/villagers/felipe-2.mp3';

export const FELIPE_LINES = lines;
export const FELIPE_VOICE = { clips: lines.map((text, index) => ({ text, src: [first, second][index] })) };
