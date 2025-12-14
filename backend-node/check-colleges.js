require('dotenv').config();
const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: String,
    code: String,
    location: String,
    status: String,
    subscriptionStatus: String
});

const College = mongoose.model('College', collegeSchema);

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement';

console.log('Connecting to MongoDB...');
console.log('URI:', mongoUri.substring(0, 30) + '...');

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Check existing colleges
        const colleges = await College.find();
        console.log(`Found ${colleges.length} colleges in database\n`);

        if (colleges.length > 0) {
            console.log('Existing colleges:');
            colleges.forEach(c => {
                console.log(`  - ${c.name} (${c.code}) - Status: ${c.status}`);
            });
        } else {
            console.log('⚠️  No colleges found in database!');
            console.log('This is why the college dropdown is empty.\n');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
