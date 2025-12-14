require('dotenv').config();
const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    location: String,
    status: { type: String, default: 'active' },
    subscriptionStatus: { type: String, default: 'active' },
    contactEmail: String,
    contactPhone: String,
    address: String,
    website: String,
    establishedYear: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const College = mongoose.model('College', collegeSchema);

const seedColleges = [
    {
        name: 'Thiagarajar University',
        code: 'TU',
        location: 'Madurai, Tamil Nadu',
        status: 'active',
        subscriptionStatus: 'active',
        contactEmail: 'placement@tu.ac.in',
        contactPhone: '+91-452-2345678',
        address: 'Thiagarajar University, Madurai - 625009',
        website: 'https://www.tu.ac.in',
        establishedYear: 1949
    },
    {
        name: 'Anna University',
        code: 'AU',
        location: 'Chennai, Tamil Nadu',
        status: 'active',
        subscriptionStatus: 'active',
        contactEmail: 'placement@annauniv.edu',
        contactPhone: '+91-44-22357000',
        address: 'Anna University, Chennai - 600025',
        website: 'https://www.annauniv.edu',
        establishedYear: 1978
    },
    {
        name: 'PSG College of Technology',
        code: 'PSG',
        location: 'Coimbatore, Tamil Nadu',
        status: 'active',
        subscriptionStatus: 'active',
        contactEmail: 'placement@psgtech.edu',
        contactPhone: '+91-422-2572177',
        address: 'PSG College of Technology, Coimbatore - 641004',
        website: 'https://www.psgtech.edu',
        establishedYear: 1951
    }
];

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement';

console.log('🔄 Connecting to MongoDB...\n');

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Check if colleges already exist
        const existingCount = await College.countDocuments();

        if (existingCount > 0) {
            console.log(`ℹ️  Found ${existingCount} existing colleges`);
            console.log('Do you want to:');
            console.log('  1. Keep existing colleges');
            console.log('  2. Add new colleges (if codes don\'t conflict)');
            console.log('\nSkipping seed - colleges already exist.\n');

            const colleges = await College.find();
            console.log('Current colleges:');
            colleges.forEach(c => {
                console.log(`  ✓ ${c.name} (${c.code}) - ${c.location}`);
            });
        } else {
            console.log('📝 Creating seed colleges...\n');

            for (const collegeData of seedColleges) {
                try {
                    const college = await College.create(collegeData);
                    console.log(`  ✅ Created: ${college.name} (${college.code})`);
                } catch (error) {
                    console.log(`  ❌ Failed to create ${collegeData.name}: ${error.message}`);
                }
            }

            console.log('\n✨ Seed completed!\n');

            const finalCount = await College.countDocuments();
            console.log(`📊 Total colleges in database: ${finalCount}\n`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
