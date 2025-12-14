const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testCollegeCreation() {
    try {
        // 1. Login
        console.log('1. Logging in as Super Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'superadmin',
            password: 'SuperAdmin123!'
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data);
            return;
        }

        const token = loginRes.data.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Create College
        console.log('2. Creating a test college...');
        const timestamp = Date.now();
        const collegeData = {
            collegeName: `Test College ${timestamp}`,
            collegeAddress: '123 Test St',
            collegeCode: `TEST_${timestamp}`,
            adminName: 'Test Admin',
            adminEmail: `testadmin_${timestamp}@example.com`,
            adminUsername: `test_admin_${timestamp}`,
            adminPassword: 'password123'
        };

        const createRes = await axios.post(
            `${API_URL}/superadmin/colleges`,
            collegeData,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (createRes.data.success) {
            console.log('✅ College created successfully!');
            console.log('College ID:', createRes.data.data.college.id);
        } else {
            console.error('❌ Failed to create college:', createRes.data);
        }

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testCollegeCreation();
