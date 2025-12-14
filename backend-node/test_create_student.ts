import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

async function testStudentCreation() {
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
            collegeName: `StudentTest College ${salt}`,
            collegeAddress: 'Tech Park',
            collegeCode: `STU${salt}`,
            contactEmail: `contact_stu${salt}@test.edu`,
            adminName: 'StudentTest Admin',
            adminEmail: `admin_stu${salt}@test.edu`,
            adminUsername: `stuadmin${salt}`,
            adminPassword: 'Password123!'
        };

        console.log('Creating College & Admin...');
        const collegeRes = await axios.post(`${API_URL}/superadmin/colleges`, collegeData, {
            headers: { Authorization: `Bearer ${saToken}` }
        });
        console.log('College created.');
        const collegeId = collegeRes.data.data.college.id;


        // 3. Login as the new College Admin
        console.log('Logging in as College Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            username: `stuadmin${salt}`,
            password: 'Password123!',
            collegeId: collegeId
        });
        const adminToken = adminLogin.data.data.token;
        console.log('College Admin logged in.');

        // 4. Create Student (Simulating userAPI.create / POST /api/users)
        console.log('Creating Student...');
        const studentData = {
            username: `student${salt}`,
            email: `student${salt}@test.edu`,
            fullName: 'Test Student',
            password: 'Password123!',
            department: 'CSE',
            role: 'student',
            collegeId: collegeId
        };

        const stuRes = await axios.post(`${API_URL}/users`, studentData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('Student created successfully!');
        console.log('Response:', stuRes.data);

        // 5. Verify no cookie was set that would log us out (checking headers)
        // Axios in node doesn't auto-store cookies unless configured, but we can check Set-Cookie header
        if (stuRes.headers['set-cookie']) {
            console.warn('WARNING: POST /api/users returned Set-Cookie header! This might overwrite admin session.');
            console.log('Cookies:', stuRes.headers['set-cookie']);
        } else {
            console.log('SUCCESS: No session cookies set by student creation endpoint.');
        }

    } catch (error: any) {
        console.error('FULL ERROR OBJECT:', error);
        if (error.response) {
            console.error('Error Response status:', error.response.status);
            console.error('Error Response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        process.exit(1);
    }
}

testStudentCreation();
