const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const allowed = ['Marina', 'Bia', 'Tom', 'Lia', 'Rui'];

async function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--character');
  const name = index < 0 ? '' : args[index + 1];
  if (!allowed.includes(name)) throw new Error('Choose --character Marina, Bia, Tom, Lia or Rui.');
  const dryRun = args.includes('--dry-run');
  let lines;
  if (name === 'Marina') {
    lines = JSON.parse(await fs.readFile(path.join(root, 'src/components/lakeGuide.json'), 'utf8'))['pt-BR'];
  } else {
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/assets/audio/villagers/manifest.json'), 'utf8'));
    lines = manifest.filter(row => row.npc === name).sort((a,b) => a.line-b.line).map(row => row.text);
  }
  if (!lines?.length) throw new Error('No dialogue found for this character.');
  const destination = path.join(root, 'src/assets/audio/elevenlabs-preview', name.toLowerCase());
  const count = lines.reduce((sum, line) => sum + [...line].length, 0);
  console.log(`${name}: ${lines.length} clips, ${count} characters. Preview directory: ${destination}`);
  if (dryRun) return;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) throw new Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in your environment.');
  const model = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const clips = [];
  for (let i=0; i<lines.length; i++) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method:'POST', headers:{'xi-api-key':apiKey,'Content-Type':'application/json','Accept':'audio/mpeg'},
      body:JSON.stringify({text:lines[i],model_id:model}),
    });
    if (!response.ok) throw new Error(`ElevenLabs request for clip ${i+1} failed (HTTP ${response.status}).`);
    if (!response.headers.get('content-type')?.startsWith('audio/')) throw new Error(`Clip ${i+1} was not audio.`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length<1000) throw new Error(`Clip ${i+1} was unexpectedly small.`);
    clips.push(buffer);
  }
  await fs.mkdir(destination,{recursive:true});
  for(let i=0;i<clips.length;i++) await fs.writeFile(path.join(destination,`${name.toLowerCase()}-${i+1}.mp3`),clips[i]);
  console.log('Preview clips generated. Existing game audio was not replaced.');
}
main().catch(error=>{ console.error(error.message); process.exitCode=1; });
