import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS S3 Client
export const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// S3 Configuration
export const s3Config = {
    bucketName: process.env.AWS_S3_BUCKET_NAME || '',
    region: process.env.AWS_REGION || 'us-east-1',
    // Optional: CloudFront distribution URL for faster content delivery
    cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL || '',
};

// Validate S3 configuration
export const validateS3Config = (): boolean => {
    const requiredVars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_S3_BUCKET_NAME',
        'AWS_REGION',
    ];

    const missingVars = requiredVars.filter(
        (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
        console.error(
            '❌ Missing required AWS S3 environment variables:',
            missingVars.join(', ')
        );
        return false;
    }

    console.log('✅ AWS S3 configuration validated successfully');
    return true;
};
