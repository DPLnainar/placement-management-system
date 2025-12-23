require('dotenv').config();
const fs = require('fs');

const keys = Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('Program'));
fs.writeFileSync('env_keys_dump.txt', JSON.stringify(keys, null, 2));
console.log('Dumped keys to env_keys_dump.txt');
