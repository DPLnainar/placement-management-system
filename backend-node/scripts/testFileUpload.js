/**
 * Test File Upload System
 * 
 * This script tests the Cloudinary file upload functionality
 * by uploading a test PDF file as a resume.
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  username: 'superadmin',
  password: 'SuperAdmin123!'
};

let authToken = '';

// Create a simple test PDF file
function createTestPDF() {
  const testPDFPath = path.join(__dirname, 'test-resume.pdf');
  
  // Simple PDF header (minimal valid PDF)
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 700 Td
(Test Resume) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

  fs.writeFileSync(testPDFPath, pdfContent);
  return testPDFPath;
}

async function login() {
  try {
    console.log('\n📝 Step 1: Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('   User:', response.data.user.username);
      console.log('   Role:', response.data.user.role);
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function uploadResume() {
  try {
    console.log('\n📤 Step 2: Uploading test resume...');
    
    const testPDFPath = createTestPDF();
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(testPDFPath));

    const response = await axios.post(`${API_URL}/upload/resume`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Resume uploaded successfully');
      console.log('   File URL:', response.data.resume.url);
      console.log('   Public ID:', response.data.resume.publicId);
      console.log('   Uploaded At:', response.data.resume.uploadedAt);
      
      // Clean up test file
      fs.unlinkSync(testPDFPath);
      return true;
    }
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function getUserFiles() {
  try {
    console.log('\n📂 Step 3: Getting user files...');
    
    const response = await axios.get(`${API_URL}/upload/files`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Files retrieved successfully');
      console.log('   Resume:', response.data.files.resume ? 'Yes' : 'No');
      console.log('   Profile Photo:', response.data.files.profilePhoto ? 'Yes' : 'No');
      console.log('   Documents:', response.data.files.documents.length);
      
      if (response.data.files.resume) {
        console.log('\n   Resume Details:');
        console.log('   - URL:', response.data.files.resume.url);
        console.log('   - Uploaded:', new Date(response.data.files.resume.uploadedAt).toLocaleString());
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Get files failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCloudinaryConnection() {
  console.log('\n🔍 Testing Cloudinary Configuration...');
  console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   FILE UPLOAD SYSTEM TEST');
  console.log('═══════════════════════════════════════════');

  await testCloudinaryConnection();

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests aborted - login failed');
    process.exit(1);
  }

  const uploadSuccess = await uploadResume();
  if (!uploadSuccess) {
    console.log('\n⚠️  Upload failed - check Cloudinary credentials');
  }

  await getUserFiles();

  console.log('\n═══════════════════════════════════════════');
  console.log('   TEST COMPLETE');
  console.log('═══════════════════════════════════════════\n');

  process.exit(0);
}

runTests();
