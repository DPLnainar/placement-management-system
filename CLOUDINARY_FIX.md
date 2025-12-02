# Cloudinary URL Fix - Resume Upload

## Issue Fixed
**Double file extension in Cloudinary URLs**

### Before (Incorrect)
```
https://res.cloudinary.com/dm8vlf3vj/image/upload/fl_attachment:false/v1764663453/placement-portal/resumes/resume_692e9bf79ee477bfb2320b81_1764663451155.pdf.pdf
                                                                                                                          ^^^^^^^^
                                                                                          Duplicate extension added
```

### After (Correct)
```
https://res.cloudinary.com/dm8vlf3vj/image/upload/fl_attachment:false/v1764663453/placement-portal/resumes/resume_692e9bf79ee477bfb2320b81_1764663451155.pdf
```

## What Was Changed

**File:** `backend-node/config/fileUpload.js`

**Problem:** The `public_id` function was manually appending the file extension:
```javascript
// BEFORE - WRONG
public_id: (req, file) => {
  const userId = req.user?.id || 'unknown';
  const timestamp = Date.now();
  const ext = file.originalname.split('.').pop();
  return `resume_${userId}_${timestamp}.${ext}`;  // ❌ Adds .pdf
}
```

Cloudinary then automatically adds the extension based on `allowed_formats`, resulting in `.pdf.pdf`

**Solution:** Removed manual extension addition since Cloudinary handles it:
```javascript
// AFTER - CORRECT
public_id: (req, file) => {
  const userId = req.user?.id || 'unknown';
  const timestamp = Date.now();
  // Don't add extension - Cloudinary adds it automatically based on allowed_formats
  return `resume_${userId}_${timestamp}`;  // ✅ Cloudinary adds .pdf
}
```

## Testing the Fix

1. **Backend restarted** with the corrected configuration
2. **Frontend still running** - will use new URLs for any future uploads
3. **Existing PDFs** with `.pdf.pdf` extension won't break but new uploads will use correct format

## What This Fixes

✅ **Correct Cloudinary URLs** for future resume uploads
✅ **Google Docs Viewer** will work properly
✅ **PDF viewing** will function as intended
✅ **Database storage** of correct URLs

## Next Steps

You can now:
1. Upload a new PDF resume - it will have the correct single extension
2. Click "View Resume" - Google Docs Viewer will open the PDF inline
3. The URL will be stored correctly in MongoDB Atlas for persistence

**Example new upload URL:**
```
https://res.cloudinary.com/dm8vlf3vj/image/upload/fl_attachment:false/v1764663453/placement-portal/resumes/resume_[userId]_[timestamp].pdf
```
