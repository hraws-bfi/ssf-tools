const { syncReadset } = require('./sync-core');

const basePath = process.argv[2] || '.';

syncReadset({
  basePath,
  outputPublic: 'public/readset-output-ssf.json',
  outputRoot: 'readset-output-ssf.json',
  system: 'ssf'
}).catch(() => process.exit(1));
