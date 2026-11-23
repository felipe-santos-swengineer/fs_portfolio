import dialogue from '../components/dragonDialogue.json';
import pt2 from '../assets/audio/dragon/pt-elevenlabs-1.mp3';
import pt3 from '../assets/audio/dragon/pt-elevenlabs-2.mp3';
import pt4 from '../assets/audio/dragon/pt-elevenlabs-3.mp3';
import en2 from '../assets/audio/dragon/en-finevoice-1.mp3';
import en3 from '../assets/audio/dragon/en-finevoice-2.mp3';
import en4 from '../assets/audio/dragon/en-finevoice-3.mp3';
export const DRAGON_VOICES=Object.fromEntries(Object.entries({'pt-BR':[pt2,pt3,pt4],'en-US':[en2,en3,en4]}).map(([locale,files])=>[locale,{clips:dialogue[locale].map((text,index)=>({text,src:files[index]}))}]));
