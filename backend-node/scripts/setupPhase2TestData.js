require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');
const StudentData = require('../models/StudentData');
const Job = require('../models/Job');

/**
 * Phase 2 Test Data Setup
 * Creates complete test environment for job application workflow
 */

const setupPhase2TestData = async () => {
    try {
        console.log('\n🚀 Setting up Phase 2 Test Data...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Create Test College
        console.log('📚 Creating Test College...');
        let testCollege = await College.findOne({ code: 'TEC' });

        if (!testCollege) {
            testCollege = await College.create({
                name: 'Test Engineering College',
                code: 'TEC',
                location: 'Test City, Test State',
                contactEmail: 'admin@testcollege.edu',
                contactPhone: '+91-9876543210',
                status: 'active'
            });
            console.log(`   ✅ College created: ${testCollege.name} (${testCollege.code})`);
        } else {
            console.log(`   ℹ️  College already exists: ${testCollege.name} (${testCollege.code})`);
        }

        // 2. Create College Admin
        console.log('\n👤 Creating College Admin...');
        let collegeAdmin = await User.findOne({ username: 'testadmin' });

        if (!collegeAdmin) {
            collegeAdmin = new User({
                username: 'testadmin',
                email: 'testadmin@testcollege.edu',
                password: 'TestAdmin123!',
                fullName: 'Test Admin',
                role: 'admin',
                collegeId: testCollege._id,
                department: 'Computer Science',
                status: 'active',
                isApproved: true
            });
            await collegeAdmin.save();
            console.log(`   ✅ Admin created: ${collegeAdmin.username}`);
        } else {
            console.log(`   ℹ️  Admin already exists: ${collegeAdmin.username}`);
        }

        // 3. Create Moderator
        console.log('\n👨‍🏫 Creating Moderator...');
        let moderator = await User.findOne({ username: 'testmod' });

        if (!moderator) {
            moderator = new User({
                username: 'testmod',
                email: 'testmod@testcollege.edu',
                password: 'TestMod123!',
                fullName: 'Test Moderator',
                role: 'moderator',
                collegeId: testCollege._id,
                department: 'Computer Science',
                assignedBy: collegeAdmin._id,
                status: 'active',
                isApproved: true
            });
            await moderator.save();
            console.log(`   ✅ Moderator created: ${moderator.username}`);
        } else {
            console.log(`   ℹ️  Moderator already exists: ${moderator.username}`);
        }

        // 4. Create Test Students
        console.log('\n🎓 Creating Test Students...');
        const students = [
            {
                username: 'teststudent1',
                email: 'student1@testcollege.edu',
                fullName: 'Test Student One',
                rollNumber: 'CS2021001',
                cgpa: 8.5,
                semester: 6,
                backlogs: 0,
                branch: 'Computer Science'
            },
            {
                username: 'teststudent2',
                email: 'student2@testcollege.edu',
                fullName: 'Test Student Two',
                rollNumber: 'CS2021002',
                cgpa: 7.8,
                semester: 6,
                backlogs: 0,
                branch: 'Computer Science'
            },
            {
                username: 'teststudent3',
                email: 'student3@testcollege.edu',
                fullName: 'Test Student Three',
                rollNumber: 'IT2021001',
                cgpa: 6.5,
                semester: 6,
                backlogs: 1,
                branch: 'Information Technology'
            }
        ];

        for (const studentInfo of students) {
            let user = await User.findOne({ username: studentInfo.username });

            if (!user) {
                user = new User({
                    username: studentInfo.username,
                    email: studentInfo.email,
                    password: 'TestStudent123!',
                    fullName: studentInfo.fullName,
                    role: 'student',
                    collegeId: testCollege._id,
                    department: studentInfo.branch,
                    status: 'active',
                    isApproved: true
                });
                await user.save();

                // Create StudentData profile
                const studentData = new StudentData({
                    userId: user._id,
                    collegeId: testCollege._id,
                    rollNumber: studentInfo.rollNumber,
                    cgpa: studentInfo.cgpa,
                    semester: studentInfo.semester,
                    currentBacklogs: studentInfo.backlogs,
                    personal: {
                        name: studentInfo.fullName,
                        email: studentInfo.email,
                        rollNumber: studentInfo.rollNumber,
                        branch: studentInfo.branch,
                        semester: studentInfo.semester,
                        phone: '+91-9876543210'
                    },
                    isProfileCompleted: true,
                    verificationStatus: 'VERIFIED',
                    documentsVerified: true
                });
                await studentData.save();

                console.log(`   ✅ Student created: ${studentInfo.username} (CGPA: ${studentInfo.cgpa})`);
            } else {
                console.log(`   ℹ️  Student already exists: ${studentInfo.username}`);
            }
        }

        // 5. Create Test Jobs
        console.log('\n💼 Creating Test Jobs...');
        const jobs = [
            {
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Full-stack development position for talented engineers',
                location: 'Bangalore, India',
                jobType: 'full-time',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                eligibilityCriteria: {
                    minCGPA: 7.0,
                    openToAllBranches: false,
                    eligibleBranches: ['Computer Science', 'Information Technology'],
                    maxCurrentBacklogs: 0,
                    eligibleYears: [4]
                },
                numberOfPositions: 10,
                status: 'active'
            },
            {
                title: 'Data Analyst',
                company: 'Data Solutions Inc',
                description: 'Data analysis and visualization role',
                location: 'Mumbai, India',
                jobType: 'full-time',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                eligibilityCriteria: {
                    minCGPA: 6.0,
                    openToAllBranches: false,
                    eligibleBranches: ['Computer Science', 'Information Technology'],
                    maxCurrentBacklogs: 1,
                    eligibleYears: [4]
                },
                numberOfPositions: 5,
                status: 'active'
            }
        ];

        for (const jobInfo of jobs) {
            let job = await Job.findOne({
                title: jobInfo.title,
                company: jobInfo.company,
                collegeId: testCollege._id
            });

            if (!job) {
                job = await Job.create({
                    ...jobInfo,
                    collegeId: testCollege._id,
                    postedBy: collegeAdmin._id
                });
                console.log(`   ✅ Job created: ${jobInfo.title} at ${jobInfo.company}`);
            } else {
                console.log(`   ℹ️  Job already exists: ${jobInfo.title} at ${jobInfo.company}`);
            }
        }

        // Print Summary
        console.log('\n' + '='.repeat(70));
        console.log('✅ PHASE 2 TEST DATA SETUP COMPLETE');
        console.log('='.repeat(70));
        console.log('\n📋 TEST ACCOUNTS CREATED:\n');

        console.log('🔐 SUPER ADMIN:');
        console.log('   Username: superadmin');
        console.log('   Password: SuperAdmin123!');
        console.log('   Access:   All colleges\n');

        console.log('🏛️  COLLEGE ADMIN:');
        console.log('   College:  Test Engineering College');
        console.log('   Username: testadmin');
        console.log('   Password: TestAdmin123!\n');

        console.log('👨‍🏫 MODERATOR:');
        console.log('   College:  Test Engineering College');
        console.log('   Username: testmod');
        console.log('   Password: TestMod123!');
        console.log('   Dept:     Computer Science\n');

        console.log('🎓 STUDENTS:');
        console.log('   1. teststudent1 / TestStudent123! (CGPA: 8.5, CS, 0 backlogs) ✅ Eligible');
        console.log('   2. teststudent2 / TestStudent123! (CGPA: 7.8, CS, 0 backlogs) ✅ Eligible');
        console.log('   3. teststudent3 / TestStudent123! (CGPA: 6.5, IT, 1 backlog)  ⚠️  Partially Eligible\n');

        console.log('💼 JOBS POSTED:');
        console.log('   1. Software Engineer @ Tech Corp (Min CGPA: 7.0, 0 backlogs)');
        console.log('   2. Data Analyst @ Data Solutions Inc (Min CGPA: 6.0, 1 backlog allowed)\n');

        console.log('🌐 APPLICATION URL:');
        console.log('   http://localhost:3002\n');

        console.log('📝 NEXT STEPS:');
        console.log('   1. Login as students and apply for jobs');
        console.log('   2. Login as moderator to review applications');
        console.log('   3. Test verification workflow');
        console.log('   4. Test notification system\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

setupPhase2TestData();
