const { spawn } = require('node:child_process');
const { resolveCommitId } = require('./build-version.cjs');

const action = process.argv[2];
if (!['start', 'build'].includes(action)) {
  throw new Error('Use start or build.');
}

const version = resolveCommitId();
console.log(`Versao do portfolio: ${version}`);
const child = spawn(process.execPath, [require.resolve('react-scripts/bin/react-scripts.js'), action], {
  stdio: 'inherit',
  env: { ...process.env, REACT_APP_BUILD_VERSION: version },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exitCode = code ?? 1; });
