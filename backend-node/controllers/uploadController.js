const User = require('../models/User');
const { deleteFile } = require('../config/fileUpload');

/**
 * Upload Resume
 * POST /api/upload/resume
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old resume from Cloudinary if exists
    if (user.resumePublicId) {
      try {
        await deleteFile(user.resumePublicId, 'raw');
      } catch (error) {
        console.error('Error deleting old resume:', error);
      }
    }

    // Update user with new resume
    user.resumeFile = req.file.path; // Cloudinary URL
    user.resumePublicId = req.file.filename; // Cloudinary public ID
    user.resumeUploadedAt = new Date();
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeUrl: req.file.path,
        uploadedAt: user.resumeUploadedAt
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading resume',
      error: error.message
    });
  }
};

/**
 * Upload Profile Photo
 * POST /api/upload/photo
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old photo from Cloudinary if exists
    if (user.profilePhotoPublicId) {
      try {
        await deleteFile(user.profilePhotoPublicId, 'image');
      } catch (error) {
        console.error('Error deleting old photo:', error);
      }
    }

    // Update user with new photo
    user.profilePhoto = req.file.path;
    user.profilePhotoPublicId = req.file.filename;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl: req.file.path
      }
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile photo',
      error: error.message
    });
  }
};

/**
 * Upload Additional Document
 * POST /api/upload/document
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { name, type } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add document to user's documents array
    const document = {
      name: name || req.file.originalname,
      type: type || 'other',
      url: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date()
    };

    user.documents.push(document);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: user.documents[user.documents.length - 1]
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

/**
 * Delete Resume
 * DELETE /api/upload/resume
 */
exports.deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.resumePublicId) {
      return res.status(404).json({
        success: false,
        message: 'No resume found to delete'
      });
    }

    // Delete from Cloudinary
    await deleteFile(user.resumePublicId, 'raw');

    // Clear resume fields
    user.resumeFile = '';
    user.resumePublicId = '';
    user.resumeUploadedAt = null;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resume',
      error: error.message
    });
  }
};

/**
 * Delete Document
 * DELETE /api/upload/document/:documentId
 */
exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const document = user.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from Cloudinary
    if (document.publicId) {
      await deleteFile(document.publicId, 'auto');
    }

    // Remove document from array
    user.documents.pull(documentId);
    await user.save();

    res.status(200).json({
      success: false,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

/**
 * Get User's Uploaded Files
 * GET /api/upload/files
 */
exports.getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('resumeFile resumeUploadedAt profilePhoto documents');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        resume: user.resumeFile ? {
          url: user.resumeFile,
          uploadedAt: user.resumeUploadedAt
        } : null,
        profilePhoto: user.profilePhoto || null,
        documents: user.documents || []
      }
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files',
      error: error.message
    });
  }
};

module.exports = exports;
