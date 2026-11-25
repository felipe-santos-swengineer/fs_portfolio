const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..', 'node_modules', 'chess.js');
const incorrectSource = '../../../src/chess.ts';
const correctedSource = '../../src/chess.ts';

for (const format of ['cjs', 'esm']) {
  const mapPath = path.join(packageRoot, 'dist', format, 'chess.js.map');
  if (!fs.existsSync(mapPath)) continue;

  const sourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  if (!sourceMap.sources.includes(incorrectSource)) continue;

  const sourcePath = path.resolve(path.dirname(mapPath), correctedSource);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Expected chess.js source file was not found: ${sourcePath}`);
  }

  sourceMap.sources = sourceMap.sources.map(source =>
    source === incorrectSource ? correctedSource : source
  );
  fs.writeFileSync(mapPath, JSON.stringify(sourceMap));
}
