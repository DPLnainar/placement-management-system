import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Preview PDF from Cloudinary URL
 * This endpoint proxies PDF files from Cloudinary to avoid CORS issues
 */
export const previewPdf = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ message: 'PDF URL is required' });
        }

        // Validate that it's a Cloudinary URL
        if (!url.includes('cloudinary.com')) {
            return res.status(400).json({ message: 'Invalid PDF URL' });
        }

        // Fetch the PDF from Cloudinary
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.send(Buffer.from(response.data));
    } catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).json({
            message: 'Error fetching PDF',
            error: (error as Error).message
        });
    }
};
