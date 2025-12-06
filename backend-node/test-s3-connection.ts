import dotenv from 'dotenv';
import { s3Client, validateS3Config } from './src/config/s3Config';
import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

async function testS3Setup() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AWS S3 Setup Verification');
    console.log('='.repeat(60) + '\n');

    // Test 1: Check Environment Variables
    console.log('📋 Test 1: Checking Environment Variables...');
    const requiredVars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_S3_BUCKET_NAME'
    ];

    let allVarsPresent = true;
    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (value) {
            console.log(`   ✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
        } else {
            console.log(`   ❌ ${varName}: NOT SET`);
            allVarsPresent = false;
        }
    }

    if (!allVarsPresent) {
        console.log('\n❌ Missing required environment variables!');
        console.log('Please check your .env file.\n');
        return;
    }

    console.log('   ✅ All environment variables are set\n');

    // Test 2: Validate Configuration
    console.log('📋 Test 2: Validating S3 Configuration...');
    const isValid = validateS3Config();
    if (!isValid) {
        console.log('   ❌ Configuration validation failed\n');
        return;
    }
    console.log('   ✅ Configuration is valid\n');

    // Test 3: Test AWS Connection
    console.log('📋 Test 3: Testing AWS Connection...');
    try {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        console.log('   ✅ Successfully connected to AWS!');

        if (response.Buckets && response.Buckets.length > 0) {
            console.log(`   📦 Found ${response.Buckets.length} bucket(s):`);
            response.Buckets.forEach((bucket, index) => {
                console.log(`      ${index + 1}. ${bucket.Name}`);
            });
        }
        console.log('');
    } catch (error: any) {
        console.log('   ❌ Failed to connect to AWS');
        console.log(`   Error: ${error.message}\n`);
        return;
    }

    // Test 4: Verify Target Bucket
    console.log('📋 Test 4: Verifying Target Bucket...');
    const targetBucket = process.env.AWS_S3_BUCKET_NAME;
    try {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        const bucketExists = response.Buckets?.some(
            (bucket) => bucket.Name === targetBucket
        );

        if (bucketExists) {
            console.log(`   ✅ Target bucket "${targetBucket}" exists\n`);
        } else {
            console.log(`   ❌ Target bucket "${targetBucket}" NOT FOUND`);
            console.log('   Please create this bucket in AWS S3 Console\n');
            return;
        }
    } catch (error: any) {
        console.log(`   ❌ Error checking bucket: ${error.message}\n`);
        return;
    }

    // Test 5: Test Upload Permission (Optional - creates a test file)
    console.log('📋 Test 5: Testing Upload Permission...');
    try {
        const testKey = 'test/connection-test.txt';
        const testContent = `S3 Connection Test - ${new Date().toISOString()}`;

        const uploadCommand = new PutObjectCommand({
            Bucket: targetBucket,
            Key: testKey,
            Body: Buffer.from(testContent),
            ContentType: 'text/plain',
        });

        await s3Client.send(uploadCommand);
        console.log('   ✅ Successfully uploaded test file');
        console.log(`   📄 File: ${testKey}\n`);
    } catch (error: any) {
        console.log('   ⚠️  Upload test failed (check IAM permissions)');
        console.log(`   Error: ${error.message}\n`);
    }

    // Summary
    console.log('='.repeat(60));
    console.log('✅ S3 SETUP VERIFICATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n🎉 Your AWS S3 is configured and ready to use!\n');
    console.log('Next steps:');
    console.log('  1. Start your backend server: npm run dev');
    console.log('  2. Test file upload: POST http://localhost:5000/api/s3/upload');
    console.log('  3. Check the API documentation for more endpoints\n');
}

// Run the test
testS3Setup().catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
});
