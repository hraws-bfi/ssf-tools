const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'systems.config.json');
const SYSTEM_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function createDefaultConfig() {
  return {
    version: 1,
    systems: [
      buildSystemEntry('ndf', 'NDF'),
      buildSystemEntry('ssf', 'SSF')
    ]
  };
}

function buildSystemEntry(key, name) {
  return {
    key,
    name,
    outputPublic: `public/readset-output-${key}.json`
  };
}

function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Invalid config: root must be an object');
  }

  if (config.version !== 1) {
    throw new Error('Invalid config: only version 1 is supported');
  }

  if (!Array.isArray(config.systems)) {
    throw new Error('Invalid config: "systems" must be an array');
  }

  const seenKeys = new Set();
  const systems = config.systems.map((system, index) => {
    if (!system || typeof system !== 'object' || Array.isArray(system)) {
      throw new Error(`Invalid config: systems[${index}] must be an object`);
    }

    const { key, name, outputPublic } = system;

    if (typeof key !== 'string' || !SYSTEM_KEY_PATTERN.test(key)) {
      throw new Error(
        `Invalid config: systems[${index}].key must match lowercase-kebab-case`
      );
    }

    if (seenKeys.has(key)) {
      throw new Error(`Invalid config: duplicate system key "${key}"`);
    }
    seenKeys.add(key);

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error(`Invalid config: systems[${index}].name must be a non-empty string`);
    }

    if (typeof outputPublic !== 'string' || outputPublic.trim().length === 0) {
      throw new Error(
        `Invalid config: systems[${index}].outputPublic must be a non-empty string`
      );
    }

    return {
      key: key.trim(),
      name: name.trim(),
      outputPublic: outputPublic.trim()
    };
  });

  systems.sort((a, b) => a.key.localeCompare(b.key));

  return {
    version: 1,
    systems
  };
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      `Config file not found at ${CONFIG_PATH}. Run "npm run add-readset-system" to create it.`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${CONFIG_PATH}: ${error.message}`);
  }

  return validateConfig(parsed);
}

function loadConfigOrDefault() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return createDefaultConfig();
  }

  return loadConfig();
}

function saveConfig(config) {
  const validated = validateConfig(config);
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(validated, null, 2)}\n`);
  return validated;
}

module.exports = {
  CONFIG_PATH,
  SYSTEM_KEY_PATTERN,
  buildSystemEntry,
  createDefaultConfig,
  loadConfig,
  loadConfigOrDefault,
  saveConfig,
  validateConfig
};
