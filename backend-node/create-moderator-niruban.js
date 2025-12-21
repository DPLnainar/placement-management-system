/**
 * Create Moderator Account - niruban
 * Creates a moderator account for testing the verification workflow
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const createModerator = async () => {
    try {
        const db = mongoose.connection.db;

        // Check if moderator already exists
        const existing = await db.collection('users').findOne({ username: 'niruban' });
        if (existing) {
            console.log('✅ Moderator "niruban" already exists!');
            console.log('   Username: niruban');
            console.log('   College ID:', existing.collegeId);
            console.log('   Department:', existing.department);
            return;
        }

        // Find a college to assign
        const college = await db.collection('colleges').findOne({ status: 'active' });

        if (!college) {
            console.log('❌ No active college found. Creating a default college first...');

            // Create a default college
            const newCollege = {
                name: 'Test College',
                code: 'TC001',
                address: 'Test Address',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456',
                phone: '+911234567890',
                email: 'admin@testcollege.edu',
                website: 'https://testcollege.edu',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const collegeResult = await db.collection('colleges').insertOne(newCollege);
            console.log('✅ Created default college:', collegeResult.insertedId);
            var collegeId = collegeResult.insertedId;
        } else {
            var collegeId = college._id;
            console.log('📍 Using existing college:', college.name, '(', collegeId, ')');
        }

        // Get a sample student to match department
        const sampleStudent = await db.collection('studentdatas').findOne({});
        const department = sampleStudent?.personal?.branch || 'Computer Science';

        console.log('📍 Department:', department);

        // Hash password
        const hashedPassword = await bcrypt.hash('niruban', 10);

        // Create moderator user
        const moderator = {
            username: 'niruban',
            email: 'niruban@testcollege.edu',
            password: hashedPassword,
            fullName: 'Niruban Moderator',
            role: 'moderator',
            department: department,
            collegeId: collegeId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(moderator);

        console.log('\n✅ Moderator created successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('   Username: niruban');
        console.log('   Password: niruban');
        console.log('   College ID:', collegeId);
        console.log('   Department:', department);
        console.log('\n🔧 Now updating all students to match this college...');

        // Update all students to have the same college ID
        const updateResult = await db.collection('studentdatas').updateMany(
            {},
            { $set: { collegeId: collegeId } }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} students with college ID: ${collegeId}`);
        console.log('\n🎉 Setup complete! You can now log in as moderator and approve students.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(createModerator);
