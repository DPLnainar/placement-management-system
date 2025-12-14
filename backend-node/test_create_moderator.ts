import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

async function testModeratorCreation() {
    try {
        // 1. Login as Super Admin to create a college
        console.log('Logging in as Super Admin...');
        const saLogin = await axios.post(`${API_URL}/auth/login`, {
            username: 'superadmin',
            password: 'SuperAdmin123!'
        });
        const saToken = saLogin.data.data.token;
        console.log('Super Admin logged in.');

        // 2. Create College + Admin
        const salt = Math.floor(Math.random() * 10000);
        const collegeData = {
            collegeName: `ModTest College ${salt}`,
            collegeAddress: 'Tech Park',
            collegeCode: `MOD${salt}`,
            contactEmail: `contact${salt}@test.edu`,
            adminName: 'ModTest Admin',
            adminEmail: `admin${salt}@test.edu`,
            adminUsername: `modadmin${salt}`,
            adminPassword: 'Password123!'
        };

        console.log('Creating College & Admin...');
        const collegeRes = await axios.post(`${API_URL}/superadmin/colleges`, collegeData, {
            headers: { Authorization: `Bearer ${saToken}` }
        });
        console.log('College created.');

        // 3. Login as the new College Admin
        console.log('Logging in as College Admin...');
        console.log('College Creation Response Data:', JSON.stringify(collegeRes.data.data, null, 2));
        const collegeId = collegeRes.data.data.college.id;
        console.log('Extracted College ID:', collegeId);

        const loginPayload = {
            username: `modadmin${salt}`,
            password: 'Password123!',
            collegeId: collegeId
        };
        console.log('Login Payload:', loginPayload);

        const adminLogin = await axios.post(`${API_URL}/auth/login`, loginPayload);
        const adminToken = adminLogin.data.data.token;
        console.log('College Admin logged in.');

        // 4. Create Moderator (Simulation of what AdminDashboard now does)
        console.log('Creating Moderator...');
        const modData = {
            username: `moderator${salt}`,
            email: `mod${salt}@test.edu`,
            fullName: 'Test Moderator',
            password: 'Password123!',
            department: 'CSE',
            departments: ['CSE'] // The frontend now sends this!
        };

        // Note: The frontend uses adminAPI.createModerator which calls POST /admin/moderators
        const modRes = await axios.post(`${API_URL}/admin/moderators`, modData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('Moderator created successfully!');
        console.log('Response:', modRes.data);

    } catch (error: any) {
        if (error.response) {
            console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testModeratorCreation();
