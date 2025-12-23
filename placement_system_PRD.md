Product Requirements Document (PRD): Placement Management System
1. Project Overview
Name: Campus Placement Management System (PMS) Goal: A robust, role-based platform to manage the lifecycle of college placements. It bridges students, department moderators, and central administration to ensure data integrity and efficient job matching. Core Philosophy: "Verified Trust" — Students input data, Moderators verify it against proofs, Admins act on verified data.

2. Technical Stack
Frontend: React.js / Next.js (Tailwind CSS for UI)

Backend: Node.js (Express) or Python (FastAPI/Django)

Database: PostgreSQL (Relational Data Logic)

File Storage: AWS S3 (Resumes, Photos, Certificates)

PDF Generation: Puppeteer / PDFKit

Authentication: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)

3. Database Schema (The Logic Layer)
Copilot Prompt: "Generate Prisma schema or SQL CREATE TABLE statements based on these specifications."

A. Users & Authentication
users: id (UUID), email, password_hash, role (ENUM: STUDENT, MODERATOR, ADMIN, SUPER_ADMIN), is_active, created_at.

B. Student Module
student_profiles: user_id (FK), first_name, last_name, reg_no, phone, current_cgpa, department_id (FK), resume_s3_url, photo_s3_url, verification_status (ENUM: PENDING, VERIFIED, REJECTED).

academic_records: student_id, semester (1-8), gpa, backlogs, marksheet_s3_url.

projects: student_id, title, description, tech_stack.

C. Administration Module
departments: id, name (e.g., "Computer Science"), code (e.g., "CSE").

moderator_assignments: user_id (Mod), department_id.

D. Placement Module
jobs: id, title, company_name, description, min_cgpa, allowed_dept_ids (Array), status (OPEN/CLOSED).

applications: job_id, student_id, applied_at, status (APPLIED, SHORTLISTED, REJECTED, PLACED).

4. Application Logic & User Flows
Flow 1: The "Robust" Verification Cycle
Trigger: Student updates current_cgpa or uploads a new marksheet.

System Action:

Update student_profiles.verification_status to 'PENDING'.

Add student to the VerificationQueue for their specific Department Moderator.

Moderator Action: View "Split Screen" (Data vs. S3 Image). Click Approve or Reject.

Constraint: Students with status 'PENDING' or 'REJECTED' cannot apply for jobs.

Flow 2: Dynamic Resume Generation
Trigger: Student clicks "Generate Resume".

Logic:

Backend fetches verified data from student_profiles, academic_records, and projects.

Injects data into an HTML template (e.g., templates/resume_v1.html).

Puppeteer renders HTML to PDF buffer.

Buffer is uploaded to S3 (s3://.../resumes/{id}_{timestamp}.pdf).

S3 URL is saved to DB and returned to Frontend.

Flow 3: Secure S3 Uploads (Presigned URLs)
Frontend: Requests upload URL for a file (e.g., profile.jpg).

Backend:

Validates session.

Generates AWS S3 Presigned PUT URL (valid for 5 mins).

Frontend: Uploads file directly to S3 using the URL.

Frontend: Sends the S3 Key (file path) to Backend to save in DB.

5. UI/UX Design Specifications
A. Moderator Dashboard ("The Command Center")
Layout: Sidebar Navigation + Main Content Area.

Key View: "Verification Queue" Table.

Columns: Name, Reg No, Type (Resume/Marks), Date.

Action: Clicking a row opens the Split-View Modal.

Split-View Modal:

Left: Form inputs (Editable by Mod if minor correction needed).

Right: PDF/Image Viewer (Source: S3 URL).

B. Student Dashboard
Profile Card: Shows Photo, Name, and huge "Verification Status" badge (Green/Yellow/Red).

Resume Builder: "Add Block" interface (Add Project, Add Skill).

Job Feed: List of cards.

Logic: Only show jobs where student.cgpa >= job.min_cgpa AND student.dept IN job.allowed_depts.

C. Admin Dashboard
Job Creator: Multi-step form.

Step 1: Company Details.

Step 2: Eligibility Criteria (Dynamic Filters).

Analytics Widget: Bar chart "Placements by Dept".

6. API Endpoints Structure (REST)
Auth
POST /api/auth/login

POST /api/auth/register (Student only)

Student
GET /api/student/profile

PUT /api/student/profile (Triggers pending status)

POST /api/student/upload-url (S3 Presigned)

POST /api/student/resume/generate

GET /api/student/jobs (Filtered)

Moderator
GET /api/mod/queue (Pending verifications)

POST /api/mod/verify/{studentId} (Approve/Reject)

Admin
POST /api/admin/jobs

GET /api/admin/analytics

7. Next Steps for Development (Prompting Copilot)
To get started, you can open your IDE and type these comments to trigger Copilot:

For Database: "// Create a PostgreSQL schema for a placement system with users, students, and job posts."

For S3: "// Write a Node.js function to generate an AWS S3 presigned PUT url for file uploads."

For Resume: "// Create a function using Puppeteer to take a JSON object of student data and render it into a PDF."