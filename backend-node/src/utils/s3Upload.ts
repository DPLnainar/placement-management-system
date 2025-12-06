import {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3Config } from '../config/s3Config';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadResult {
    success: boolean;
    url: string;
    key: string;
    bucket: string;
    message?: string;
}

export interface DeleteResult {
    success: boolean;
    message: string;
}

/**
 * Upload a file to S3
 * @param file - The file buffer or stream
 * @param folder - The folder path in S3 (e.g., 'resumes', 'profile-pictures')
 * @param originalName - Original filename
 * @param contentType - MIME type of the file
 * @returns Upload result with S3 URL and key
 */
export const uploadToS3 = async (
    file: Buffer,
    folder: string,
    originalName: string,
    contentType: string
): Promise<UploadResult> => {
    try {
        // Generate unique filename
        const fileExtension = path.extname(originalName);
        const fileName = `${uuidv4()}${fileExtension}`;
        const key = `${folder}/${fileName}`;

        // Upload parameters
        const uploadParams = {
            Bucket: s3Config.bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
            // Make files publicly readable (optional - adjust based on your security needs)
            // ACL: 'public-read' as ObjectCannedACL,
        };

        // Upload to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Generate the file URL
        let fileUrl: string;
        if (s3Config.cloudFrontUrl) {
            // Use CloudFront URL if configured
            fileUrl = `${s3Config.cloudFrontUrl}/${key}`;
        } else {
            // Use S3 URL
            fileUrl = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
        }

        return {
            success: true,
            url: fileUrl,
            key: key,
            bucket: s3Config.bucketName,
            message: 'File uploaded successfully',
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error(
            `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};

/**
 * Delete a file from S3
 * @param key - The S3 object key (file path in bucket)
 * @returns Delete result
 */
export const deleteFromS3 = async (key: string): Promise<DeleteResult> => {
    try {
        const deleteParams = {
            Bucket: s3Config.bucketName,
            Key: key,
        };

        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);

        return {
            success: true,
            message: 'File deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error(
            `Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};

/**
 * Generate a presigned URL for temporary access to a private file
 * @param key - The S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL
 */
export const getPresignedUrl = async (
    key: string,
    expiresIn: number = 3600
): Promise<string> => {
    try {
        const command = new GetObjectCommand({
            Bucket: s3Config.bucketName,
            Key: key,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error(
            `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};

/**
 * Check if a file exists in S3
 * @param key - The S3 object key
 * @returns Boolean indicating if file exists
 */
export const fileExistsInS3 = async (key: string): Promise<boolean> => {
    try {
        const command = new HeadObjectCommand({
            Bucket: s3Config.bucketName,
            Key: key,
        });

        await s3Client.send(command);
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
};

/**
 * Copy a file within S3
 * @param sourceKey - Source file key
 * @param destinationKey - Destination file key
 * @returns Copy result
 */
export const copyFileInS3 = async (
    sourceKey: string,
    destinationKey: string
): Promise<UploadResult> => {
    try {
        const copyParams = {
            Bucket: s3Config.bucketName,
            CopySource: `${s3Config.bucketName}/${sourceKey}`,
            Key: destinationKey,
        };

        const command = new CopyObjectCommand(copyParams);
        await s3Client.send(command);

        // Generate the file URL
        let fileUrl: string;
        if (s3Config.cloudFrontUrl) {
            fileUrl = `${s3Config.cloudFrontUrl}/${destinationKey}`;
        } else {
            fileUrl = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${destinationKey}`;
        }

        return {
            success: true,
            url: fileUrl,
            key: destinationKey,
            bucket: s3Config.bucketName,
            message: 'File copied successfully',
        };
    } catch (error) {
        console.error('Error copying file in S3:', error);
        throw new Error(
            `Failed to copy file in S3: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};

/**
 * Extract S3 key from URL
 * @param url - The S3 or CloudFront URL
 * @returns The S3 key
 */
export const extractS3KeyFromUrl = (url: string): string | null => {
    try {
        // Handle CloudFront URLs
        if (s3Config.cloudFrontUrl && url.startsWith(s3Config.cloudFrontUrl)) {
            return url.replace(`${s3Config.cloudFrontUrl}/`, '');
        }

        // Handle S3 URLs
        const s3UrlPattern = new RegExp(
            `https://${s3Config.bucketName}\\.s3\\.${s3Config.region}\\.amazonaws\\.com/(.+)`
        );
        const match = url.match(s3UrlPattern);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting S3 key from URL:', error);
        return null;
    }
};

/**
 * Upload multiple files to S3
 * @param files - Array of file objects with buffer, originalName, and contentType
 * @param folder - The folder path in S3
 * @returns Array of upload results
 */
export const uploadMultipleToS3 = async (
    files: Array<{
        buffer: Buffer;
        originalName: string;
        contentType: string;
    }>,
    folder: string
): Promise<UploadResult[]> => {
    try {
        const uploadPromises = files.map((file) =>
            uploadToS3(file.buffer, folder, file.originalName, file.contentType)
        );

        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Error uploading multiple files to S3:', error);
        throw new Error(
            `Failed to upload multiple files to S3: ${error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};
