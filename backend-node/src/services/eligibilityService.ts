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

    // 4. CGPA
    if (criteria.cgpa && (student.cgpa || 0) < criteria.cgpa) {
        reasons.push(`CGPA ${student.cgpa} is less than required ${criteria.cgpa}`);
    }

    // 5. Arrears
    if (!criteria.allowArrears && (student.currentBacklogs > 0)) {
        reasons.push(`Current backlogs ${student.currentBacklogs} not allowed`);
    }

    // 6. Department
    const studentDept = student.education.graduation?.branch || '';
    if (criteria.deptList && criteria.deptList.length > 0 && !criteria.deptList.includes(studentDept)) {
        reasons.push(`Department ${studentDept} is not eligible`);
    }

    // 7. Custom Department Rules
    if (criteria.customDeptRules && criteria.customDeptRules.length > 0) {
        const deptRule = criteria.customDeptRules.find(r => r.department === studentDept);
        if (deptRule) {
            if (deptRule.minCGPA && (student.cgpa || 0) < deptRule.minCGPA) {
                reasons.push(`Department CGPA ${student.cgpa} < ${deptRule.minCGPA}`);
            }
            if (deptRule.minTenthPct && (student.education.tenth?.percentage || 0) < deptRule.minTenthPct) {
                reasons.push(`Department 10th % ${student.education.tenth?.percentage} < ${deptRule.minTenthPct}`);
            }
            if (deptRule.minTwelfthPct && (student.education.twelfth?.percentage || 0) < deptRule.minTwelfthPct) {
                reasons.push(`Department 12th % ${student.education.twelfth?.percentage} < ${deptRule.minTwelfthPct}`);
            }
            if (deptRule.allowArrears === false && student.currentBacklogs > 0) {
                reasons.push(`Department does not allow arrears`);
            }
        }
    }

    return {
        eligible: reasons.length === 0,
        reasons
    };
};
