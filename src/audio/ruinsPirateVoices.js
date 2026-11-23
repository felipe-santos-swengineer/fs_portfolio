import dialogue from '../components/ruinsPirate.json';
import pt1 from '../assets/audio/ruins-pirate/pt-1.mp3';
import pt2 from '../assets/audio/ruins-pirate/pt-2.mp3';
import en1 from '../assets/audio/ruins-pirate/en-1.mp3';
import en2 from '../assets/audio/ruins-pirate/en-2.mp3';

export const RUINS_PIRATE_VOICES=Object.fromEntries(
  Object.entries({'pt-BR':[pt1,pt2],'en-US':[en1,en2]}).map(([locale,files])=>[locale,{
    clips:dialogue[locale].map((text,index)=>({text,src:files[index]})),
  }])
);
