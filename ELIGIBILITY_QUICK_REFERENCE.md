# Quick Reference: Department-wise Eligibility Criteria

## Feature At a Glance

**What:** Two-mode eligibility system for job postings
- Mode 1: Common (same criteria for all)
- Mode 2: Department-wise (different criteria per department)

**Where:** Admin/Moderator → Add New Job form → Eligibility Section

**When:** Use when creating a new job

---

## Quick Start: Common Mode

1. In Add Job form, under "Eligibility Criteria" section
2. **CHECK** "Same criteria for all departments"
3. Enter values:
   - 10th%: `80`
   - 12th%: `85`
   - CGPA: `7.5`
4. Submit job

---

## Quick Start: Department-wise Mode

1. In Add Job form, under "Eligibility Criteria" section
2. **UNCHECK** "Same criteria for all departments"
3. Fill in each department:
   - **CSE**: 10th% `85`, 12th% `88`, CGPA `8.0`
   - **IT**: 10th% `83`, 12th% `86`, CGPA `7.8`
   - **ECE**: 10th% `80`, 12th% `82`, CGPA `7.5`
   - (etc. for other departments)
4. Submit job

---

## Valid Value Ranges

| Field | Min | Max | Unit |
|-------|-----|-----|------|
| 10th% | 0 | 100 | Percentage |
| 12th% | 0 | 100 | Percentage |
| CGPA | 0 | 10 | On 10-point scale |

---

## API Endpoint

**POST** `/api/jobs`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

### Common Mode Request
```json
{
  "title": "Software Engineer",
  "company": "Google",
  "description": "...",
  "location": "Bangalore",
  "deadline": "2025-12-31",
  "packageDetails": { "ctc": 15.5 },
  "eligibilityType": "common",
  "commonEligibility": {
    "tenth": 80,
    "twelfth": 85,
    "cgpa": 7.5
  }
}
```

### Department-wise Mode Request
```json
{
  "title": "Data Scientist",
  "company": "Microsoft",
  "description": "...",
  "location": "Hyderabad",
  "deadline": "2025-12-31",
  "packageDetails": { "ctc": 20 },
  "eligibilityType": "department-wise",
  "departmentWiseEligibility": [
    { "department": "CSE", "tenth": 85, "twelfth": 88, "cgpa": 8.0 },
    { "department": "IT", "tenth": 83, "twelfth": 86, "cgpa": 7.8 },
    { "department": "ECE", "tenth": 80, "twelfth": 82, "cgpa": 7.5 },
    { "department": "EEE", "tenth": 75, "twelfth": 80, "cgpa": 7.0 },
    { "department": "MECH", "tenth": 70, "twelfth": 75, "cgpa": 6.8 },
    { "department": "CIVIL", "tenth": 70, "twelfth": 75, "cgpa": 6.8 }
  ]
}
```

---

## Department Codes

| Code | Name |
|------|------|
| CSE | Computer Science Engineering |
| IT | Information Technology |
| ECE | Electronics & Communication |
| EEE | Electrical Engineering |
| MECH | Mechanical Engineering |
| CIVIL | Civil Engineering |
| ISE | Information Science |
| AI_ML | AI & Machine Learning |
| AIDS | AI in Data Science |
| DS | Data Science |
| MBA | Master of Business Admin |
| MCA | Master of Computer Apps |

---

## Common Errors & Solutions

### Error: "eligibilityType must be one of: common, department-wise"
**Solution:** Use correct enum value: either `"common"` or `"department-wise"`

### Error: "tenth percentage must be between 0-100"
**Solution:** Enter value between 0-100. Check for typos like `150` or negative values.

### Error: "CGPA must be between 0-10"
**Solution:** CGPA should be 0-10 on 10-point scale, not 100-point.

### Error: "At least one department criteria must be provided"
**Solution:** In department-wise mode, must fill at least one department (typically all 6).

### Error: "Department name is required for criteria"
**Solution:** Each department entry must include `department` field with valid code.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `backend-node/models/Job.js` | Database schema |
| `backend-node/middleware/validation.js` | Input validation |
| `backend-node/controllers/jobController.js` | Business logic |
| `frontend/src/components/AddJob.jsx` | UI form |

---

## Testing

### Test Common Mode
1. Post job with eligibilityType="common"
2. Verify response includes commonEligibility
3. Check MongoDB for saved structure

### Test Department-wise Mode
1. Post job with eligibilityType="department-wise"
2. Verify all departments saved correctly
3. Validate specific error messages per department

### Test Validation
1. Try posting with CGPA=15 (should fail)
2. Try posting with tenth=150 (should fail)
3. Try posting department-wise with empty array (should fail)

---

## Backward Compatibility

- ✅ Old jobs still work
- ✅ Legacy eligibility field preserved
- ✅ Default mode is "common"
- ✅ No migration needed

---

## Support

**Full Documentation:** `ELIGIBILITY_CRITERIA_IMPLEMENTATION.md`
**Complete Summary:** `ELIGIBILITY_IMPLEMENTATION_COMPLETE.md`

Questions? Check the documentation files for detailed examples and walkthroughs.

---

## Status

✅ **IMPLEMENTATION COMPLETE**
- Backend: Ready
- Frontend: Ready
- Database: Ready
- Servers: Running
- Tests: Passing

**Ready to use!**
