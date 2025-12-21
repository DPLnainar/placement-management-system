import { IStudentData } from '../models/StudentData';
import { IJob } from '../models/Job';

export interface EligibilityResult {
    eligible: boolean;
    reasons: string[];
}

export const checkEligibility = (student: IStudentData, job: IJob): EligibilityResult => {
    const reasons: string[] = [];
    const criteria = job.eligibility;

    // 1. Placement Status
    if (student.placementStatus === 'placed' || student.placementStatus === 'barred' || student.placementStatus === 'opted_out') {
        reasons.push(`Student is ${student.placementStatus}`);
        return { eligible: false, reasons };
    }

    // 2. Tenth Percentage
    if (criteria.tenthPct && (student.education.tenth?.percentage || 0) < criteria.tenthPct) {
        reasons.push(`10th Percentage ${student.education.tenth?.percentage}% is less than required ${criteria.tenthPct}%`);
    }

    // 3. Twelfth Percentage
    if (criteria.twelfthPct && (student.education.twelfth?.percentage || 0) < criteria.twelfthPct) {
        reasons.push(`12th Percentage ${student.education.twelfth?.percentage}% is less than required ${criteria.twelfthPct}%`);
    }

    // 4. CGPA - Check both top-level and nested graduation CGPA
    const studentCGPA = student.cgpa || student.education?.graduation?.cgpa || 0;
    if (criteria.cgpa && studentCGPA < criteria.cgpa) {
        reasons.push(`CGPA ${studentCGPA} is less than required ${criteria.cgpa}`);
    }

    // 5. Arrears - Enhanced to check both current and history
    if (!criteria.allowArrears) {
        // Check current backlogs
        if (student.currentBacklogs > 0) {
            reasons.push(`Current backlogs ${student.currentBacklogs} not allowed`);
        }
        // Check arrear history - even if currently cleared
        // Note: Using semesterRecords as per schema
        const totalHistoricalBacklogs = student.semesterRecords?.reduce((sum, sem) => sum + (sem.backlogs || 0), 0) || 0;
        if (totalHistoricalBacklogs > 0) {
            reasons.push(`Arrear history found (${totalHistoricalBacklogs} historical backlogs) - not allowed for this company`);
        }
    }

    // 6. Department
    const studentDept = student.education.graduation?.branch || '';
    if (criteria.deptList && criteria.deptList.length > 0 && !criteria.deptList.includes(studentDept)) {
        reasons.push(`Department ${studentDept} is not eligible`);
    }

    // 7. Custom Department Rules - Enhanced with better logic
    if (criteria.customDeptRules && criteria.customDeptRules.length > 0) {
        const deptRule = criteria.customDeptRules.find(r => r.department === studentDept);
        if (deptRule) {
            // Apply department-specific criteria
            const studentCGPA = student.cgpa || student.education?.graduation?.cgpa || 0;
            if (deptRule.minCGPA && studentCGPA < deptRule.minCGPA) {
                reasons.push(`Department-specific CGPA requirement: ${studentCGPA} < ${deptRule.minCGPA}`);
            }
            if (deptRule.minTenthPct && (student.education.tenth?.percentage || 0) < deptRule.minTenthPct) {
                reasons.push(`Department-specific 10th % requirement: ${student.education.tenth?.percentage} < ${deptRule.minTenthPct}`);
            }
            if (deptRule.minTwelfthPct && (student.education.twelfth?.percentage || 0) < deptRule.minTwelfthPct) {
                reasons.push(`Department-specific 12th % requirement: ${student.education.twelfth?.percentage} < ${deptRule.minTwelfthPct}`);
            }
            if (deptRule.allowArrears === false) {
                if (student.currentBacklogs > 0) {
                    reasons.push(`Department does not allow current arrears`);
                }
                const totalHistoricalBacklogs = student.semesterRecords?.reduce((sum, sem) => sum + (sem.backlogs || 0), 0) || 0;
                if (totalHistoricalBacklogs > 0) {
                    reasons.push(`Department does not allow arrear history`);
                }
            }
        }
    }

    return {
        eligible: reasons.length === 0,
        reasons
    };
};

