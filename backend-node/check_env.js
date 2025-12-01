
require('dotenv').config();

const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.log('MISSING_ENV_VARS:', missing.join(', '));
} else {
    console.log('CLOUDINARY_CONFIG_OK');
}
