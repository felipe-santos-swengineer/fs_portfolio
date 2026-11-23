const fs=require('node:fs/promises');
const path=require('node:path');
const {MsEdgeTTS,OUTPUT_FORMAT}=require('msedge-tts');
const lines=require('../src/components/ruinsPirate.json');
(async()=>{
 const output=path.resolve('src/assets/audio/ruins-pirate'); await fs.mkdir(output,{recursive:true});
 for(const [locale,voice,prefix] of [['pt-BR','pt-BR-AntonioNeural','pt'],['en-US','en-US-BrianNeural','en']]) {
  const client=new MsEdgeTTS({connectionTimeoutMs:15000,synthesisTimeoutMs:30000});
  try {await client.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,{voiceLocale:locale});
   for(let i=0;i<lines[locale].length;i++) {
    const result=await client.toFile(output,lines[locale][i],{rate:'-4%',pitch:'+0Hz'});
    const data=await fs.readFile(result.audioFilePath);if(data.length<1000)throw Error('Empty voice clip');
    await fs.writeFile(path.join(output,`${prefix}-${i+1}.mp3`),data);
    if(path.resolve(result.audioFilePath)!==path.join(output,`${prefix}-${i+1}.mp3`))await fs.unlink(result.audioFilePath);
    if(result.metadataFilePath)await fs.unlink(result.metadataFilePath).catch(()=>{});
    console.log(`${prefix}-${i+1}: ${data.length} bytes`);
   }
  } finally {client.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
