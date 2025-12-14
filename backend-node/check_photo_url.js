const axios = require('axios');

async function checkPhotoUrl() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
            username: 'ganesh',
            password: 'ganesh',
            collegeId: '693a73c68dbf593033aa504c'
        });

        const token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.data?.token;

        // Get profile
        const profileRes = await axios.get('http://localhost:8000/api/students/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const student = profileRes.data.student;
        console.log('\n=== PHOTO URL CHECK ===');
        console.log('Photo URL:', student.personal?.photoUrl);
        console.log('Photo URL length:', student.personal?.photoUrl?.length);
        console.log('Is presigned?', student.personal?.photoUrl?.includes('X-Amz-Signature'));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkPhotoUrl();
