const { resolveCommitId } = require('../scripts/build-version.cjs');

const sha='0123456789abcdef0123456789abcdef01234567';
test('uses the checked-out commit, including shallow checkouts', () => {
  const git=jest.fn().mockReturnValue(`${sha}\n`);
  expect(resolveCommitId({runGit:git,env:{}})).toBe(sha);
  expect(git).toHaveBeenCalledWith('git',['rev-parse','--verify','HEAD'],expect.any(Object));
});

test('falls back to a valid CI commit when Git metadata is unavailable', () => {
  const git=()=>{throw new Error('No repository');};
  expect(resolveCommitId({runGit:git,env:{GITHUB_SHA:sha}})).toBe(sha);
  expect(resolveCommitId({runGit:git,env:{GITHUB_SHA:'not-a-commit'}})).toBe('indisponivel');
});
