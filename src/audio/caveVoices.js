import dialogue from '../components/caveDialogue.json';
import pt1 from '../assets/audio/cave/pt-1.mp3';
import pt2 from '../assets/audio/cave/pt-2.mp3';
import en1 from '../assets/audio/cave/en-1.mp3';
import en2 from '../assets/audio/cave/en-2.mp3';
export const CAVE_VOICES=Object.fromEntries(Object.entries({'pt-BR':[pt1,pt2],'en-US':[en1,en2]}).map(([locale,files])=>[locale,{clips:dialogue[locale].map((text,index)=>({text,src:files[index]}))}]));
