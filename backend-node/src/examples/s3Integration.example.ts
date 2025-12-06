/**
 * Example: Integrating S3 into Student Profile Controller
 * 
 * This file shows how to replace Cloudinary uploads with S3 uploads
 * in your existing student profile functionality.
 */

import { Request, Response } from 'express';
import { uploadToS3, deleteFromS3, extractS3KeyFromUrl } from '../utils/s3Upload';
// import StudentData from '../models/StudentData'; // Your student model

// Extend Express Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role?: string;
        [key: string]: any;
    };
}


/**
 * Example 1: Upload Student Resume
 */
export const uploadStudentResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded',
            });
        }

        const studentId = req.body.studentId || req.user?.id; // Assuming auth middleware

        // Upload to S3
        const result = await uploadToS3(
            req.file.buffer,
            `resumes/${studentId}`,
            req.file.originalname,
            req.file.mimetype
        );

        // Update student record in database
        // await StudentData.findByIdAndUpdate(studentId, {
        //     resume: {
        //         url: result.url,
        //         key: result.key,
        //         uploadedAt: new Date(),
        //     },
        // });

        return res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            data: {
                url: result.url,
                key: result.key,
            },
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload resume',
        });
    }
};

/**
 * Example 2: Update Student Profile Picture
 */
export const updateProfilePicture = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded',
            });
        }

        const studentId = req.body.studentId || req.user?.id;

        // Get existing profile picture to delete it
        // const student = await StudentData.findById(studentId);
        // if (student?.profilePicture?.key) {
        //     await deleteFromS3(student.profilePicture.key);
        // }

        // Upload new profile picture
        const result = await uploadToS3(
            req.file.buffer,
            `profile-pictures/${studentId}`,
            req.file.originalname,
            req.file.mimetype
        );

        // Update student record
        // await StudentData.findByIdAndUpdate(studentId, {
        //     profilePicture: {
        //         url: result.url,
        //         key: result.key,
        //         uploadedAt: new Date(),
        //     },
        // });

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                url: result.url,
            },
        });
    } catch (error) {
        console.error('Profile picture update error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update profile picture',
        });
    }
};

/**
 * Example 3: Delete Student Resume
 */
export const deleteStudentResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const studentId = req.params.studentId || req.user?.id;

        // Get student record
        // const student = await StudentData.findById(studentId);
        // if (!student?.resume?.key) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'No resume found',
        //     });
        // }

        // Delete from S3
        // await deleteFromS3(student.resume.key);

        // Update student record
        // await StudentData.findByIdAndUpdate(studentId, {
        //     $unset: { resume: 1 },
        // });

        return res.status(200).json({
            success: true,
            message: 'Resume deleted successfully',
        });
    } catch (error) {
        console.error('Resume deletion error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete resume',
        });
    }
};

/**
 * Example 4: Upload Multiple Documents
 */
export const uploadMultipleDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded',
            });
        }

        const studentId = req.body.studentId || req.user?.id;

        // Upload all files to S3
        const uploadPromises = req.files.map((file) =>
            uploadToS3(
                file.buffer,
                `documents/${studentId}`,
                file.originalname,
                file.mimetype
            )
        );

        const results = await Promise.all(uploadPromises);

        // Update student record with document URLs
        // const documents = results.map((result) => ({
        //     url: result.url,
        //     key: result.key,
        //     uploadedAt: new Date(),
        // }));
        // await StudentData.findByIdAndUpdate(studentId, {
        //     $push: { documents: { $each: documents } },
        // });

        return res.status(200).json({
            success: true,
            message: 'Documents uploaded successfully',
            data: results.map((r) => ({ url: r.url, key: r.key })),
        });
    } catch (error) {
        console.error('Documents upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload documents',
        });
    }
};

/**
 * Example 5: Migration Helper - Convert Cloudinary URL to S3
 */
export const migrateCloudinaryToS3 = async (cloudinaryUrl: string, folder: string) => {
    try {
        // Download file from Cloudinary
        const response = await fetch(cloudinaryUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Extract filename from URL
        const urlParts = cloudinaryUrl.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Determine content type
        const extension = filename.split('.').pop()?.toLowerCase();
        const contentTypeMap: Record<string, string> = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';

        // Upload to S3
        const result = await uploadToS3(buffer, folder, filename, contentType);

        return result;
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
};

/**
 * Example 6: Batch Migration Script
 */
export const batchMigrateToS3 = async () => {
    try {
        // Get all students with Cloudinary URLs
        // const students = await StudentData.find({
        //     'resume.url': { $regex: /cloudinary/ },
        // });

        // console.log(`Found ${students.length} students to migrate`);

        // for (const student of students) {
        //     try {
        //         if (student.resume?.url) {
        //             // Migrate resume
        //             const result = await migrateCloudinaryToS3(
        //                 student.resume.url,
        //                 `resumes/${student._id}`
        //             );

        //             // Update student record
        //             await StudentData.findByIdAndUpdate(student._id, {
        //                 resume: {
        //                     url: result.url,
        //                     key: result.key,
        //                     uploadedAt: new Date(),
        //                 },
        //             });

        //             console.log(`Migrated resume for student ${student._id}`);
        //         }
        //     } catch (error) {
        //         console.error(`Failed to migrate student ${student._id}:`, error);
        //     }
        // }

        console.log('Migration completed');
    } catch (error) {
        console.error('Batch migration error:', error);
        throw error;
    }
};
