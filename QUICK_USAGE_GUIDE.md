# Professional Placement Portal - Quick Start Guide

## 🎯 What's New

Your placement portal now includes professional-grade features for complete placement cycle management:

### ✨ Key Enhancements

1. **Intelligent Job Matching** - Students see only jobs they're eligible for
2. **Multi-Stage Recruitment** - Track applications through aptitude, technical, HR rounds
3. **Placement Season Management** - Organize entire placement drives with policies
4. **Automated Notifications** - Email alerts for jobs, interviews, selections
5. **Comprehensive Analytics** - Real-time placement statistics and reports
6. **Advanced Student Profiles** - Skills, certifications, projects, internships

## 🚀 Getting Started

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend-node
npm start
# Server: http://localhost:8000

# Terminal 2 - Frontend  
cd frontend
npm start
# App: http://localhost:3000
```

### 2. Login with Test Credentials

**Admin Account:**
- Username: `admin_tu`
- Password: `admin123`
- College: Tech University

**Moderator Account:**
- Username: `mod_tu`
- Password: `mod123`

**Student Account:**
- Username: `student1_tu`
- Password: `student123`

## 📋 Admin Workflows

### Create a Placement Drive

1. **Using API:**
```bash
POST http://localhost:8000/api/placement-drives
Authorization: Bearer {your-token}

{
  "name": "Placement Season 2025-26",
  "academicYear": "2025-26",
  "startDate": "2025-08-01",
  "endDate": "2026-05-31",
  "driveType": "main_placement",
  "policies": {
    "oneOfferRule": { 
      "enabled": true,
      "description": "Students can accept only one offer"
    },
    "maxApplicationsPerStudent": 15,
    "postPlacementRules": {
      "canApplyAfterPlacement": true,
      "onlyHigherCTC": true,
      "minCTCDifference": 200000
    }
  },
  "targets": {
    "targetPlacementPercentage": 85,
    "totalStudentsEligible": 500
  },
  "description": "Main campus placement drive for batch 2026"
}
```

### Create Enhanced Job Posting

```bash
POST http://localhost:8000/api/jobs
Authorization: Bearer {admin-token}

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "Full stack developer role",
  "location": "Bangalore",
  "jobType": "full-time",
  "deadline": "2025-12-31",
  "jobCategory": "campus_placement",
  "companyTier": "dream",
  "eligibilityCriteria": {
    "minCGPA": 7.0,
    "minTenthPercentage": 75,
    "minTwelfthPercentage": 75,
    "maxBacklogsAllowed": 0,
    "maxCurrentBacklogs": 0,
    "eligibleBranches": ["Computer Science", "Information Technology"],
    "eligibleYears": [4],
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["MongoDB", "AWS"]
  },
  "interviewProcess": {
    "hasAptitudeRound": true,
    "hasTechnicalRound": true,
    "technicalRoundCount": 2,
    "hasHRRound": true,
    "totalRounds": 4
  },
  "packageDetails": {
    "ctc": 1200000,
    "baseSalary": 900000,
    "joiningBonus": 100000
  },
  "numberOfPositions": 10
}
```

### Check Eligible Students for Job

```bash
GET http://localhost:8000/api/eligibility/job/{jobId}/students
Authorization: Bearer {admin-token}

Response:
{
  "success": true,
  "data": {
    "students": [
      {
        "studentId": "...",
        "fullName": "John Doe",
        "rollNumber": "CS2021001",
        "cgpa": 8.5,
        "isEligible": true,
        "eligibilityIssues": [],
        "hasApplied": false
      }
    ],
    "summary": {
      "totalStudents": 150,
      "eligible": 120,
      "ineligible": 30,
      "applied": 45,
      "notApplied": 75
    }
  }
}
```

### View Drive Analytics

```bash
GET http://localhost:8000/api/placement-drives/{driveId}/dashboard
Authorization: Bearer {admin-token}

Response includes:
- Total jobs, applications, placements
- Company-wise statistics
- Branch-wise placement percentages
- CTC analytics (avg, highest, lowest)
- Recent placements
- Upcoming jobs
```

### Make Announcements

```bash
POST http://localhost:8000/api/placement-drives/{driveId}/announcements
Authorization: Bearer {admin-token}

{
  "title": "Important: Pre-Placement Talk",
  "message": "Google will conduct a PPT on Dec 15 at 2 PM in Auditorium",
  "priority": "high",
  "targetAudience": "all"
}
```

## 👨‍🎓 Student Workflows

### Check Eligibility for Job

```bash
GET http://localhost:8000/api/eligibility/job/{jobId}/check
Authorization: Bearer {student-token}

Response:
{
  "success": true,
  "data": {
    "isEligible": true,
    "eligibilityIssues": [],
    "alreadyApplied": false,
    "canApply": true
  }
}
```

### Get Eligible Jobs Only

```bash
GET http://localhost:8000/api/eligibility/jobs/eligible
Authorization: Bearer {student-token}

Returns only jobs the student qualifies for with eligibility details
```

### Get Job Recommendations

```bash
GET http://localhost:8000/api/eligibility/jobs/recommendations?limit=10
Authorization: Bearer {student-token}

Response includes:
- Jobs sorted by match score
- Eligibility status
- Match percentage
- Skill matching details
```

### Apply for Job

```bash
POST http://localhost:8000/api/applications
Authorization: Bearer {student-token}

{
  "jobId": "..."
}
```

## 👔 Moderator Workflows

### Shortlist Students

```bash
# Get eligible students first
GET /api/eligibility/job/{jobId}/students

# Update application status
PUT /api/applications/{applicationId}/status
{
  "status": "shortlisted",
  "reviewNotes": "Strong profile with good projects"
}
```

### Schedule Interview

```bash
PUT /api/applications/{applicationId}
{
  "status": "technical_scheduled",
  "rounds": [{
    "roundName": "Technical Round 1",
    "roundType": "technical",
    "scheduledDate": "2025-12-20T10:00:00Z",
    "notes": "Focus on DSA and system design"
  }]
}
```

## 📧 Email Notifications

### Configure Email (Optional)

Edit `backend-node/.env`:
```env
EMAIL_USER=your-college-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Automatic Email Triggers

Students receive emails for:
- ✉️ New job postings matching their profile
- ✉️ Application status changes
- ✉️ Interview schedules
- ✉️ Selection notifications
- ✉️ Placement drive announcements

## 📊 Analytics & Reports

### Drive Statistics API

```bash
# Update statistics
POST /api/placement-drives/{driveId}/update-stats

# View dashboard
GET /api/placement-drives/{driveId}/dashboard
```

### Available Metrics:
- Total placements and percentage
- Company-wise hiring stats
- Branch-wise placement rates
- CTC distribution (avg, high, low)
- Application-to-selection ratio

## 🎮 Testing New Features

### Test Sequence

1. **Create Placement Drive** (Admin)
   ```bash
   POST /api/placement-drives
   ```

2. **Create Jobs with Eligibility** (Admin)
   ```bash
   POST /api/jobs (with eligibilityCriteria)
   ```

3. **Check Eligible Students** (Admin)
   ```bash
   GET /api/eligibility/job/{jobId}/students
   ```

4. **Student Checks Eligibility** (Student)
   ```bash
   GET /api/eligibility/job/{jobId}/check
   ```

5. **Student Gets Recommendations** (Student)
   ```bash
   GET /api/eligibility/jobs/recommendations
   ```

6. **Student Applies** (Student)
   ```bash
   POST /api/applications
   ```

7. **Moderator Shortlists** (Moderator)
   ```bash
   PUT /api/applications/{id}/status
   ```

8. **View Analytics** (Admin)
   ```bash
   GET /api/placement-drives/{id}/dashboard
   ```

## 🔍 API Testing Tools

### Using Postman

1. Import collection from the API endpoints above
2. Set environment variable: `BASE_URL=http://localhost:8000`
3. Get JWT token from login:
   ```bash
   POST /api/auth/login
   { "username": "admin_tu", "password": "admin123" }
   ```
4. Add token to Authorization header: `Bearer {token}`

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_tu","password":"admin123"}'

# Get eligible jobs
curl -X GET http://localhost:8000/api/eligibility/jobs/eligible \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   taskkill /F /IM node.exe  # Windows
   npm start
   ```

2. **MongoDB Not Running**
   ```bash
   net start MongoDB  # Windows
   ```

3. **No Eligible Jobs**
   - Check student profile completion
   - Verify CGPA and percentages are filled
   - Check job eligibility criteria

4. **Email Not Sending**
   - Verify `.env` has EMAIL_USER and EMAIL_PASSWORD
   - Use Gmail app password, not regular password
   - Check EMAIL_SETUP.md for detailed instructions

## 📚 Next Steps

### Phase 2 (Frontend Development):
- Enhanced student dashboard with recommendations widget
- Job details page with eligibility indicator
- Application tracking timeline view
- Placement drive analytics dashboard
- Interview scheduling interface
- Document upload and verification UI

### Additional Features to Explore:
- Bulk operations for moderators
- Export reports to Excel/PDF
- SMS notifications integration
- Calendar sync for interviews
- Resume parsing automation
- Real-time WebSocket notifications

## 🎓 Best Practices

### For Admins:
1. Create placement drive before posting jobs
2. Set clear eligibility criteria for each job
3. Configure drive policies (one-offer rule, limits)
4. Regularly update drive statistics
5. Use announcements for important updates

### For Moderators:
1. Verify student profiles before drive starts
2. Shortlist based on eligibility checks
3. Schedule interviews promptly
4. Maintain notes in application reviews
5. Update application status timely

### For Students:
1. Complete profile 100% before applications
2. Check eligibility before applying
3. Use recommendation system for best matches
4. Track application status regularly
5. Respond to interview schedules promptly

---

## 📞 Support

For issues or questions:
- Check IMPLEMENTATION_SUMMARY.md for technical details
- Review API route files for endpoint documentation
- Check console logs for detailed error messages

**Happy Placement Season! 🎉**
