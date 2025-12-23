const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const mongoURI = 'mongodb+srv://ganeshkumarngk2005_db_user:Ganesh%402005@cluster0.fgq6tcx.mongodb.net/placement?appName=Cluster0&retryWrites=true&w=majority';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Naive cleanup: if everything is on one line or weirdly concatenated
    // We'll try to split by known keys if newlines are missing, but let's first see if we can just append/replace.
    // Actually, best to recreate the important parts if it looks garbage.

    // Let's read lines.
    let lines = envContent.split(/\r?\n/);

    // Filter out MONGODB_URI lines
    let newLines = lines.filter(line => !line.trim().startsWith('MONGODB_URI='));

    // Add the correct URI at the top
    newLines.unshift(`MONGODB_URI=${mongoURI}`);

    // Join back
    let newContent = newLines.join('\n');

    // Fix the specific observed corruption: "USE_S3=trueap-south-1" -> "USE_S3=true\nAWS_REGION=ap-south-1" (guessing)
    // Actually, I shouldn't guess too much, but let's try to simple fixes or just leave other things alone if they aren't critical for mongo.

    fs.writeFileSync(envPath, newContent);
    console.log('Cleaned and updated .env with MONGODB_URI');
    console.log('New MONGODB_URI:', mongoURI);

} catch (error) {
    console.error('Error cleaning .env:', error);
}
