const fs=require('node:fs/promises'),path=require('node:path');
const {MsEdgeTTS,OUTPUT_FORMAT}=require('msedge-tts');
const lines=require('../src/components/princessDialogue.json');
(async()=>{
for(const [locale,prefix,voice] of [['pt-BR','pt','pt-BR-FranciscaNeural'],['en-US','en','en-US-JennyNeural']]){
const dir=path.resolve('src/assets/audio',locale==='pt-BR'?'pt-br':'en-us','princess');
await fs.mkdir(dir,{recursive:true});
for(let i=0;i<lines[locale].length;i++){
const client=new MsEdgeTTS({connectionTimeoutMs:15000,synthesisTimeoutMs:30000});try{await client.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,{voiceLocale:locale});const result=await client.toFile(dir,lines[locale][i],{rate:'-5%'});const data=await fs.readFile(result.audioFilePath);if(data.length<1000)throw Error('Empty audio');const target=path.join(dir,`${i+1}.mp3`);await fs.writeFile(target,data);if(path.resolve(result.audioFilePath)!==target)await fs.unlink(result.audioFilePath);if(result.metadataFilePath)await fs.unlink(result.metadataFilePath).catch(()=>{});console.log(prefix,i+1);}finally{client.close();}
}}})().catch(e=>{console.error(e);process.exitCode=1;});
