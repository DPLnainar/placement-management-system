const axios = require('axios');

async function testProfileUpdate() {
    try {
        console.log('\n========================================');
        console.log('Testing Profile Update via API');
        console.log('========================================\n');

        // First, login to get a token
        console.log('Step 1: Logging in...');

        // You'll need to replace these with actual credentials
        const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
            email: 'student@example.com', // Replace with actual student email
            password: 'password123' // Replace with actual password
        });

        if (!loginResponse.data.token) {
            console.log('❌ Login failed. Please update the credentials in the script.');
            console.log('Response:', loginResponse.data);
            process.exit(1);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Get current profile
        console.log('\nStep 2: Fetching current profile...');
        const profileResponse = await axios.get('http://localhost:8000/api/student/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Current 10th School Name:', profileResponse.data.student.education?.tenth?.schoolName || '(empty)');
        console.log('Current 12th School Name:', profileResponse.data.student.education?.twelfth?.schoolName || '(empty)');

        // Update profile with school names
        console.log('\nStep 3: Updating profile with school names...');
        const updateData = {
            education: {
                tenth: {
                    schoolName: 'Test High School - ' + Date.now(),
                    board: 'STATE',
                    percentage: 90,
                    yearOfPassing: 2018
                },
                twelfth: {
                    schoolName: 'Test Higher Secondary - ' + Date.now(),
                    board: 'STATE',
                    percentage: 89.99,
                    yearOfPassing: 2020
                }
            }
        };

        console.log('Sending 10th School Name:', updateData.education.tenth.schoolName);
        console.log('Sending 12th School Name:', updateData.education.twelfth.schoolName);

        const updateResponse = await axios.put('http://localhost:8000/api/student/profile', updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!updateResponse.data.success) {
            console.log('❌ Update failed');
            console.log('Response:', updateResponse.data);
            process.exit(1);
        }

        console.log('✅ Update successful');

        // Fetch profile again to verify
        console.log('\nStep 4: Fetching profile again to verify...');
        const verifyResponse = await axios.get('http://localhost:8000/api/student/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const saved10th = verifyResponse.data.student.education?.tenth?.schoolName;
        const saved12th = verifyResponse.data.student.education?.twelfth?.schoolName;

        console.log('\nVerification Results:');
        console.log('10th School Name:', saved10th || '(empty)');
        console.log('12th School Name:', saved12th || '(empty)');

        if (saved10th === updateData.education.tenth.schoolName &&
            saved12th === updateData.education.twelfth.schoolName) {
            console.log('\n✅ SUCCESS! School names persisted correctly via API.');
            console.log('🎉 The fix is working!\n');
        } else {
            console.log('\n❌ FAILED! School names did not persist.');
            console.log('Expected 10th:', updateData.education.tenth.schoolName);
            console.log('Got 10th:', saved10th);
            console.log('Expected 12th:', updateData.education.twelfth.schoolName);
            console.log('Got 12th:', saved12th);
            console.log('\n⚠️  The fix may not be working.\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        console.log('\nNote: Make sure to update the login credentials in the script.');
    }
}

testProfileUpdate();
