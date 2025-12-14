const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testPhotoUpload() {
    try {
        // First login to get token
        const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
            username: 'ganesh',
            password: 'ganesh',
            collegeId: '693a73c68dbf593033aa504c'
        });

        console.log('Login response:', loginRes.data);
        const token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.data?.token;
        console.log('Logged in successfully, token:', token ? 'present' : 'missing');

        if (!token) {
            console.error('No token in response!');
            return;
        }

        // Create a test image buffer
        const testImageBuffer = Buffer.from('fake-image-data');

        // Create form data
        const form = new FormData();
        form.append('photo', testImageBuffer, {
            filename: 'test.jpg',
            contentType: 'image/jpeg'
        });

        // Upload photo
        const uploadRes = await axios.post('http://localhost:8000/api/students/photo', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload successful:', uploadRes.data);
    } catch (error) {
        console.error('Error during test:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testPhotoUpload();
