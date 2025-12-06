import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { IStudentData } from '../models/StudentData';

export const generateResumePDF = async (studentData: IStudentData): Promise<Buffer> => {
    const templateHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume - {{personal.name}}</title>
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; }
        .header h1 { margin: 0; color: #2c3e50; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
        .contact-info { margin-top: 10px; font-size: 14px; color: #555; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
        .item { margin-bottom: 15px; }
        .item-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
        .item-subtitle { font-style: italic; color: #666; font-size: 14px; margin-bottom: 5px; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 13px; }
        ul { margin: 5px 0; padding-left: 20px; }
        li { margin-bottom: 3px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>{{personal.name}}</h1>
        <div class="contact-info">
          {{personal.email}} | {{personal.phone}} | {{personal.address}}
          {{#if socialProfiles.linkedin}} | {{socialProfiles.linkedin}}{{/if}}
          {{#if socialProfiles.github}} | {{socialProfiles.github}}{{/if}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Education</div>
        {{#if education.graduation}}
        <div class="item">
          <div class="item-header">
            <span>{{education.graduation.institutionName}}</span>
            <span>{{education.graduation.startYear}} - {{education.graduation.endYear}}</span>
          </div>
          <div class="item-subtitle">
            {{education.graduation.degree}} in {{education.graduation.branch}}
            {{#if education.graduation.cgpa}} | CGPA: {{education.graduation.cgpa}}{{/if}}
          </div>
        </div>
        {{/if}}
        {{#if education.twelfth}}
        <div class="item">
          <div class="item-header">
            <span>{{education.twelfth.schoolName}}</span>
            <span>{{education.twelfth.yearOfPassing}}</span>
          </div>
          <div class="item-subtitle">
            Class XII ({{education.twelfth.board}}) | {{education.twelfth.percentage}}%
          </div>
        </div>
        {{/if}}
        {{#if education.tenth}}
        <div class="item">
          <div class="item-header">
            <span>{{education.tenth.schoolName}}</span>
            <span>{{education.tenth.yearOfPassing}}</span>
          </div>
          <div class="item-subtitle">
            Class X ({{education.tenth.board}}) | {{education.tenth.percentage}}%
          </div>
        </div>
        {{/if}}
      </div>

      {{#if technicalSkills.programming.length}}
      <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="skills-list">
          {{#each technicalSkills.programming}}
          <span class="skill-tag">{{this.name}}</span>
          {{/each}}
          {{#each technicalSkills.frameworks}}
          <span class="skill-tag">{{this.name}}</span>
          {{/each}}
          {{#each technicalSkills.tools}}
          <span class="skill-tag">{{this.name}}</span>
          {{/each}}
        </div>
      </div>
      {{/if}}

      {{#if projects.length}}
      <div class="section">
        <div class="section-title">Projects</div>
        {{#each projects}}
        <div class="item">
          <div class="item-header">
            <span>{{this.title}}</span>
            <span>{{this.duration}}</span>
          </div>
          <div class="item-subtitle">{{this.role}} | {{this.technologies}}</div>
          <p>{{this.description}}</p>
          {{#if this.highlights}}
          <ul>
            {{#each this.highlights}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          {{/if}}
        </div>
        {{/each}}
      </div>
      {{/if}}

      {{#if internships.length}}
      <div class="section">
        <div class="section-title">Experience</div>
        {{#each internships}}
        <div class="item">
          <div class="item-header">
            <span>{{this.company}}</span>
            <span>{{this.startDate}} - {{this.endDate}}</span>
          </div>
          <div class="item-subtitle">{{this.role}}</div>
          <p>{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}

      {{#if achievements.length}}
      <div class="section">
        <div class="section-title">Achievements</div>
        <ul>
          {{#each achievements}}
          <li><strong>{{this.title}}</strong>: {{this.description}}</li>
          {{/each}}
        </ul>
      </div>
      {{/if}}
    </body>
    </html>
  `;

    const template = handlebars.compile(templateHtml);
    const html = template(studentData);

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
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
};
