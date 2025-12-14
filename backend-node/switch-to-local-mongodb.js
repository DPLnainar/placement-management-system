const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Comment out the Atlas connection and add local MongoDB
const lines = envContent.split('\n');
const newLines = lines.map(line => {
    if (line.trim().startsWith('MONGODB_URI=mongodb+srv://')) {
        return '# ' + line + '\n# Using local MongoDB instead:\nMONGODB_URI=mongodb://localhost:27017/placement';
    }
    return line;
});

fs.writeFileSync(envPath, newLines.join('\n'));
console.log('✓ Switched to local MongoDB connection');
console.log('✓ MongoDB URI: mongodb://localhost:27017/placement');
