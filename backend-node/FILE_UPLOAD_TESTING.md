# File Upload Testing Guide

## ✅ Backend is Ready!

Your file upload system is now configured and running on `http://localhost:5000`

**Cloudinary Configuration:**
- Cloud Name: `placement-management-system`
- API Key: Configured ✓
- API Secret: Configured ✓

## How to Test File Upload

### Option 1: Using Thunder Client (VS Code Extension)

1. **Install Thunder Client** (if not installed):
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "Thunder Client"
   - Click Install

2. **Test Login First**:
   ```
   Method: POST
   URL: http://localhost:5000/api/auth/login
   Body (JSON):
   {
     "username": "superadmin",
     "password": "SuperAdmin123!"
   }
   ```
   Copy the `token` from the response.

3. **Test Resume Upload**:
   ```
   Method: POST
   URL: http://localhost:5000/api/upload/resume
   Headers:
     Authorization: Bearer YOUR_TOKEN_HERE
   Body (Form):
     resume: [Select a PDF or DOC file]
   ```

4. **Test Get Files**:
   ```
   Method: GET
   URL: http://localhost:5000/api/upload/files
   Headers:
     Authorization: Bearer YOUR_TOKEN_HERE
   ```

### Option 2: Using Postman

1. **Download Postman** from https://www.postman.com/downloads/
2. Follow the same steps as Thunder Client above

### Option 3: Using PowerShell (Quick Test)

```powershell
# 1. Login and get token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{username="superadmin"; password="SuperAdmin123!"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.token

# 2. Upload a test file (replace with your file path)
$filePath = "C:\path\to\your\resume.pdf"
$boundary = [System.Guid]::NewGuid().ToString()
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

# Note: File upload via PowerShell is complex, better use Thunder Client/Postman
```

### Option 4: Using Frontend

Create a simple upload component in your React frontend:

```jsx
// Example: ResumeUpload.jsx
import React, { useState } from 'react';
import api from '../services/api';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const response = await api.post('/upload/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      alert('Resume uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + error.response?.data?.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
      <input 
        type="file" 
        accept=".pdf,.doc,.docx" 
        onChange={handleFileChange}
        className="mb-4"
      />
      <button 
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {uploading ? 'Uploading...' : 'Upload Resume'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>✅ Upload successful!</p>
          <p className="text-sm">URL: {result.resume.url}</p>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
```

## Available Upload Endpoints

### 1. Upload Resume
- **POST** `/api/upload/resume`
- **Auth**: Required
- **Body**: `multipart/form-data` with field `resume`
- **Accepted**: PDF, DOC, DOCX (max 5MB)
- **Returns**: Resume URL and metadata

### 2. Upload Profile Photo
- **POST** `/api/upload/photo`
- **Auth**: Required
- **Body**: `multipart/form-data` with field `photo`
- **Accepted**: JPG, PNG (max 2MB)
- **Returns**: Photo URL (auto-resized to 400x400)

### 3. Upload Document
- **POST** `/api/upload/document`
- **Auth**: Required
- **Body**: `multipart/form-data` with fields:
  - `document`: File
  - `name`: Document name (optional)
  - `type`: Document type (optional)
- **Accepted**: PDF, DOC, DOCX, JPG, PNG (max 10MB)
- **Returns**: Document URL and metadata

### 4. Get User Files
- **GET** `/api/upload/files`
- **Auth**: Required
- **Returns**: All user's uploaded files (resume, photo, documents)

### 5. Delete Resume
- **DELETE** `/api/upload/resume`
- **Auth**: Required
- **Returns**: Success message

### 6. Delete Document
- **DELETE** `/api/upload/document/:id`
- **Auth**: Required
- **Returns**: Success message

## Verification

To verify the upload system is working:

1. ✅ Backend server running on port 5000
2. ✅ Cloudinary credentials configured in `.env`
3. ✅ Upload routes registered in `server.js`
4. ✅ Multer and Cloudinary packages installed
5. ✅ User model has file upload fields

## Next Steps

1. **Test manually** using Thunder Client or Postman
2. **Integrate into frontend** - Add upload components to:
   - Student profile page (resume upload)
   - Profile settings (photo upload)
   - Application forms (document upload)
3. **Mark Task 2 as complete** once testing is successful
4. **Move to Task 3**: Advanced job features

## Troubleshooting

**"Invalid credentials"**
- Verify Cloudinary credentials in `.env`
- Check cloud name matches your Cloudinary account

**"File too large"**
- Resume: Max 5MB
- Photo: Max 2MB
- Document: Max 10MB

**"Invalid file type"**
- Resume: Only PDF, DOC, DOCX
- Photo: Only JPG, PNG
- Check the `accept` attribute in your file input

## File Storage in Cloudinary

Your files are stored in organized folders:
- `placement-system/resumes/`
- `placement-system/photos/`
- `placement-system/documents/`
- `placement-system/logos/`

You can view all uploaded files in your Cloudinary dashboard at:
https://cloudinary.com/console/media_library
