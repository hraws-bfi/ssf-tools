const { createInterface } = require('readline/promises');
const { stdin, stdout } = require('process');
const {
  CONFIG_PATH,
  SYSTEM_KEY_PATTERN,
  buildSystemEntry,
  loadConfigOrDefault,
  saveConfig
} = require('./systems-config');

function defaultSystemName(key) {
  return key.toUpperCase();
}

async function promptNewSystem(config) {
  const existingKeys = new Set(config.systems.map((system) => system.key));
  const rl = createInterface({
    input: stdin,
    output: stdout
  });

  try {
    let key = '';
    while (!key) {
      const value = (await rl.question('System key (lowercase-kebab): ')).trim();
      if (!value) {
        console.log('System key is required.');
        continue;
      }

      if (!SYSTEM_KEY_PATTERN.test(value)) {
        console.log('Invalid key format. Use lowercase-kebab-case, e.g. "abc-core".');
        continue;
      }

      if (existingKeys.has(value)) {
        console.log(`System key "${value}" already exists.`);
        continue;
      }

      key = value;
    }

    const suggestedName = defaultSystemName(key);
    const enteredName = await rl.question(`Display name [${suggestedName}]: `);
    const name = enteredName.trim() || suggestedName;

    return buildSystemEntry(key, name);
  } finally {
    rl.close();
  }
}

async function main() {
  const config = loadConfigOrDefault();
  const newSystem = await promptNewSystem(config);

  config.systems.push(newSystem);
  saveConfig(config);

  console.log(`Added system "${newSystem.key}" in ${CONFIG_PATH}`);
  console.log(`Next: npm run sync-readset -- ${newSystem.key}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
