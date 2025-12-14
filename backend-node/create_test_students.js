/**
 * Create Test Students for Verification Queue
 * 
 * This script creates test students with PENDING verification status
 * so you can test the complete verification workflow.
 * 
 * Usage: node create_test_students.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Import models (adjust paths as needed)
const StudentData = require('./src/models/StudentData');
const User = require('./src/models/User');

const createTestStudents = async () => {
    try {
        console.log('\n🚀 Creating test students for verification queue...\n');

        // Find a college (use the first one)
        const User = mongoose.model('User');
        const admin = await User.findOne({ role: 'admin' });

        if (!admin || !admin.collegeId) {
            console.error('❌ No admin found with collegeId. Please create a college first.');
            process.exit(1);
        }

        const collegeId = admin.collegeId;
        console.log(`📍 Using College ID: ${collegeId}`);

        // Test student data
        const testStudents = [
            {
                email: 'test.student1@example.com',
                name: 'John Doe',
                branch: 'Computer Science',
                cgpa: 8.5,
                semester: 6,
                rollNumber: 'CS2021001'
            },
            {
                email: 'test.student2@example.com',
                name: 'Jane Smith',
                branch: 'Computer Science',
                cgpa: 9.2,
                semester: 6,
                rollNumber: 'CS2021002'
            },
            {
                email: 'test.student3@example.com',
                name: 'Bob Johnson',
                branch: 'Electronics',
                cgpa: 7.8,
                semester: 6,
                rollNumber: 'EC2021001'
            }
        ];

        let created = 0;
        let updated = 0;

        for (const studentData of testStudents) {
            // Check if student already exists
            let student = await StudentData.findOne({
                'personal.email': studentData.email
            });

            if (student) {
                // Update existing student to PENDING status
                student.verificationStatus = 'PENDING';
                student.lastVerificationRequest = new Date();
                student.verificationTriggers = [
                    {
                        field: 'CGPA',
                        oldValue: '8.0',
                        newValue: studentData.cgpa.toString(),
                        timestamp: new Date()
                    }
                ];
                await student.save();
                updated++;
                console.log(`✏️  Updated: ${studentData.name} - Set to PENDING`);
            } else {
                // Create new student
                student = new StudentData({
                    collegeId: collegeId,
                    personal: {
                        name: studentData.name,
                        email: studentData.email,
                        phone: '1234567890',
                        branch: studentData.branch
                    },
                    rollNumber: studentData.rollNumber,
                    cgpa: studentData.cgpa,
                    semester: studentData.semester,
                    verificationStatus: 'PENDING',
                    lastVerificationRequest: new Date(),
                    verificationTriggers: [
                        {
                            field: 'Profile Created',
                            oldValue: '',
                            newValue: 'Initial submission',
                            timestamp: new Date()
                        }
                    ]
                });
                await student.save();
                created++;
                console.log(`✅ Created: ${studentData.name} - PENDING verification`);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Created: ${created} students`);
        console.log(`   Updated: ${updated} students`);
        console.log(`   Total PENDING: ${created + updated} students`);
        console.log('\n✅ Test students ready for verification!\n');
        console.log('🔗 Go to: http://localhost:3000/dashboard');
        console.log('   Navigate to Verification Queue to see the students.\n');

    } catch (error) {
        console.error('❌ Error creating test students:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB');
    }
};

// Run the script
connectDB().then(createTestStudents);
