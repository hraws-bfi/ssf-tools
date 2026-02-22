const { runSyncForSystem } = require('./sync-runner');
const { loadConfig, CONFIG_PATH } = require('./systems-config');
const { createInterface } = require('readline/promises');
const { stdin, stdout } = require('process');

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

  if (args.length > 1) {
    console.error('Usage: npm run sync-readset -- [system-key]');
    console.error('Run without args to choose from an interactive system list.');
    process.exit(1);
  }

  const systemKey =
    args.length === 1
      ? args[0]
      : await selectSystemFromPrompt();

  await runSyncForSystem(systemKey);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
