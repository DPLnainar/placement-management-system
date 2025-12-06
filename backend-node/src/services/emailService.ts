import nodemailer, { Transporter } from 'nodemailer';
import { getWeeklySummary } from './analyticsService';
import { generateExport } from './exportService';

export interface EmailAttachment {
  filename: string;
  path: string;
}

export interface WeeklyReportOptions {
  collegeId: string;
  collegeName: string;
  recipients: string[];
  format: 'csv' | 'xlsx';
}

// Email transporter configuration
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Generate HTML email template for weekly report
 */
function generateWeeklyReportEmail(
  collegeName: string,
  summary: Awaited<ReturnType<typeof getWeeklySummary>>
): string {
  const { currentWeek, trends } = summary;
  
  const trendIndicator = trends.placementRateChange >= 0 ? '📈' : '📉';
  const trendColor = trends.placementRateChange >= 0 ? '#28a745' : '#dc3545';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #667eea;
      font-size: 14px;
      text-transform: uppercase;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .stat-card .change {
      font-size: 14px;
      margin-top: 5px;
    }
    .trend-positive { color: #28a745; }
    .trend-negative { color: #dc3545; }
    .section {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section h2 {
      margin-top: 0;
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .dept-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .dept-table th {
      background: #f8f9fa;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
    }
    .dept-table td {
      padding: 10px;
      border-bottom: 1px solid #dee2e6;
    }
    .alert {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .alert h3 {
      margin: 0 0 10px 0;
      color: #856404;
    }
    .alert ul {
      margin: 0;
      padding-left: 20px;
    }
    .alert li {
      color: #856404;
      margin-bottom: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Weekly Placement Report</h1>
    <p>${collegeName}</p>
    <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Students</h3>
      <div class="value">${currentWeek.totalStudents}</div>
    </div>
    <div class="stat-card">
      <h3>Placements</h3>
      <div class="value">${currentWeek.totalPlaced}</div>
    </div>
    <div class="stat-card">
      <h3>Placement Rate</h3>
      <div class="value">${currentWeek.placementRate.toFixed(1)}%</div>
      <div class="change" style="color: ${trendColor}">
        ${trendIndicator} ${trends.placementRateChange >= 0 ? '+' : ''}${trends.placementRateChange.toFixed(1)}% vs last week
      </div>
    </div>
  </div>

  ${trends.urgentActions.length > 0 ? `
  <div class="alert">
    <h3>⚠️ Urgent Actions Required</h3>
    <ul>
      ${trends.urgentActions.map(action => `<li>${action}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h2>🏆 Top Performers</h2>
    <p><strong>Top Performing Department:</strong> ${trends.topPerformingDept}</p>
    <p><strong>Top Hiring Company:</strong> ${trends.topHiringCompany}</p>
  </div>

  <div class="section">
    <h2>📈 Department-wise Performance</h2>
    <table class="dept-table">
      <thead>
        <tr>
          <th>Department</th>
          <th>Total</th>
          <th>Placed</th>
          <th>Rate</th>
        </tr>
      </thead>
      <tbody>
        ${currentWeek.deptWiseCounts.map(dept => `
          <tr>
            <td>${dept.dept}</td>
            <td>${dept.total}</td>
            <td>${dept.placed}</td>
            <td>${dept.placementRate.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>🏢 Company-wise Placements (Top 10)</h2>
    <table class="dept-table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Placements</th>
        </tr>
      </thead>
      <tbody>
        ${currentWeek.companyWisePlacements.slice(0, 10).map(company => `
          <tr>
            <td>${company.company}</td>
            <td>${company.placedCount}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>📎 Detailed report attached</p>
    <p>This is an automated weekly report from the Placement Management System</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send weekly placement report via email
 */
export async function sendWeeklyReport(options: WeeklyReportOptions): Promise<void> {
  const { collegeId, collegeName, recipients, format } = options;

  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients specified for weekly report');
  }

  // Get weekly summary
  const summary = await getWeeklySummary(collegeId);

  // Generate export file
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const exportResult = await generateExport({
    collegeId,
    fromDate: weekAgo,
    toDate: now,
    format,
    type: 'placement'
  });

  // Generate email HTML
  const htmlContent = generateWeeklyReportEmail(collegeName, summary);

  // Send email
  const transporter = getTransporter();
  
  const subject = `Weekly Placement Report - ${collegeName} - ${new Date().toLocaleDateString()}`;
  
  try {
    await transporter.sendMail({
      from: `"Placement System" <${process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: exportResult.fileName,
          path: exportResult.filePath
        }
      ]
    });

    console.log(`✅ Weekly report sent to ${recipients.length} recipient(s) for ${collegeName}`);
  } catch (error) {
    console.error('❌ Error sending weekly report:', error);
    throw error;
  }
}

/**
 * Send custom export via email
 */
export async function sendExportEmail(
  recipients: string[],
  subject: string,
  message: string,
  attachments: EmailAttachment[]
): Promise<void> {
  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients specified');
  }

  const transporter = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #667eea;
      color: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${subject}</h2>
  </div>
  <div class="content">
    <p>${message}</p>
  </div>
  <div class="footer">
    <p>This is an automated email from the Placement Management System</p>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Placement System" <${process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html: htmlContent,
      attachments: attachments.map(att => ({
        filename: att.filename,
        path: att.path
      }))
    });

    console.log(`✅ Export email sent to ${recipients.length} recipient(s)`);
  } catch (error) {
    console.error('❌ Error sending export email:', error);
    throw error;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
