const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'src/assets/audio/villagers');
const profiles = {
  Bia: { voice: 'pt-BR-FranciscaNeural', gender: 'female', tone: 'Calma e acolhedora', rate: '-3%' },
  Tom: { voice: 'pt-BR-AntonioNeural', gender: 'male', tone: 'Firme e descontraído', rate: '+0%' },
  Lia: { voice: 'pt-BR-ThalitaMultilingualNeural', gender: 'female', tone: 'Leve e animada', rate: '+5%' },
  Rui: { voice: 'en-US-BrianMultilingualNeural', gender: 'male', tone: 'Grave e acolhedor', rate: '-6%' },
};

async function main() {
  if (process.argv.includes('--list')) {
    const client = new MsEdgeTTS();
    const voices = await client.getVoices();
    console.log(JSON.stringify(voices.filter(v => v.Locale?.startsWith('pt') || /BrianMultilingual|AndrewMultilingual/.test(v.ShortName)), null, 2));
    client.close(); return;
  }
  const source = await fs.readFile(path.join(root, 'src/components/villagers.js'), 'utf8');
  const match = source.match(/export const VILLAGERS = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('Villager dialogue data was not found.');
  const villagers = vm.runInNewContext(`(${match[1]})`, {}, { timeout: 1000 });
  await fs.mkdir(output, { recursive: true });
  const manifest = [];
  for (const person of villagers) {
    const profile = profiles[person.name];
    const client = new MsEdgeTTS({ connectionTimeoutMs: 15000, synthesisTimeoutMs: 30000 });
    try {
      await client.setMetadata(profile.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { voiceLocale: 'pt-BR' });
      for (let i = 0; i < person.lines.length; i++) {
        const escaped = person.lines[i].replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        const result = await client.toFile(output, escaped, { rate: profile.rate, pitch: '+0Hz' });
        const filename = `${person.name.toLowerCase()}-${i + 1}.mp3`;
        const bytes = await fs.readFile(result.audioFilePath);
        if (bytes.length < 1000) throw new Error(`Empty audio: ${filename}`);
        await fs.writeFile(path.join(output, filename), bytes);
        // The library owns these temporary files; retain only the named clip.
        if (path.resolve(result.audioFilePath) !== path.join(output, filename)) await fs.unlink(result.audioFilePath);
        if (result.metadataFilePath) await fs.unlink(result.metadataFilePath).catch(() => {});
        manifest.push({ npc: person.name, line: i, text: person.lines[i], file: filename, locale: 'pt-BR', ...profile, bytes: bytes.length });
        console.log(`${person.name}: fala ${i + 1} — ${profile.voice} (${bytes.length} bytes)`);
      }
    } finally { client.close(); }
  }
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
