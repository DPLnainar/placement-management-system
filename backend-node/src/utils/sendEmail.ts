import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

/**
 * Send Email Utility
 * 
 * Uses nodemailer to send emails via Gmail SMTP
 * Requires Gmail App Password (not regular password)
 * 
 * Setup Gmail App Password:
 * 1. Go to Google Account settings
 * 2. Security > 2-Step Verification (enable if not already)
 * 3. App passwords > Generate new app password
 * 4. Add to .env as EMAIL_PASSWORD
 */

const sendEmail = async (options: EmailOptions) => {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
            port: Number(process.env.EMAIL_PORT) || 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email options
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'College Placement System'}" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || `<p>${options.text}</p>`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

export default sendEmail;
