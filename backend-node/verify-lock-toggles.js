const mongoose = require('mongoose');
const axios = require('axios');

// Configure axios to use our local environment
const API_URL = 'http://localhost:5000/api';

async function verifyLockToggles() {
    console.log('--- Starting Lock Toggle Verification ---');

    // We'll need tokens for our test users.
    // NOTE: This script assumes the server is running and the credentials are valid.
    // For automation, we'll try to login if possible, or use hardcoded tokens if provided.

    const credentials = {
        student: { email: 'student1@college.edu', password: 'password123' },
        moderator: { email: 'moderator@college.edu', password: 'password123' }
    };

    let studentToken, moderatorToken, studentId;

    try {
        console.log('1. Logging in as Moderator...');
        const modLogin = await axios.post(`${API_URL}/auth/login`, credentials.moderator);
        moderatorToken = modLogin.data.token;
        console.log('✅ Moderator logged in');

        console.log('2. Fetching student data...');
        const studentsRes = await axios.get(`${API_URL}/users?role=student`, {
            headers: { Authorization: `Bearer ${moderatorToken}` }
        });

        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.users || []);
        const student = studentsData.find(s => s.email === credentials.student.email);

        if (!student) {
            console.log(`❌ Student ${credentials.student.email} not found!`);
            console.log('Available students:', studentsData.map(s => s.email).join(', '));
            return;
        }
        studentId = student._id || student.id;
        console.log(`✅ Found student: ${student.fullName} (${studentId})`);

        console.log('3. Logging in as Student...');
        const studentLogin = await axios.post(`${API_URL}/auth/login`, credentials.student);
        studentToken = studentLogin.data.token;
        console.log('✅ Student logged in');

        // TEST 1: Student attempts to UNLOCK themselves
        console.log('\nTEST 1: Student attempts to self-unlock...');
        try {
            await axios.put(`${API_URL}/student/profile`, {
                personalInfoLocked: false
            }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('❌ FAIL: Student was able to update lock status!');
        } catch (error) {
            console.log(`✅ PASS: Student blocked from self-unlock (Status: ${error.response?.status})`);
        }

        // TEST 2: Moderator UNLOCKS student
        console.log('\nTEST 2: Moderator attempts to unlock student...');
        try {
            const unlockRes = await axios.put(`${API_URL}/student/profile/${studentId}`, {
                personalInfoLocked: false
            }, {
                headers: { Authorization: `Bearer ${moderatorToken}` }
            });
            console.log('✅ PASS: Moderator successfully unlocked student');
        } catch (error) {
            console.log(`❌ FAIL: Moderator could not unlock student: ${error.message}`);
        }

        // TEST 3: Student attempts to update after unlock
        console.log('\nTEST 3: Student attempts to update after unlock...');
        try {
            await axios.put(`${API_URL}/student/profile`, {
                personal: {
                    firstName: 'Ganeshkumar',
                    lastName: 'Nainar (Updated after unlock)'
                }
            }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('✅ PASS: Student was able to edit profile after moderator unlock');
        } catch (error) {
            console.log(`❌ FAIL: Student still blocked even after unlock: ${error.response?.data?.message || error.message}`);
        }

        // CLEANUP: Reset to locked for future tests
        console.log('\nCleaning up: Locking student profile again...');
        await axios.put(`${API_URL}/student/profile/${studentId}`, {
            personalInfoLocked: true
        }, {
            headers: { Authorization: `Bearer ${moderatorToken}` }
        });
        console.log('✅ Student profile relocked');

    } catch (error) {
        console.error('ERROR during verification:', error.response?.data || error.message);
    }
}

verifyLockToggles();
