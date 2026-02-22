const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { createInterface } = require('readline/promises');
const { stdin, stdout } = require('process');
const { syncReadset } = require('./sync-core');
const { loadConfig } = require('./systems-config');

const EXPECTED_GO_PATTERNS = [
  'internal/process/tasking/**/*.go',
  'internal/process/document/**/*.go',
  'internal/process/operation/**/impl.go',
  'internal/process/scoring/**/impl.go'
];

function hasExpectedProcessFiles(repoPath) {
  for (const pattern of EXPECTED_GO_PATTERNS) {
    const files = glob.sync(path.join(repoPath, pattern), { nodir: true });
    if (files.length > 0) {
      return true;
    }
  }

  return false;
}

async function promptRepoPath(systemKey) {
  const rl = createInterface({
    input: stdin,
    output: stdout
  });

  try {
    while (true) {
      const answer = await rl.question(`Enter repo path for ${systemKey}: `);
      const inputPath = answer.trim();

      if (!inputPath) {
        console.log('Path is required. Please try again.');
        continue;
      }

      const repoPath = path.resolve(inputPath);

      if (!fs.existsSync(repoPath)) {
        console.log(`Path does not exist: ${repoPath}`);
        continue;
      }

      let stat;
      try {
        stat = fs.statSync(repoPath);
      } catch (error) {
        console.log(`Unable to inspect path: ${error.message}`);
        continue;
      }

      if (!stat.isDirectory()) {
        console.log(`Path is not a directory: ${repoPath}`);
        continue;
      }

      if (!hasExpectedProcessFiles(repoPath)) {
        console.log(
          'No expected process files found. Make sure the repo contains internal/process/{tasking,document,operation,scoring}.'
        );
        continue;
      }

      return repoPath;
    }
  } finally {
    rl.close();
  }
}

async function runSyncForSystem(systemKey) {
  const config = loadConfig();
  const system = config.systems.find((item) => item.key === systemKey);

  if (!system) {
    const available = config.systems.map((item) => item.key).join(', ');
    throw new Error(
      `Unknown system "${systemKey}". Available systems: ${available || '(none)'}`
    );
  }

  const basePath = await promptRepoPath(system.key);

  return syncReadset({
    basePath,
    outputPublic: system.outputPublic,
    system: system.key
  });
}

module.exports = {
  runSyncForSystem
};
