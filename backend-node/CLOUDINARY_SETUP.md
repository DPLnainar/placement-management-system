# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click **Sign Up for Free**
3. Fill in your details or sign up with Google/GitHub
4. Verify your email address

## Step 2: Get Your Credentials

1. After login, you'll be on the **Dashboard** (or go to [https://cloudinary.com/console](https://cloudinary.com/console))
2. You'll see a section called **Account Details** with:
   - **Cloud Name**: (e.g., `dxxxxxxxx`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: Click **👁 Show** to reveal (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Step 3: Configure Backend

1. Open `backend-node/.env`
2. Replace the placeholders with your actual credentials:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name      # e.g., dxxxxxxxx
CLOUDINARY_API_KEY=your-api-key            # e.g., 123456789012345
CLOUDINARY_API_SECRET=your-api-secret      # e.g., abcdefghijklmnopqrstuvwxyz123456
```

## Step 4: Test File Upload

### Using Postman/Thunder Client:

1. **Login first** to get JWT token:
   ```
   POST http://localhost:5000/api/auth/login
   Body (JSON):
   {
     "username": "superadmin",
     "password": "SuperAdmin123!"
   }
   ```
   Copy the `token` from response.

2. **Upload Resume**:
   ```
   POST http://localhost:5000/api/upload/resume
   Headers:
     Authorization: Bearer YOUR_JWT_TOKEN
   Body (form-data):
     resume: [select a PDF/DOC file]
   ```

3. **Upload Profile Photo**:
   ```
   POST http://localhost:5000/api/upload/photo
   Headers:
     Authorization: Bearer YOUR_JWT_TOKEN
   Body (form-data):
     photo: [select a JPG/PNG file]
   ```

4. **Get All User Files**:
   ```
   GET http://localhost:5000/api/upload/files
   Headers:
     Authorization: Bearer YOUR_JWT_TOKEN
   ```

## File Upload Limits

- **Resume**: PDF, DOC, DOCX - Max 5MB
- **Profile Photo**: JPG, PNG - Max 2MB (auto-resized to 400x400)
- **Documents**: PDF, DOC, DOCX, JPG, PNG - Max 10MB per file
- **Company Logo**: JPG, PNG - Max 1MB (auto-resized to 200x200)

## Storage Folders in Cloudinary

All files are organized in folders:
- `placement-system/resumes/` - Student resumes
- `placement-system/photos/` - Profile photos
- `placement-system/logos/` - Company logos
- `placement-system/documents/` - Other documents

## Free Tier Limits

Cloudinary Free Plan includes:
- **25 GB** storage
- **25 GB** monthly bandwidth
- **500,000** transformations/month

This is more than enough for testing and small deployments.

## Security Notes

⚠️ **NEVER commit your `.env` file to Git!**
- The `.env` file should already be in `.gitignore`
- API secrets are sensitive credentials
- Each deployment environment should have its own Cloudinary account/credentials

## Troubleshooting

### "Invalid API Key"
- Double-check you copied the correct **API Key** from Cloudinary dashboard
- Make sure there are no extra spaces in `.env`

### "Upload failed"
- Verify file size is within limits
- Check file format is allowed
- Ensure `CLOUDINARY_CLOUD_NAME`, `API_KEY`, and `API_SECRET` are all set

### "No such cloud"
- Cloud name is case-sensitive
- Copy it exactly from Cloudinary dashboard

## Next Steps After Setup

Once Cloudinary is configured:
1. Restart the backend server: `npm start`
2. Test file uploads via API
3. Integrate file upload in frontend components:
   - Student profile resume upload
   - Profile photo upload
   - Document upload for applications
