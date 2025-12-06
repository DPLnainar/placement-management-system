import { Types } from 'mongoose';
import StudentData from '@models/StudentData';
import Application from '@models/Application';
import Job from '@models/Job';
import User from '@models/User';

/**
 * Analytics Service
 * Provides comprehensive placement statistics and analytics
 */

export interface DepartmentStats {
  dept: string;
  total: number;
  placed: number;
  placementRate: number;
}

export interface CompanyPlacementStats {
  company: string;
  placedCount: number;
}

export interface JobStats {
  jobId: string;
  jobTitle: string;
  companyName: string;
  eligibleCount: number;
  appliedCount: number;
  shortlistedCount: number;
  placedCount: number;
}

export interface PlacementStats {
  totalStudents: number;
  totalPlaced: number;
  placementRate: number;
  deptWiseCounts: DepartmentStats[];
  companyWisePlacements: CompanyPlacementStats[];
  jobWiseStats: JobStats[];
}

export interface EligibilityViolation {
  reason: string;
  count: number;
  sampleUserIds: string[];
}

export interface DateRange {
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Get comprehensive placement statistics for a college
 */
export async function getPlacementStats(
  collegeId: string,
  options: DateRange = {}
): Promise<PlacementStats> {
  const { fromDate, toDate } = options;
  
  // Build date filter
  const dateFilter: any = {};
  if (fromDate || toDate) {
    dateFilter.createdAt = {};
    if (fromDate) dateFilter.createdAt.$gte = fromDate;
    if (toDate) dateFilter.createdAt.$lte = toDate;
  }

  // Get all students for the college
  const students = await User.find({
    collegeId: new Types.ObjectId(collegeId),
    role: 'student',
    ...dateFilter
  }).select('_id department academicProfileId');

  const totalStudents = students.length;
  
  // Get student profiles with placement status
  const studentIds = students.map(s => s._id);
  const studentProfiles = await StudentData.find({
    userId: { $in: studentIds }
  }).select('userId placementStatus department');

  // Count placed students
  const placedStudents = studentProfiles.filter(
    profile => profile.placementStatus === 'placed'
  );
  const totalPlaced = placedStudents.length;
  const placementRate = totalStudents > 0 ? (totalPlaced / totalStudents) * 100 : 0;

  // Department-wise statistics
  const deptMap = new Map<string, { total: number; placed: number }>();
  
  for (const student of students) {
    const dept = student.department || 'Unknown';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { total: 0, placed: 0 });
    }
    const deptData = deptMap.get(dept)!;
    deptData.total++;
    
    // Check if this student is placed
    const profile = studentProfiles.find(p => p.userId?.toString() === student._id.toString());
    if (profile && profile.placementStatus === 'placed') {
      deptData.placed++;
    }
  }

  const deptWiseCounts: DepartmentStats[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
    dept,
    total: data.total,
    placed: data.placed,
    placementRate: data.total > 0 ? (data.placed / data.total) * 100 : 0
  }));

  // Get jobs for the college within date range
  const jobFilter: any = { college: new Types.ObjectId(collegeId) };
  if (fromDate || toDate) {
    jobFilter.createdAt = {};
    if (fromDate) jobFilter.createdAt.$gte = fromDate;
    if (toDate) jobFilter.createdAt.$lte = toDate;
  }
  
  const jobs = await Job.find(jobFilter).select('_id title companyName');
  const jobIds = jobs.map(j => j._id);

  // Get applications for these jobs
  const applications = await Application.find({
    jobId: { $in: jobIds }
  }).select('jobId studentId status');

  // Company-wise placements
  const companyMap = new Map<string, number>();
  const placedApplications = applications.filter(app => 
    ['PLACED', 'SHORTLISTED', 'OFFERED', 'selected', 'offer_accepted', 'joined'].includes(app.status)
  );

  for (const app of placedApplications) {
    const job = jobs.find(j => j._id.toString() === app.jobId.toString());
    if (job) {
      const company = job.companyName;
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    }
  }

  const companyWisePlacements: CompanyPlacementStats[] = Array.from(companyMap.entries())
    .map(([company, placedCount]) => ({ company, placedCount }))
    .sort((a, b) => b.placedCount - a.placedCount);

  // Job-wise statistics
  const jobWiseStats: JobStats[] = [];
  
  for (const job of jobs) {
    const jobApplications = applications.filter(
      app => app.jobId.toString() === job._id.toString()
    );
    
    const appliedCount = jobApplications.length;
    const shortlistedCount = jobApplications.filter(app => 
      ['SHORTLISTED', 'shortlisted', 'aptitude_cleared', 'technical_cleared', 'hr_cleared'].includes(app.status)
    ).length;
    const placedCount = jobApplications.filter(app => 
      ['PLACED', 'placed', 'selected', 'offer_accepted'].includes(app.status)
    ).length;

    // For eligible count, we'd need to check job criteria against all students
    // For simplicity, we'll use total students in relevant departments
    const eligibleCount = students.length; // Simplified - can be enhanced with actual eligibility checks

    jobWiseStats.push({
      jobId: job._id.toString(),
      jobTitle: job.title,
      companyName: job.companyName,
      eligibleCount,
      appliedCount,
      shortlistedCount,
      placedCount
    });
  }

  return {
    totalStudents,
    totalPlaced,
    placementRate: Math.round(placementRate * 100) / 100,
    deptWiseCounts,
    companyWisePlacements,
    jobWiseStats
  };
}

/**
 * Get eligibility violations for a specific job
 * Returns top failure reasons and sample user IDs
 */
export async function getEligibilityViolations(
  collegeId: string,
  jobId: string
): Promise<EligibilityViolation[]> {
  // Get the job with eligibility criteria
  const job = await Job.findOne({
    _id: new Types.ObjectId(jobId),
    college: new Types.ObjectId(collegeId)
  }).select('eligibilityCriteria title');

  if (!job) {
    return [];
  }

  const criteria = (job as any).eligibilityCriteria;
  if (!criteria) {
    return [];
  }

  // Get all students for the college
  const students = await User.find({
    collegeId: new Types.ObjectId(collegeId),
    role: 'student'
  }).select('_id department academicProfileId');

  // Get student profiles
  const studentIds = students.map(s => s._id);
  const profiles = await StudentData.find({
    userId: { $in: studentIds }
  }).select('userId education activeBacklogs department cgpa');

  // Track violations
  const violationMap = new Map<string, string[]>();

  for (const profile of profiles) {
    const violations: string[] = [];
    const userId = profile.userId?.toString();
    
    if (!userId) continue;

    // Check CGPA
    if (criteria.cgpa && criteria.cgpa > 0) {
      const studentCGPA = profile.education?.graduation?.cgpa || 0;
      if (studentCGPA < criteria.cgpa) {
        violations.push(`CGPA below ${criteria.cgpa} (has ${studentCGPA})`);
      }
    }

    // Check 10th percentage
    if (criteria.tenthPct && criteria.tenthPct > 0) {
      const tenthPct = profile.education?.tenth?.percentage || 0;
      if (tenthPct < criteria.tenthPct) {
        violations.push(`10th % below ${criteria.tenthPct} (has ${tenthPct})`);
      }
    }

    // Check 12th percentage
    if (criteria.twelfthPct && criteria.twelfthPct > 0) {
      const twelfthPct = profile.education?.twelfth?.percentage || 0;
      if (twelfthPct < criteria.twelfthPct) {
        violations.push(`12th % below ${criteria.twelfthPct} (has ${twelfthPct})`);
      }
    }

    // Check backlogs/arrears
    const activeBacklogs = (profile as any).activeBacklogs;
    if (!criteria.allowArrears && activeBacklogs && activeBacklogs > 0) {
      violations.push(`Has active backlogs (${activeBacklogs})`);
    }

    // Check department eligibility
    if (criteria.deptList && criteria.deptList.length > 0) {
      const student = students.find(s => s._id.toString() === userId);
      const dept = student?.department || (profile as any).department;
      if (dept && !criteria.deptList.includes(dept)) {
        violations.push(`Department not eligible (${dept})`);
      }
    }

    // Add violations to map
    for (const violation of violations) {
      if (!violationMap.has(violation)) {
        violationMap.set(violation, []);
      }
      const userList = violationMap.get(violation)!;
      if (userList.length < 10) { // Limit sample size
        userList.push(userId);
      }
    }
  }

  // Convert to array and sort by count
  const violations: EligibilityViolation[] = Array.from(violationMap.entries())
    .map(([reason, sampleUserIds]) => ({
      reason,
      count: sampleUserIds.length,
      sampleUserIds: sampleUserIds.slice(0, 5) // Return max 5 samples
    }))
    .sort((a, b) => b.count - a.count);

  return violations;
}

/**
 * Get weekly summary with trend analysis
 */
export async function getWeeklySummary(collegeId: string): Promise<{
  currentWeek: PlacementStats;
  previousWeek: PlacementStats;
  trends: {
    placementRateChange: number;
    topPerformingDept: string;
    topHiringCompany: string;
    urgentActions: string[];
  };
}> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [currentWeek, previousWeek] = await Promise.all([
    getPlacementStats(collegeId, { fromDate: weekAgo, toDate: now }),
    getPlacementStats(collegeId, { fromDate: twoWeeksAgo, toDate: weekAgo })
  ]);

  const placementRateChange = currentWeek.placementRate - previousWeek.placementRate;
  
  // Find top performing department
  const topPerformingDept = currentWeek.deptWiseCounts.reduce(
    (max, dept) => (dept.placementRate > max.placementRate ? dept : max),
    currentWeek.deptWiseCounts[0] || { dept: 'None', placementRate: 0, total: 0, placed: 0 }
  );

  // Find top hiring company
  const topHiringCompany = currentWeek.companyWisePlacements[0]?.company || 'None';

  // Generate urgent actions
  const urgentActions: string[] = [];
  
  if (placementRateChange < -5) {
    urgentActions.push(`Placement rate dropped by ${Math.abs(placementRateChange).toFixed(1)}%`);
  }

  // Check for departments with low placement rates
  const lowPerformingDepts = currentWeek.deptWiseCounts.filter(dept => dept.placementRate < 50);
  if (lowPerformingDepts.length > 0) {
    urgentActions.push(`${lowPerformingDepts.length} department(s) with placement rate < 50%`);
  }

  // Check for jobs with low application rates
  const lowApplicationJobs = currentWeek.jobWiseStats.filter(
    job => job.eligibleCount > 0 && (job.appliedCount / job.eligibleCount) < 0.3
  );
  if (lowApplicationJobs.length > 0) {
    urgentActions.push(`${lowApplicationJobs.length} job(s) with low application rate`);
  }

  return {
    currentWeek,
    previousWeek,
    trends: {
      placementRateChange: Math.round(placementRateChange * 100) / 100,
      topPerformingDept: topPerformingDept.dept,
      topHiringCompany,
      urgentActions: urgentActions.slice(0, 3) // Top 3 urgent actions
    }
  };
}
