# Placement Management System - API Documentation

## Base URL
```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/login
Login with username/email and password.

**Request Body:**
```json
{
  "username": "admin_tu",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin_tu",
      "email": "admin@techuniv.edu",
      "fullName": "Admin User",
      "role": "admin",
      "status": "active",
      "department": null,
      "college": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Tech University",
        "code": "TU",
        "location": "Mumbai"
      }
    }
  }
}
```

### GET /auth/profile
Get current user's profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* same as login response */ }
  }
}
```

### PUT /auth/change-password
Change user's password (requires authentication).

**Request Body:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password/:token
Reset password using email token.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

---

## User Management Endpoints

### POST /users
Create a new user (Admin/Moderator only).

**Permissions:**
- Admin: Can create moderators and students
- Moderator: Can create students in their department only

**Request Body:**
```json
{
  "username": "student1",
  "email": "student1@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "student",
  "department": "Computer Science"
}
```

### GET /users
Get all users in your college.

**Query Parameters:**
- `role` (optional): Filter by role (admin/moderator/student)
- `department` (optional): Filter by department
- `status` (optional): Filter by status (active/inactive)

**Response:**
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "student1",
      "email": "student1@example.com",
      "fullName": "John Doe",
      "role": "student",
      "department": "Computer Science",
      "status": "active"
    }
  ]
}
```

### GET /users/:id
Get user by ID.

### PUT /users/:id
Update user details (Admin/Moderator only).

### PUT /users/:id/status
Activate/deactivate user (Admin only).

**Request Body:**
```json
{
  "status": "active"  // or "inactive"
}
```

### DELETE /users/:id
Delete user (Admin only).

---

## Job Management Endpoints

### POST /jobs
Create a new job posting (Admin/Moderator only).

**Request Body:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "Looking for skilled developers...",
  "location": "Mumbai",
  "jobType": "full-time",
  "salary": "800000",
  "deadline": "2025-12-31",
  "requirements": "B.Tech in CS, 7+ CGPA",
  "status": "active",
  "jobCategory": "campus_placement",
  "companyTier": "dream",
  "eligibilityCriteria": {
    "minCGPA": 7.0,
    "minTenthPercentage": 60,
    "minTwelfthPercentage": 60,
    "maxBacklogsAllowed": 0,
    "maxCurrentBacklogs": 0,
    "eligibleBranches": ["Computer Science", "IT"],
    "eligibleYears": [2025, 2026],
    "requiredSkills": ["JavaScript", "React"]
  },
  "packageDetails": {
    "ctc": 800000,
    "baseSalary": 700000,
    "joiningBonus": 50000
  }
}
```

### GET /jobs
Get all job postings in your college.

**Query Parameters:**
- `status` (optional): Filter by status
- `jobCategory` (optional): Filter by category
- `companyTier` (optional): Filter by tier

### GET /jobs/:id
Get job details by ID.

### PUT /jobs/:id
Update job posting.

### DELETE /jobs/:id
Delete job posting.

---

## Application Endpoints

### POST /applications
Submit job application (Student only).

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted and automatically approved - you are eligible!",
  "data": {
    "application": {
      "id": "507f1f77bcf86cd799439013",
      "jobId": "507f1f77bcf86cd799439011",
      "studentId": "507f1f77bcf86cd799439014",
      "status": "under_review",
      "isEligible": true,
      "eligibilityIssues": [],
      "appliedAt": "2025-11-30T10:00:00.000Z"
    }
  }
}
```

### GET /applications
Get applications.

**Permissions:**
- Student: See own applications only
- Admin/Moderator: See all applications in college

**Query Parameters:**
- `jobId` (optional): Filter by job

### PUT /applications/:id/status
Update application status (Admin/Moderator only).

**Query Parameters:**
- `status`: New status (under_review/shortlisted/selected/rejected)

---

## Eligibility Endpoints

### GET /eligibility/job/:jobId/check
Check student eligibility for a job (Student only).

**Response:**
```json
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

### GET /eligibility/jobs/eligible
Get all eligible jobs for current student.

**Query Parameters:**
- `category` (optional): Filter by job category
- `tier` (optional): Filter by company tier
- `includeApplied` (optional): Include already applied jobs

### GET /eligibility/jobs/recommendations
Get AI-powered job recommendations for student.

### GET /eligibility/job/:jobId/students
Get eligible students for a job (Admin/Moderator only).

### POST /eligibility/bulk-check
Bulk eligibility check for multiple students (Admin/Moderator only).

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "studentIds": ["id1", "id2", "id3"]
}
```

---

## Placement Drive Endpoints

### POST /placement-drives
Create new placement drive (Admin only).

**Request Body:**
```json
{
  "name": "2025 Campus Placements",
  "academicYear": "2024-2025",
  "startDate": "2025-01-01",
  "endDate": "2025-06-30",
  "driveType": "main_placement",
  "policies": {
    "oneOfferRule": true,
    "maxApplicationsPerStudent": 10,
    "globalCriteria": {
      "minCGPA": 6.0
    }
  }
}
```

### GET /placement-drives
Get all placement drives.

### GET /placement-drives/active
Get currently active drive.

### GET /placement-drives/:id/dashboard
Get drive dashboard with analytics (Admin/Moderator only).

### PUT /placement-drives/:id
Update drive configuration.

### POST /placement-drives/:id/update-stats
Recalculate drive statistics.

### POST /placement-drives/:id/announcements
Create announcement for drive.

### POST /placement-drives/:id/toggle-freeze
Freeze/unfreeze drive.

---

## Student Data Endpoints

### GET /students/:userId/profile
Get student profile data.

### PUT /students/:userId/profile
Update student profile.

**Request Body:**
```json
{
  "cgpa": 8.5,
  "tenthPercentage": 85,
  "twelfthPercentage": 88,
  "skills": {
    "programming": ["JavaScript", "Python", "Java"],
    "frameworks": ["React", "Node.js"],
    "databases": ["MongoDB", "MySQL"]
  },
  "projects": [{
    "title": "E-commerce Platform",
    "description": "Full-stack application",
    "technologies": ["React", "Node.js", "MongoDB"],
    "githubLink": "https://github.com/user/project"
  }]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate entry (e.g., username already exists)
- **500 Internal Server Error**: Server error

---

## Status Codes

### Application Status Flow
1. `under_review` - Auto-approved for eligible students
2. `shortlisted` - Selected for interview rounds
3. `aptitude_scheduled/cleared/rejected`
4. `technical_scheduled/cleared/rejected`
5. `hr_scheduled/cleared/rejected`
6. `selected` - Final selection
7. `offered` - Offer letter sent
8. `offer_accepted/rejected`
9. `joined` - Student joined company

### Job Status
- `draft` - Not published
- `active` - Open for applications
- `inactive` - Temporarily closed
- `closed` - Applications closed
- `cancelled` - Job cancelled

### User Status
- `active` - User can login
- `inactive` - User blocked

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 failed attempts per hour

---

## Best Practices

1. **Always validate input** on the client side before sending requests
2. **Handle errors gracefully** and display user-friendly messages
3. **Store JWT securely** (httpOnly cookies or secure localStorage)
4. **Refresh tokens** when they expire
5. **Use query parameters** for filtering/pagination
6. **Include proper headers** (Content-Type: application/json)
7. **Log out users** when receiving 401 Unauthorized responses

---

## Testing Credentials

### Tech University (TU)
- Admin: `admin_tu` / `admin123`
- Moderator: `mod_tu` / `mod123`
- Student: `student1_tu` / `student123`

### State Engineering College (SEC)
- Admin: `admin_sec` / `admin123`
- Moderator: `mod_sec` / `mod123`
- Student: `student1_sec` / `student123`
