
// Set the TS_NODE_PROJECT environment variable to point to the production tsconfig
process.env.TS_NODE_PROJECT = 'tsconfig.prod.json';

// Register tsconfig-paths to resolve aliases based on tsconfig.prod.json
require('tsconfig-paths/register');

// Start the application
require('./dist/server.js');
