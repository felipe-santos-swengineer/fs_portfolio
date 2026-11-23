const { execFileSync } = require('node:child_process');

const isCommitId = value => /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value);

function resolveCommitId({ runGit = execFileSync, env = process.env } = {}) {
  try {
    const id = runGit('git', ['rev-parse', '--verify', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (isCommitId(id)) return id.toLowerCase();
  } catch {
    // Source archives may not include Git metadata.
  }
  const ciCommit = (env.GITHUB_SHA || '').trim();
  return isCommitId(ciCommit) ? ciCommit.toLowerCase() : 'indisponivel';
}

module.exports = { resolveCommitId };
