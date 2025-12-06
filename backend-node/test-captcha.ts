import axios from 'axios';

const testCaptcha = async () => {
    try {
        console.log('Testing Captcha Endpoint...');
        const response = await axios.get('http://localhost:8000/api/auth/captcha');
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Error fetching captcha:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
};

testCaptcha();
