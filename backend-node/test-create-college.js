const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testCreateCollege() {
    try {
        // 1. Login
        console.log('🔑 Logging in as Super Admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            username: 'superadmin',
            password: 'Admin@123'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful. Token received.');

        // 2. Create College
        console.log('\n🏫 Creating College...');
        const timestamp = Date.now();
        const collegeData = {
            collegeName: `St. Joseph's College of Engineering ${timestamp}`,
            collegeAddress: "Chennai, Tamil Nadu",
            collegeCode: `SJCE${timestamp.toString().slice(-4)}`,
            subscriptionStatus: "active",
            adminName: "SJCE Admin",
            adminEmail: `admin${timestamp}@sjce.ac.in`,
            adminUsername: `sjce_admin_${timestamp}`,
            adminPassword: "Sjce@123"
        };

        console.log('Payload:', JSON.stringify(collegeData, null, 2));

        const createResponse = await axios.post(
            `${API_URL}/superadmin/colleges`,
            collegeData,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('\n✅ College Created Successfully!');
        console.log(createResponse.data);

    } catch (error) {
        console.error('\n❌ Error creating college:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testCreateCollege();
