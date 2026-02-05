const { syncReadset } = require('./sync-core');

const basePath = process.argv[2] || '.';

syncReadset({
  basePath,
  outputPublic: 'public/readset-output-ndf.json',
  outputRoot: 'readset-output-ndf.json',
  system: 'ndf'
}).catch(() => process.exit(1));
