const fs=require('node:fs/promises'), path=require('node:path');
const {MsEdgeTTS,OUTPUT_FORMAT}=require('msedge-tts');const lines=require('../src/components/caveDialogue.json');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{const out=path.resolve('src/assets/audio/cave');await fs.mkdir(out,{recursive:true});
for(const [locale,prefix] of [['pt-BR','pt'],['en-US','en']])for(let i=0;i<lines[locale].length;i++){
const voice=locale==='pt-BR'?(i?'pt-BR-FranciscaNeural':'pt-BR-AntonioNeural'):(i?'en-US-JennyNeural':'en-US-BrianNeural');let done=false;
for(let attempt=0;attempt<6&&!done;attempt++){const client=new MsEdgeTTS({connectionTimeoutMs:15000,synthesisTimeoutMs:30000});try{await client.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,{voiceLocale:locale});const result=await client.toFile(out,lines[locale][i]);const data=await fs.readFile(result.audioFilePath);if(data.length<1000)throw Error('Empty clip');const target=path.join(out,`${prefix}-${i+1}.mp3`);await fs.writeFile(target,data);if(path.resolve(result.audioFilePath)!==target)await fs.unlink(result.audioFilePath);if(result.metadataFilePath)await fs.unlink(result.metadataFilePath).catch(()=>{});done=true;console.log(prefix,i+1);}catch(e){if(attempt===5)throw e;await sleep(10000);}finally{client.close();}}await sleep(1000);}
})().catch(e=>{console.error(e);process.exitCode=1;});
