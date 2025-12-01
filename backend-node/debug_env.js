
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

console.log('--- Debugging Cloudinary Config ---');
console.log(`Cloud Name Length: ${cloudName.length}`);
console.log(`Cloud Name: '${cloudName}'`); // Safe to show cloud name
console.log(`API Key Length: ${apiKey.length}`);
console.log(`API Key Starts With: '${apiKey.substring(0, 2)}...'`);
console.log(`API Secret Length: ${apiSecret.length}`);
console.log(`API Secret Starts With: '${apiSecret.substring(0, 2)}...'`);

if (apiKey.includes('cloudinary://')) {
    console.log('WARNING: API Key seems to contain the full Cloudinary URL!');
}
if (cloudName.includes('@')) {
    console.log('WARNING: Cloud Name seems to contain an email or URL part!');
}
