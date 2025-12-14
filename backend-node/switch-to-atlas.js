const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Remove the local MongoDB line and uncomment the Atlas connection
const lines = envContent.split('\n');
const newLines = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the local MongoDB line we added
    if (line.trim() === 'MONGODB_URI=mongodb://localhost:27017/placement') {
        continue;
    }

    // Skip the comment we added
    if (line.trim() === '# Using local MongoDB instead:') {
        continue;
    }

    // Uncomment the Atlas connection
    if (line.trim().startsWith('# MONGODB_URI=mongodb+srv://')) {
        newLines.push(line.substring(2)); // Remove the "# " prefix
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(envPath, newLines.join('\n'));
console.log('✓ Switched back to MongoDB Atlas connection');
console.log('✓ Please ensure your Atlas cluster is accessible');
