/**
 * Aadhaar Masking Utility
 * Masks Aadhaar number to show only last 4 digits
 */

/**
 * Mask Aadhaar number for security
 * @param aadhaar - Full 12-digit Aadhaar number
 * @returns Masked Aadhaar (e.g., "**** **** 1234")
 */
export const maskAadhaar = (aadhaar: string | undefined): string => {
    if (!aadhaar) return '';

    // Remove any spaces or special characters
    const cleaned = aadhaar.replace(/\s/g, '');

    if (cleaned.length !== 12) return '';

    // Return masked format: **** **** 1234
    const lastFour = cleaned.slice(-4);
    return `**** **** ${lastFour}`;
};

/**
 * Validate Aadhaar format
 * @param aadhaar - Aadhaar number to validate
 * @returns true if valid 12-digit number
 */
export const isValidAadhaar = (aadhaar: string): boolean => {
    if (!aadhaar) return false;
    const cleaned = aadhaar.replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned);
};
