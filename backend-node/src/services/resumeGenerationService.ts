import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { uploadToS3 } from '../utils/s3Upload';
import StudentData from '../models/StudentData';

interface ResumeData {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    education: Array<{
        institution: string;
        degree: string;
        branch?: string;
        year: string;
        cgpa?: string;
    }>;
    skills?: any[];
    skillsByCategory?: Array<{
        category: string;
        skills: string[];
    }>;
    experience?: Array<{
        company: string;
        role: string;
        duration: string;
        description?: string;
    }>;
    projects?: Array<{
        title: string;
        description?: string;
        technologies?: string;
        date?: string;
    }>;
    achievements?: string[];
}

/**
 * Generate resume PDF from student data
 * @param studentId - Student's database ID
 * @param templateName - Template to use (modern, classic, creative)
 * @returns S3 URL of generated resume
 */
export const generateResume = async (
    studentId: string,
    templateName: 'modern' | 'classic' | 'creative' = 'modern'
): Promise<string> => {
    try {
        console.log(`Generating resume for student ${studentId} with template ${templateName}`);

        // 1. Fetch student data
        const student = await StudentData.findById(studentId).populate('userId');
        if (!student) {
            throw new Error('Student not found');
        }

        // 2. Prepare resume data
        const resumeData = prepareResumeData(student);

        // 3. Load HTML template
        const templatePath = path.join(__dirname, '..', '..', 'templates', `resume_${templateName}.html`);
        let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        // 4. Replace template variables (simple string replacement)
        htmlTemplate = renderTemplate(htmlTemplate, resumeData);

        // 5. Generate PDF using Puppeteer
        const pdfBuffer = await generatePDF(htmlTemplate);

        // 6. Upload to S3
        const fileName = `resumes/${studentId}_${Date.now()}.pdf`;
        const s3Url = await uploadToS3(pdfBuffer, fileName, 'application/pdf');

        console.log(`Resume generated successfully: ${s3Url}`);
        return s3Url;

    } catch (error) {
        console.error('Error generating resume:', error);
        throw new Error(`Failed to generate resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Prepare resume data from student document
 */
function prepareResumeData(student: any): ResumeData {
    const userId = student.userId as any;

    // Education
    const education = [];

    // Current education
    if (student.education?.graduation) {
        education.push({
            institution: student.education.graduation.institutionName || 'University',
            degree: student.education.graduation.degree || 'Bachelor of Technology',
            branch: student.education.graduation.branch,
            year: student.education.graduation.year || 'Present',
            cgpa: student.cgpa?.toString()
        });
    }

    // 12th
    if (student.education?.twelfth) {
        education.push({
            institution: student.education.twelfth.schoolName || student.education.twelfth.board,
            degree: 'Class XII',
            year: student.education.twelfth.year,
            cgpa: student.education.twelfth.percentage ? `${student.education.twelfth.percentage}%` : undefined
        });
    }

    // 10th
    if (student.education?.tenth) {
        education.push({
            institution: student.education.tenth.schoolName || student.education.tenth.board,
            degree: 'Class X',
            year: student.education.tenth.year,
            cgpa: student.education.tenth.percentage ? `${student.education.tenth.percentage}%` : undefined
        });
    }

    // Skills by category
    const skillsByCategory = [];
    if (student.skills?.technical && student.skills.technical.length > 0) {
        skillsByCategory.push({
            category: 'Technical Skills',
            skills: student.skills.technical.map((s: any) => s.name || s)
        });
    }
    if (student.skills?.tools && student.skills.tools.length > 0) {
        skillsByCategory.push({
            category: 'Tools & Technologies',
            skills: student.skills.tools
        });
    }
    if (student.skills?.languages && student.skills.languages.length > 0) {
        skillsByCategory.push({
            category: 'Languages',
            skills: student.skills.languages
        });
    }

    // Experience
    const experience = student.experience?.map((exp: any) => ({
        company: exp.companyName,
        role: exp.role,
        duration: `${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}`,
        description: exp.description
    })) || [];

    // Projects
    const projects = student.projects?.map((proj: any) => ({
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies?.join(', '),
        date: proj.endDate ? new Date(proj.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined
    })) || [];

    // Achievements
    const achievements = [];
    if (student.achievements && student.achievements.length > 0) {
        achievements.push(...student.achievements.map((a: any) => a.title || a));
    }
    if (student.certifications && student.certifications.length > 0) {
        achievements.push(...student.certifications.map((c: any) => c.name || c));
    }

    return {
        name: userId?.fullName || student.personal?.name || 'Student Name',
        email: userId?.email || student.personal?.email || '',
        phone: student.personal?.phone || '',
        linkedin: student.personal?.linkedInUrl,
        github: student.personal?.githubUrl,
        portfolio: student.personal?.portfolioUrl,
        education,
        skillsByCategory,
        experience,
        projects,
        achievements: achievements.length > 0 ? achievements : undefined
    };
}

/**
 * Simple template rendering (replace {{variable}} with values)
 */
function renderTemplate(template: string, data: any): string {
    let html = template;

    // Simple variable replacement
    html = html.replace(/\{\{name\}\}/g, data.name || '');
    html = html.replace(/\{\{email\}\}/g, data.email || '');
    html = html.replace(/\{\{phone\}\}/g, data.phone || '');
    html = html.replace(/\{\{linkedin\}\}/g, data.linkedin || '');
    html = html.replace(/\{\{github\}\}/g, data.github || '');

    // Handle conditionals and loops (basic implementation)
    // For production, use a proper template engine like Handlebars

    // Education section
    if (data.education && data.education.length > 0) {
        let educationHtml = '';
        data.education.forEach((edu: any) => {
            educationHtml += `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${edu.degree}${edu.branch ? ` in ${edu.branch}` : ''}</div>
                            <div class="item-subtitle">${edu.institution}</div>
                        </div>
                        <div class="item-date">${edu.year}</div>
                    </div>
                    ${edu.cgpa ? `<div class="item-description">CGPA: ${edu.cgpa}</div>` : ''}
                </div>
            `;
        });
        html = html.replace(/\{\{#each education\}\}[\s\S]*?\{\{\/each\}\}/g, educationHtml);
    }

    // Skills section
    if (data.skillsByCategory && data.skillsByCategory.length > 0) {
        let skillsHtml = '';
        data.skillsByCategory.forEach((category: any) => {
            skillsHtml += `
                <div class="skill-category">
                    <div class="skill-category-title">${category.category}</div>
                    <div class="skill-tags">
                        ${category.skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            `;
        });
        html = html.replace(/\{\{#each skillsByCategory\}\}[\s\S]*?\{\{\/each\}\}/g, skillsHtml);
    }

    // Experience section
    if (data.experience && data.experience.length > 0) {
        let expHtml = '';
        data.experience.forEach((exp: any) => {
            expHtml += `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${exp.role}</div>
                            <div class="item-subtitle">${exp.company}</div>
                        </div>
                        <div class="item-date">${exp.duration}</div>
                    </div>
                    ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                </div>
            `;
        });
        html = html.replace(/\{\{#if experience\}\}[\s\S]*?\{\{\/if\}\}/g, `<div class="section"><div class="section-title">Experience</div>${expHtml}</div>`);
    } else {
        html = html.replace(/\{\{#if experience\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Projects section
    if (data.projects && data.projects.length > 0) {
        let projHtml = '';
        data.projects.forEach((proj: any) => {
            projHtml += `
                <div class="project-item">
                    <div class="item-header">
                        <div class="item-title">${proj.title}</div>
                        ${proj.date ? `<div class="item-date">${proj.date}</div>` : ''}
                    </div>
                    ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
                    ${proj.technologies ? `<div class="item-description" style="margin-top: 5px;"><strong>Technologies:</strong> ${proj.technologies}</div>` : ''}
                </div>
            `;
        });
        html = html.replace(/\{\{#if projects\}\}[\s\S]*?\{\{\/if\}\}/g, `<div class="section"><div class="section-title">Projects</div>${projHtml}</div>`);
    } else {
        html = html.replace(/\{\{#if projects\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Achievements section
    if (data.achievements && data.achievements.length > 0) {
        const achievementsHtml = data.achievements.map((a: string) => `<div class="achievement-item">${a}</div>`).join('');
        html = html.replace(/\{\{#if achievements\}\}[\s\S]*?\{\{\/if\}\}/g, `<div class="section"><div class="section-title">Achievements & Certifications</div>${achievementsHtml}</div>`);
    } else {
        html = html.replace(/\{\{#if achievements\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    return html;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        return Buffer.from(pdfBuffer);

    } finally {
        await browser.close();
    }
}

export default { generateResume };
