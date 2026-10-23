import bia1 from '../assets/audio/villagers/bia-1.mp3';
import bia2 from '../assets/audio/villagers/bia-2.mp3';
import tom1 from '../assets/audio/villagers/tom-1.mp3';
import tom2 from '../assets/audio/villagers/tom-2.mp3';
import lia1 from '../assets/audio/villagers/lia-1.mp3';
import lia2 from '../assets/audio/villagers/lia-2.mp3';
import rui1 from '../assets/audio/villagers/rui-1.mp3';
import rui2 from '../assets/audio/villagers/rui-2.mp3';
import manifest from '../assets/audio/villagers/manifest.json';

const files = { 'bia-1.mp3': bia1, 'bia-2.mp3': bia2, 'tom-1.mp3': tom1, 'tom-2.mp3': tom2, 'lia-1.mp3': lia1, 'lia-2.mp3': lia2, 'rui-1.mp3': rui1, 'rui-2.mp3': rui2 };

export const VILLAGER_VOICES = Object.fromEntries(['Bia', 'Tom', 'Lia', 'Rui'].map(name => {
  const rows = manifest.filter(row => row.npc === name);
  return [name, {
    gender: rows[0].gender,
    tone: rows[0].tone,
    clips: rows.map(row => ({ text: row.text, src: files[row.file] })),
  }];
}));
