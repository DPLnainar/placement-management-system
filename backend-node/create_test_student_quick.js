/**
 * Create Test Student Account
 * Quick script to create a student for testing
 */

const mongoose = require('mongoose');
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

const createTestStudent = async () => {
    try {
        const User = mongoose.model('User');
        const StudentData = mongoose.model('StudentData');

        // Get the college ID
        const College = mongoose.model('College');
        const college = await College.findOne({ status: 'active' });

        if (!college) {
            console.error('❌ No active college found');
            process.exit(1);
        }

        console.log(`📍 Using College: ${college.name} (${college._id})`);

        // Check if student already exists
        let user = await User.findOne({ username: 'student1_tu' });

        if (user) {
            console.log('✅ Test student already exists!');
            console.log(`   Username: student1_tu`);
            console.log(`   Password: student123`);
            console.log(`   College: ${college.name}`);
        } else {
            // Create user account
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('student123', 10);

            user = new User({
                username: 'student1_tu',
                email: 'student1@test.com',
                password: hashedPassword,
                fullName: 'Test Student One',
                role: 'student',
                status: 'active',
                collegeId: college._id
            });

            await user.save();
            console.log('✅ Created test student user account');

            // Create student profile
            const studentData = new StudentData({
                userId: user._id,
                collegeId: college._id,
                personal: {
                    name: 'Test Student One',
                    email: 'student1@test.com',
                    phone: '1234567890',
                    branch: 'Computer Science'
                },
                rollNumber: 'TEST001',
                cgpa: 8.5,
                semester: 6,
                verificationStatus: 'VERIFIED'
            });

            await studentData.save();
            console.log('✅ Created student profile');

            console.log('\n🎉 Test student created successfully!');
            console.log('\n📝 Login Credentials:');
            console.log(`   Username: student1_tu`);
            console.log(`   Password: student123`);
            console.log(`   College: ${college.name}`);
        }

    } catch (error) {
        console.error('❌ Error creating test student:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(createTestStudent);
