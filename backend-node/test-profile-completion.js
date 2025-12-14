/**
 * Test Profile Completion Detection
 * 
 * This script tests the automatic profile completion detection
 * by creating a test student profile and verifying the flags are set correctly.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const StudentData = require('./models/StudentData');
const User = require('./models/User');

async function testProfileCompletion() {
    try {
        console.log('🧪 Starting Profile Completion Test...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a test student (you can change this username)
        const testUsername = 'ganeshkumar'; // Change this to your test student username

        console.log(`🔍 Looking for student: ${testUsername}`);
        const user = await User.findOne({ username: testUsername, role: 'student' });

        if (!user) {
            console.log(`❌ Student '${testUsername}' not found`);
            console.log('\n💡 Available students:');
            const students = await User.find({ role: 'student' }).limit(5);
            students.forEach(s => console.log(`   - ${s.username} (${s.fullName})`));
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.fullName} (${user.email})\n`);

        // Find student data
        let studentData = await StudentData.findOne({ userId: user._id });

        if (!studentData) {
            console.log('❌ No StudentData found for this user');
            process.exit(1);
        }

        console.log('📊 CURRENT PROFILE STATUS:');
        console.log('─'.repeat(60));
        console.log(`isProfileCompleted:        ${studentData.isProfileCompleted || false}`);
        console.log(`mandatoryFieldsCompleted:  ${studentData.mandatoryFieldsCompleted || false}`);
        console.log('');

        // Check mandatory fields
        console.log('📋 MANDATORY FIELDS CHECK:');
        console.log('─'.repeat(60));

        const personalInfo = {
            'Name': studentData.personal?.name,
            'Email': studentData.personal?.email,
            'Phone': studentData.personal?.phone,
            'DOB': studentData.personal?.dob,
            'Gender': studentData.personal?.gender
        };

        const academicInfo = {
            '10th %': studentData.education?.tenth?.percentage,
            '12th %': studentData.education?.twelfth?.percentage,
            'CGPA': studentData.education?.graduation?.cgpa
        };

        console.log('\n👤 Personal Information:');
        let personalComplete = true;
        Object.entries(personalInfo).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            const displayValue = value || 'Missing';
            console.log(`   ${status} ${field.padEnd(15)}: ${displayValue}`);
            if (!value) personalComplete = false;
        });

        console.log('\n🎓 Academic Information:');
        let academicComplete = true;
        Object.entries(academicInfo).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            const displayValue = value || 'Missing';
            console.log(`   ${status} ${field.padEnd(15)}: ${displayValue}`);
            if (!value) academicComplete = false;
        });

        console.log('\n💼 Additional Information:');
        const skillsCount = studentData.skills?.length || 0;
        const techSkillsCount = studentData.technicalSkills?.programming?.length || 0;
        const hasSkills = skillsCount > 0 || techSkillsCount > 0;
        console.log(`   ${hasSkills ? '✅' : '❌'} Skills: ${skillsCount + techSkillsCount} total`);

        // Calculate expected completion
        console.log('\n🎯 EXPECTED COMPLETION STATUS:');
        console.log('─'.repeat(60));

        const shouldBeMandatoryComplete = personalComplete && academicComplete;
        const shouldBeFullyComplete = shouldBeMandatoryComplete && hasSkills;

        console.log(`Should be Mandatory Complete: ${shouldBeMandatoryComplete ? '✅ YES' : '❌ NO'}`);
        console.log(`Should be Fully Complete:     ${shouldBeFullyComplete ? '✅ YES' : '❌ NO'}`);

        // Compare with actual
        console.log('\n🔍 VERIFICATION:');
        console.log('─'.repeat(60));

        const mandatoryMatch = studentData.mandatoryFieldsCompleted === shouldBeMandatoryComplete;
        const fullMatch = studentData.isProfileCompleted === shouldBeFullyComplete;

        console.log(`Mandatory Fields Flag: ${mandatoryMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
        console.log(`  Expected: ${shouldBeMandatoryComplete}, Actual: ${studentData.mandatoryFieldsCompleted}`);

        console.log(`Profile Complete Flag:  ${fullMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
        console.log(`  Expected: ${shouldBeFullyComplete}, Actual: ${studentData.isProfileCompleted}`);

        // Test auto-update by saving
        console.log('\n🔄 TESTING AUTO-UPDATE:');
        console.log('─'.repeat(60));
        console.log('Saving profile to trigger auto-detection...');

        // Trigger the auto-detection by saving
        await studentData.save();

        // Reload to get updated values
        studentData = await StudentData.findOne({ userId: user._id });

        console.log('\n📊 AFTER SAVE:');
        console.log('─'.repeat(60));
        console.log(`isProfileCompleted:        ${studentData.isProfileCompleted || false}`);
        console.log(`mandatoryFieldsCompleted:  ${studentData.mandatoryFieldsCompleted || false}`);

        // Final verification
        const finalMandatoryMatch = studentData.mandatoryFieldsCompleted === shouldBeMandatoryComplete;
        const finalFullMatch = studentData.isProfileCompleted === shouldBeFullyComplete;

        console.log('\n✨ FINAL RESULT:');
        console.log('─'.repeat(60));

        if (finalMandatoryMatch && finalFullMatch) {
            console.log('🎉 SUCCESS! Profile completion detection is working correctly!');
        } else {
            console.log('⚠️  WARNING! Profile completion flags may not be updating correctly.');
            console.log('\nThis could mean:');
            console.log('1. The auto-detection logic needs to be triggered via the API endpoint');
            console.log('2. The student needs to save their profile through the frontend');
            console.log('3. There may be an issue with the pre-save hook');
        }

        console.log('\n💡 RECOMMENDATION:');
        console.log('─'.repeat(60));
        if (!shouldBeFullyComplete) {
            console.log('To complete this profile, the student needs to:');
            if (!personalComplete) console.log('  • Fill in all personal information fields');
            if (!academicComplete) console.log('  • Fill in all academic information fields');
            if (!hasSkills) console.log('  • Add at least one skill');
        } else {
            console.log('Profile has all required fields!');
            console.log('Student should save their profile through the frontend to update flags.');
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testProfileCompletion();
