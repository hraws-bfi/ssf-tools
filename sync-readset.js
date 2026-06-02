const { runSyncForSystem } = require('./sync-runner');
const { loadConfig, CONFIG_PATH } = require('./systems-config');
const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

async function selectSystemFromPrompt() {
  const config = loadConfig();
  const systems = config.systems || [];

  if (systems.length === 0) {
    throw new Error(`No systems configured in ${CONFIG_PATH}`);
  }

  console.log('Available systems:');
  for (let i = 0; i < systems.length; i++) {
    const system = systems[i];
    console.log(`${i + 1}. ${system.key} (${system.name})`);
  }

  const rl = createInterface({
    input: stdin,
    output: stdout
  });

  try {
    while (true) {
      const answer = (await rl.question('Select system number: ')).trim();
      const index = Number(answer);

      if (!Number.isInteger(index) || index < 1 || index > systems.length) {
        console.log(`Invalid selection. Enter a number between 1 and ${systems.length}.`);
        continue;
      }

      return systems[index - 1].key;
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let repoPath;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--repo-path') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        console.error('Missing value for --repo-path');
        process.exit(1);
      }
      repoPath = value;
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run sync-readset -- [system-key] [--repo-path <local-path>]');
      console.log('Run without system-key to choose from an interactive system list.');
      process.exit(0);
    }

    if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }

    positional.push(arg);
  }

  if (positional.length > 1) {
    console.error('Usage: npm run sync-readset -- [system-key] [--repo-path <local-path>]');
    console.error('Run without args to choose from an interactive system list.');
    process.exit(1);
  }

  const systemKey =
    positional.length === 1
      ? positional[0]
      : await selectSystemFromPrompt();

  await runSyncForSystem(systemKey, { repoPath });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
