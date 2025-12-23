const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const mongoURI = 'mongodb+srv://ganeshkumarngk2005_db_user:Ganesh%402005@cluster0.fgq6tcx.mongodb.net/placement?appName=Cluster0&retryWrites=true&w=majority';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    let found = false;
    const newLines = lines.map(line => {
        if (line.trim().startsWith('MONGODB_URI=')) {
            found = true;
            return `MONGODB_URI=${mongoURI}`;
        }
        return line;
    });

    if (!found) {
        newLines.push(`MONGODB_URI=${mongoURI}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('Successfully updated MONGODB_URI in .env');
} catch (error) {
    console.error('Error updating .env:', error);
    process.exit(1);
}
