import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

async function reproduceError() {
    try {
        // 1. Login
        console.log('Logging in...');
        // Trying the password found in verification script
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'superadmin',
            password: 'SuperAdmin123!'
        });

        const token = loginRes.data.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Create College
        console.log('Attempting to create college...');
        // Using random numbers to avoid unique constraint collisions on re-runs
        const salt = Math.floor(Math.random() * 10000);
        const collegeData = {
            collegeName: `Test College ${salt}`,
            collegeAddress: 'OMR, Chennai',
            collegeCode: `3123${salt}`,
            contactEmail: 'contact@testcollege.edu',
            contactPhone: '9876543210',
            contactWebsite: 'https://testcollege.edu',
            subscriptionStatus: 'active',
            adminName: 'Test Admin',
            adminEmail: `admin${salt}@testcollege.edu`,
            adminUsername: `testadmin${salt}`,
            adminPassword: 'Password123!'
        };

        console.log('Payload:', JSON.stringify(collegeData, null, 2));

        const createRes = await axios.post(`${API_URL}/superadmin/colleges`, collegeData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Success!', createRes.data);

    } catch (error: any) {
        if (error.response) {
            console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

reproduceError();
