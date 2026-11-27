const fs = require('node:fs/promises');
const path = require('node:path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'src/assets/audio/pt-br/villagers');
async function main() {
  const lines = JSON.parse((await fs.readFile(path.join(output, 'felipe-dialogues.json'), 'utf8')).replace(/^\uFEFF/, ''));
  await fs.mkdir(output, { recursive: true });
  const client = new MsEdgeTTS({ connectionTimeoutMs: 15000, synthesisTimeoutMs: 30000 });
  try {
    await client.setMetadata('pt-BR-AntonioNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { voiceLocale: 'pt-BR' });
    for (let i=0;i<lines.length;i++) {
      const result=await client.toFile(output, lines[i].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'), { rate:'-5%', pitch:'+0Hz' });
      const bytes=await fs.readFile(result.audioFilePath);
      if(bytes.length<1000) throw new Error('A gravação recebida está vazia.');
      const destination=path.join(output,`felipe-${i+1}.mp3`);
      await fs.writeFile(destination,bytes);
      if(path.resolve(result.audioFilePath)!==destination) await fs.unlink(result.audioFilePath);
      if(result.metadataFilePath) await fs.unlink(result.metadataFilePath).catch(()=>{});
      console.log(`Fala ${i+1}: ${bytes.length} bytes`);
    }
  } finally { client.close(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
