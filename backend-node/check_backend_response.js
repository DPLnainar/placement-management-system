const axios = require('axios');

async function checkBackendResponse() {
    try {
        const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
            username: 'ganesh',
            password: 'ganesh',
            collegeId: '693a73c68dbf593033aa504c'
        });

        const token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.data?.token;

        const profileRes = await axios.get('http://localhost:8000/api/students/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const student = profileRes.data.student;

        console.log('\n=== BACKEND RESPONSE CHECK ===');
        console.log('\n10th Data:');
        console.log(JSON.stringify(student.education?.tenth, null, 2));

        console.log('\n12th Data:');
        console.log(JSON.stringify(student.education?.twelfth, null, 2));

        console.log('\nPersonal Data (photo):');
        console.log('photoUrl:', student.personal?.photoUrl);
        console.log('photoUrl exists:', !!student.personal?.photoUrl);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkBackendResponse();
