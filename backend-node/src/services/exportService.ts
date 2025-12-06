import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Types } from 'mongoose';
import { getPlacementStats, PlacementStats } from './analyticsService';
import Application from '@models/Application';
import Job from '@models/Job';
import StudentData from '@models/StudentData';
import User from '@models/User';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export type ExportFormat = 'csv' | 'xlsx';
export type ExportType = 'placement' | 'jobs' | 'applications';

export interface ExportOptions {
  collegeId: string;
  fromDate?: Date;
  toDate?: Date;
  format: ExportFormat;
  type: ExportType;
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  fileSize: number;
}

// Ensure exports directory exists
const EXPORTS_DIR = path.join(__dirname, '../../exports');

async function ensureExportsDir(): Promise<void> {
  try {
    await mkdir(EXPORTS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
  }
}

/**
 * Export placement statistics to CSV
 */
async function exportPlacementStatsToCSV(
  stats: PlacementStats,
  filePath: string
): Promise<void> {
  // Prepare data for CSV
  const overviewData = [{
    'Total Students': stats.totalStudents,
    'Total Placed': stats.totalPlaced,
    'Placement Rate (%)': stats.placementRate
  }];

  const deptData = stats.deptWiseCounts.map(dept => ({
    'Department': dept.dept,
    'Total Students': dept.total,
    'Placed': dept.placed,
    'Placement Rate (%)': dept.placementRate.toFixed(2)
  }));

  const companyData = stats.companyWisePlacements.map(comp => ({
    'Company': comp.company,
    'Placements': comp.placedCount
  }));

  const jobData = stats.jobWiseStats.map(job => ({
    'Job Title': job.jobTitle,
    'Company': job.companyName,
    'Eligible': job.eligibleCount,
    'Applied': job.appliedCount,
    'Shortlisted': job.shortlistedCount,
    'Placed': job.placedCount
  }));

  // Combine all data with section headers
  const combinedData: any[] = [
    { 'Section': '=== OVERVIEW ===' },
    ...overviewData,
    { 'Section': '' },
    { 'Section': '=== DEPARTMENT-WISE STATISTICS ===' },
    ...deptData,
    { 'Section': '' },
    { 'Section': '=== COMPANY-WISE PLACEMENTS ===' },
    ...companyData,
    { 'Section': '' },
    { 'Section': '=== JOB-WISE STATISTICS ===' },
    ...jobData
  ];

  const parser = new Parser({ fields: Object.keys(combinedData[0]) });
  const csv = parser.parse(combinedData);

  await fs.promises.writeFile(filePath, csv);
}

/**
 * Export placement statistics to Excel
 */
async function exportPlacementStatsToExcel(
  stats: PlacementStats,
  filePath: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Overview sheet
  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 }
  ];
  overviewSheet.addRows([
    { metric: 'Total Students', value: stats.totalStudents },
    { metric: 'Total Placed', value: stats.totalPlaced },
    { metric: 'Placement Rate (%)', value: stats.placementRate }
  ]);
  overviewSheet.getRow(1).font = { bold: true };

  // Department-wise sheet
  const deptSheet = workbook.addWorksheet('Department-wise');
  deptSheet.columns = [
    { header: 'Department', key: 'dept', width: 20 },
    { header: 'Total Students', key: 'total', width: 15 },
    { header: 'Placed', key: 'placed', width: 15 },
    { header: 'Placement Rate (%)', key: 'rate', width: 20 }
  ];
  deptSheet.addRows(stats.deptWiseCounts.map(d => ({
    dept: d.dept,
    total: d.total,
    placed: d.placed,
    rate: d.placementRate.toFixed(2)
  })));
  deptSheet.getRow(1).font = { bold: true };

  // Company-wise sheet
  const companySheet = workbook.addWorksheet('Company-wise');
  companySheet.columns = [
    { header: 'Company', key: 'company', width: 30 },
    { header: 'Placements', key: 'placed', width: 15 }
  ];
  companySheet.addRows(stats.companyWisePlacements);
  companySheet.getRow(1).font = { bold: true };

  // Job-wise sheet
  const jobSheet = workbook.addWorksheet('Job-wise');
  jobSheet.columns = [
    { header: 'Job Title', key: 'title', width: 25 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Eligible', key: 'eligible', width: 12 },
    { header: 'Applied', key: 'applied', width: 12 },
    { header: 'Shortlisted', key: 'shortlisted', width: 12 },
    { header: 'Placed', key: 'placed', width: 12 }
  ];
  jobSheet.addRows(stats.jobWiseStats.map(j => ({
    title: j.jobTitle,
    company: j.companyName,
    eligible: j.eligibleCount,
    applied: j.appliedCount,
    shortlisted: j.shortlistedCount,
    placed: j.placedCount
  })));
  jobSheet.getRow(1).font = { bold: true };

  await workbook.xlsx.writeFile(filePath);
}

/**
 * Export jobs data
 */
async function exportJobsData(
  collegeId: string,
  fromDate: Date | undefined,
  toDate: Date | undefined,
  filePath: string,
  format: ExportFormat
): Promise<void> {
  const filter: any = { college: new Types.ObjectId(collegeId) };
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
  }

  const jobs = await Job.find(filter)
    .select('title companyName role packageLPA stipend category location status createdAt')
    .lean();

  const data = jobs.map(job => ({
    'Job Title': job.title,
    'Company': job.companyName,
    'Role': job.role,
    'Package (LPA)': job.packageLPA || 'N/A',
    'Stipend': job.stipend || 'N/A',
    'Category': job.category?.join(', ') || 'N/A',
    'Location': job.location || 'N/A',
    'Status': job.status,
    'Created At': job.createdAt?.toISOString().split('T')[0] || 'N/A'
  }));

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    const csv = parser.parse(data);
    await fs.promises.writeFile(filePath, csv);
  } else {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jobs');
    sheet.columns = [
      { header: 'Job Title', key: 'title', width: 30 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Package (LPA)', key: 'package', width: 15 },
      { header: 'Stipend', key: 'stipend', width: 12 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'created', width: 15 }
    ];
    sheet.addRows(jobs.map(j => ({
      title: j.title,
      company: j.companyName,
      role: j.role,
      package: j.packageLPA || 'N/A',
      stipend: j.stipend || 'N/A',
      category: j.category?.join(', ') || 'N/A',
      location: j.location || 'N/A',
      status: j.status,
      created: j.createdAt?.toISOString().split('T')[0] || 'N/A'
    })));
    sheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(filePath);
  }
}

/**
 * Export applications data
 */
async function exportApplicationsData(
  collegeId: string,
  fromDate: Date | undefined,
  toDate: Date | undefined,
  filePath: string,
  format: ExportFormat
): Promise<void> {
  // Get jobs for this college
  const jobs = await Job.find({ college: new Types.ObjectId(collegeId) })
    .select('_id title companyName')
    .lean();

  const jobIds = jobs.map(j => j._id);

  const filter: any = { jobId: { $in: jobIds } };
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
  }

  const applications = await Application.find(filter)
    .populate('studentId', 'fullName email department')
    .populate('jobId', 'title companyName')
    .select('studentId jobId status appliedDate createdAt')
    .lean();

  const data = applications.map((app: any) => {
    const student = app.studentId as any;
    const job = app.jobId as any;
    return {
      'Student Name': student?.fullName || 'N/A',
      'Student Email': student?.email || 'N/A',
      'Department': student?.department || 'N/A',
      'Job Title': job?.title || 'N/A',
      'Company': job?.companyName || 'N/A',
      'Status': app.status,
      'Applied Date': app.appliedDate?.toISOString().split('T')[0] || app.createdAt?.toISOString().split('T')[0] || 'N/A'
    };
  });

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    const csv = parser.parse(data);
    await fs.promises.writeFile(filePath, csv);
  } else {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Applications');
    sheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Student Email', key: 'email', width: 30 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Job Title', key: 'job', width: 30 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Applied Date', key: 'date', width: 15 }
    ];
    sheet.addRows(data.map(d => ({
      name: d['Student Name'],
      email: d['Student Email'],
      dept: d.Department,
      job: d['Job Title'],
      company: d.Company,
      status: d.Status,
      date: d['Applied Date']
    })));
    sheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(filePath);
  }
}

/**
 * Main export function
 */
export async function generateExport(options: ExportOptions): Promise<ExportResult> {
  await ensureExportsDir();

  const timestamp = Date.now();
  const fileName = `${options.type}_${options.collegeId}_${timestamp}.${options.format}`;
  const filePath = path.join(EXPORTS_DIR, fileName);

  try {
    if (options.type === 'placement') {
      const stats = await getPlacementStats(options.collegeId, {
        fromDate: options.fromDate,
        toDate: options.toDate
      });

      if (options.format === 'csv') {
        await exportPlacementStatsToCSV(stats, filePath);
      } else {
        await exportPlacementStatsToExcel(stats, filePath);
      }
    } else if (options.type === 'jobs') {
      await exportJobsData(
        options.collegeId,
        options.fromDate,
        options.toDate,
        filePath,
        options.format
      );
    } else if (options.type === 'applications') {
      await exportApplicationsData(
        options.collegeId,
        options.fromDate,
        options.toDate,
        filePath,
        options.format
      );
    }

    const stats = await stat(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size
    };
  } catch (error) {
    // Clean up file if export failed
    try {
      await unlink(filePath);
    } catch { }
    throw error;
  }
}

/**
 * Clean up old export files
 */
export async function cleanupOldExports(maxAgeDays: number = 7): Promise<number> {
  await ensureExportsDir();

  const files = await readdir(EXPORTS_DIR);
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(EXPORTS_DIR, file);
    try {
      const stats = await stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        await unlink(filePath);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Get export file if it exists
 */
export async function getExportFile(fileName: string): Promise<string | null> {
  const filePath = path.join(EXPORTS_DIR, fileName);

  try {
    await stat(filePath);
    return filePath;
  } catch {
    return null;
  }
}
