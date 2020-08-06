/* eslint-disable no-console */
/* eslint no-template-curly-in-string: "off" */
const shell = require('shelljs');

const args = process.argv;

// save arguments to object for options check below
const argStore = {};
args.forEach((val) => {
  if (val.match(/=/)) {
    const splitArg = val.split('=');
    const key = splitArg[0];
    const value = splitArg[1];
    argStore[key] = value;
  }
});

const { GITHUB_CHANGELOG_GENERATOR_TOKEN, GIT_HOME } = process.env;

if (!GITHUB_CHANGELOG_GENERATOR_TOKEN) {
  console.log('\u{1b}[33mA GitHub token is required to make the required number of requests to the GitHub API for release note generation.\u{1b}[0m');
} else {
  console.log('\u{1b}[32mA GitHub release note generation initiated. This will take a few minutes to complete.\u{1b}[0m');

  // run docker command by default, but allow ruby using command line argument
  const localWorldviewDir = `${GIT_HOME}/worldview`;
  const dockerContainerDir = '/usr/local/src/your-app';
  const cmdPrefix = argStore.ruby
    ? 'github_changelog_generator'
    : `docker run -i --rm -v ${localWorldviewDir}:${dockerContainerDir} ferrarimarco/github-changelog-generator`;

  // add --since TAG ARGUMENT to limit compiled release notes
  // NOTE: A complete API request of entire commit history is still required
  //       due to GitHub's API, so this won't save you much time
  const sinceOption = argStore.since ? ` --since-tag ${argStore.since}` : '';

  // add --release-branch BRANCH ARGUMENT. default branch is master
  const branchOption = argStore.branch ? ` --release-branch ${argStore.branch}` : '';

  const cmd = `${cmdPrefix} \
  --security-label '## External Dependency Updates:' --security-labels 'external dependency' \
  --removed-label '## Story Changes:' --removed-labels 'story,Story' \
  --deprecated-label '## Layer Changes:' --deprecated-labels 'layer,Layer' \
  ${sinceOption}${branchOption} --token ${GITHUB_CHANGELOG_GENERATOR_TOKEN}`;

  shell.exec(cmd);
}
