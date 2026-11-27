import dialogue from '../components/cursedCastleDialogue.json';
import pt1 from '../assets/audio/pt-br/cursed-castle-npc/1.mp3';
import pt2 from '../assets/audio/pt-br/cursed-castle-npc/2.mp3';
import pt3 from '../assets/audio/pt-br/cursed-castle-npc/3.mp3';
import en1 from '../assets/audio/en-us/cursed-castle-npc/1.mp3';
import en2 from '../assets/audio/en-us/cursed-castle-npc/2.mp3';
import en3 from '../assets/audio/en-us/cursed-castle-npc/3.mp3';
export const CURSED_CASTLE_VOICES = Object.fromEntries(Object.entries({ 'pt-BR':[pt1,pt2,pt3], 'en-US':[en1,en2,en3] }).map(([locale,files])=>[locale,{clips:dialogue[locale].map((text,index)=>({text,src:files[index]}))}]));
