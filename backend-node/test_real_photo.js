const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRealPhotoUpload() {
    try {
        // First login to get token
        const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
            username: 'ganesh',
            password: 'ganesh',
            collegeId: '693a73c68dbf593033aa504c'
        });

        const token = loginRes.data.token || loginRes.data.accessToken || loginRes.data.data?.token;
        console.log('Logged in, token:', token ? 'present' : 'missing');

        if (!token) {
            console.error('No token!');
            return;
        }

        // Create a real test image (1x1 pixel PNG)
        const testImagePath = path.join(__dirname, 'test_image.png');
        const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, pngBuffer);
        console.log('Created test image');

        // Create form data with real file
        const form = new FormData();
        form.append('photo', fs.createReadStream(testImagePath), {
            filename: 'test.png',
            contentType: 'image/png'
        });

        console.log('Uploading photo...');

        // Upload photo
        const uploadRes = await axios.post('http://localhost:8000/api/students/photo', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('✅ Upload successful!');
        console.log('Response:', uploadRes.data);

        // Cleanup
        fs.unlinkSync(testImagePath);

    } catch (error) {
        console.error('❌ Error during test:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

testRealPhotoUpload();
