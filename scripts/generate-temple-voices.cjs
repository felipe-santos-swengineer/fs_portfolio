const fs=require('node:fs/promises'), path=require('node:path');
const {MsEdgeTTS,OUTPUT_FORMAT}=require('msedge-tts');
const lines=require('../src/components/templeDialogue.json');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
for(const [locale,prefix] of [['pt-BR','pt'],['en-US','en']]){
const output=path.resolve('src/assets/audio',locale==='pt-BR'?'pt-br':'en-us','temple');
await fs.mkdir(output,{recursive:true});
for(let i=Number(process.argv[2] || 0);i<lines[locale].length;i++){
 const female=[1,2,5,7,9,10,12].includes(i),voice=locale==='pt-BR'?(female?'pt-BR-FranciscaNeural':'pt-BR-AntonioNeural'):(female?'en-US-JennyNeural':'en-US-BrianNeural');
 let complete=false;
 for(let attempt=0;attempt<6&&!complete;attempt++){const client=new MsEdgeTTS({connectionTimeoutMs:15000,synthesisTimeoutMs:30000});
 try{await client.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,{voiceLocale:locale});const result=await client.toFile(output,lines[locale][i]);const data=await fs.readFile(result.audioFilePath);if(data.length<1000)throw Error('Empty voice clip');const target=path.join(output,`${i+1}.mp3`);await fs.writeFile(target,data);if(path.resolve(result.audioFilePath)!==target)await fs.unlink(result.audioFilePath);if(result.metadataFilePath)await fs.unlink(result.metadataFilePath).catch(()=>{});complete=true;console.log(prefix,i+1);}
 catch(e){if(attempt===5)throw e;console.log('Retry',prefix,i+1,attempt+1);await wait(10000);}finally{client.close();}}
 await wait(1500);
}}})().catch(e=>{console.error(e);process.exitCode=1;});
