const { execFileSync, spawn } = require('node:child_process');

const action = process.argv[2];
if (!['start', 'build'].includes(action)) {
  throw new Error('Use start or build.');
}

let commitCount = 'indisponivel';
try {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
  const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], options).trim();
  const count = execFileSync('git', ['rev-list', '--count', 'HEAD'], options).trim();
  if (shallow === 'false' && /^\d+$/.test(count)) commitCount = count;
} catch {
  // A source archive may not contain Git history.
}

const version = commitCount;
console.log(`Versao do portfolio: ${version}`);
const child = spawn(process.execPath, [require.resolve('react-scripts/bin/react-scripts.js'), action], {
  stdio: 'inherit',
  env: { ...process.env, REACT_APP_BUILD_VERSION: version },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exitCode = code ?? 1; });
