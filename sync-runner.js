const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');
const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { syncReadset } = require('./sync-core');
const { loadConfig } = require('./systems-config');

const EXPECTED_GO_PATTERNS = [
  'internal/process/tasking/**/*.go',
  'internal/process/document/**/*.go',
  'internal/operation/**/impl.go',
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

function resolveAndValidateRepoPath(inputPath) {
  if (!inputPath || inputPath.trim().length === 0) {
    throw new Error('Path is required.');
  }

  const repoPath = path.resolve(inputPath.trim());

  if (!fs.existsSync(repoPath)) {
    throw new Error(`Path does not exist: ${repoPath}`);
  }

  let stat;
  try {
    stat = fs.statSync(repoPath);
  } catch (error) {
    throw new Error(`Unable to inspect path: ${error.message}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${repoPath}`);
  }

  if (!hasExpectedProcessFiles(repoPath)) {
    throw new Error(
      'No expected process files found. Make sure the repo contains internal/process/{tasking,document,operation,scoring} or internal/operation.'
    );
  }

  return repoPath;
}

async function promptRepoPath(systemKey) {
  const rl = createInterface({
    input: stdin,
    output: stdout
  });

  try {
    while (true) {
      const answer = await rl.question(`Enter repo path for ${systemKey}: `);
      try {
        return resolveAndValidateRepoPath(answer);
      } catch (error) {
        console.log(error.message);
      }
    }
  } finally {
    rl.close();
  }
}

async function runSyncForSystem(systemKey, options = {}) {
  const config = loadConfig();
  const system = config.systems.find((item) => item.key === systemKey);

  if (!system) {
    const available = config.systems.map((item) => item.key).join(', ');
    throw new Error(
      `Unknown system "${systemKey}". Available systems: ${available || '(none)'}`
    );
  }

  const basePath = options.repoPath
    ? resolveAndValidateRepoPath(options.repoPath)
    : await promptRepoPath(system.key);

  return syncReadset({
    basePath,
    outputPublic: system.outputPublic,
    system: system.key
  });
}

module.exports = {
  resolveAndValidateRepoPath,
  runSyncForSystem
};
