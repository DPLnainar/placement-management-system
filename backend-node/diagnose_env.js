
require('dotenv').config();

const vars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

console.log('--- DIAGNOSTIC REPORT ---');

for (const [key, value] of Object.entries(vars)) {
    if (!value) {
        console.log(`[ERROR] ${key} is MISSING or EMPTY.`);
        continue;
    }

    if (value.startsWith('"') || value.startsWith("'")) {
        console.log(`[ERROR] ${key} starts with a quote. Remove quotes from .env file.`);
    }

    if (value.endsWith('"') || value.endsWith("'")) {
        console.log(`[ERROR] ${key} ends with a quote. Remove quotes from .env file.`);
    }

    if (value.startsWith(' ')) {
        console.log(`[ERROR] ${key} has a leading space. Remove spaces after '='.`);
    }

    if (value.endsWith(' ')) {
        console.log(`[ERROR] ${key} has a trailing space.`);
    }

    console.log(`[INFO] ${key}: Length=${value.length}, FirstChar='${value.charAt(0)}', LastChar='${value.charAt(value.length - 1)}'`);
}

console.log('--- END REPORT ---');
