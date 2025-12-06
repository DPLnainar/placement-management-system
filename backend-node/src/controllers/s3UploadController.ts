import { Request, Response } from 'express';
import {
    uploadToS3,
    deleteFromS3,
    getPresignedUrl,
    extractS3KeyFromUrl,
    uploadMultipleToS3,
} from '../utils/s3Upload';

/**
 * Upload a single file to S3
 */
export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        const folder = req.body.folder || 'uploads';
        const file = req.file;

        const result = await uploadToS3(
            file.buffer,
            folder,
            file.originalname,
            file.mimetype
        );

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: result,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to upload file',
        });
    }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFiles = async (req: Request, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded',
            });
        }

        const folder = req.body.folder || 'uploads';
        const files = req.files.map((file) => ({
            buffer: file.buffer,
            originalName: file.originalname,
            contentType: file.mimetype,
        }));

        const results = await uploadMultipleToS3(files, folder);

        return res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data: results,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to upload files',
        });
    }
};

/**
 * Delete a file from S3
 */
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { key, url } = req.body;

        if (!key && !url) {
            return res.status(400).json({
                success: false,
                message: 'Either key or url must be provided',
            });
        }

        // Extract key from URL if only URL is provided
        const fileKey = key || extractS3KeyFromUrl(url);

        if (!fileKey) {
            return res.status(400).json({
                success: false,
                message: 'Invalid S3 key or URL',
            });
        }

        const result = await deleteFromS3(fileKey);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Delete error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to delete file',
        });
    }
};

/**
 * Generate a presigned URL for temporary file access
 */
export const generatePresignedUrl = async (req: Request, res: Response) => {
    try {
        const { key, url, expiresIn } = req.body;

        if (!key && !url) {
            return res.status(400).json({
                success: false,
                message: 'Either key or url must be provided',
            });
        }

        // Extract key from URL if only URL is provided
        const fileKey = key || extractS3KeyFromUrl(url);

        if (!fileKey) {
            return res.status(400).json({
                success: false,
                message: 'Invalid S3 key or URL',
            });
        }

        const presignedUrl = await getPresignedUrl(
            fileKey,
            expiresIn || 3600
        );

        return res.status(200).json({
            success: true,
            message: 'Presigned URL generated successfully',
            data: {
                url: presignedUrl,
                expiresIn: expiresIn || 3600,
            },
        });
    } catch (error) {
        console.error('Presigned URL error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to generate presigned URL',
        });
    }
};

/**
 * Upload resume to S3
 */
export const uploadResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded',
            });
        }

        const file = req.file;
        const userId = req.body.userId || 'unknown';

        const result = await uploadToS3(
            file.buffer,
            `resumes/${userId}`,
            file.originalname,
            file.mimetype
        );

        return res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            data: result,
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to upload resume',
        });
    }
};

/**
 * Upload profile picture to S3
 */
export const uploadProfilePicture = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded',
            });
        }

        const file = req.file;
        const userId = req.body.userId || 'unknown';

        const result = await uploadToS3(
            file.buffer,
            `profile-pictures/${userId}`,
            file.originalname,
            file.mimetype
        );

        return res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: result,
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to upload profile picture',
        });
    }
};

/**
 * Upload company logo to S3
 */
export const uploadCompanyLogo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No logo file uploaded',
            });
        }

        const file = req.file;
        const companyId = req.body.companyId || 'unknown';

        const result = await uploadToS3(
            file.buffer,
            `company-logos/${companyId}`,
            file.originalname,
            file.mimetype
        );

        return res.status(200).json({
            success: true,
            message: 'Company logo uploaded successfully',
            data: result,
        });
    } catch (error) {
        console.error('Company logo upload error:', error);
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Failed to upload company logo',
        });
    }
};
