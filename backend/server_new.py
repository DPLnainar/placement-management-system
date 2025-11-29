from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from jwt.exceptions import DecodeError, ExpiredSignatureError
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-12345')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'placement_db')]

# Create the main app
app = FastAPI(title="Multi-College Placement Portal")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        college_id: str = payload.get("college_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"user_id": user_id, "role": role, "college_id": college_id}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except DecodeError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# Define Models
# College Model
class College(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str  # Unique college code
    location: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CollegeCreate(BaseModel):
    name: str
    code: str
    location: str

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    fullName: str
    role: str  # student, moderator, admin
    collegeId: str
    department: str = ""
    isActive: bool = True
    isApproved: bool = False  # New field for approval system
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    fullName: str
    password: str
    role: str
    collegeId: str
    department: str = ""

class UserLogin(BaseModel):
    username: str
    password: str
    collegeId: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    username: str
    collegeId: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    collegeId: str
    resetToken: str
    newPassword: str

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Job Models
class JobSkills(BaseModel):
    wirelessCommunication: bool = False
    fullstackDeveloper: bool = False
    embedded: bool = False
    vlsi: bool = False
    cybersecurity: bool = False
    cloud: bool = False
    networking: bool = False
    blockchain: bool = False
    others: bool = False

class JobPosting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    collegeId: str
    companyName: str
    location: str
    jobCategory: str
    jobDescription: str
    termsConditions: str
    tenthPercentage: float
    twelfthPercentage: float
    cgpa: float
    skills: JobSkills
    otherSkill: str = ""
    deadline: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    createdBy: str
    status: str = "active"

class JobPostingCreate(BaseModel):
    companyName: str
    location: str
    jobCategory: str
    jobDescription: str
    termsConditions: str
    tenthPercentage: float
    twelfthPercentage: float
    cgpa: float
    skills: JobSkills
    otherSkill: str = ""
    deadline: datetime  # Made required

class JobPostingUpdate(BaseModel):
    companyName: Optional[str] = None
    location: Optional[str] = None
    jobCategory: Optional[str] = None
    jobDescription: Optional[str] = None
    termsConditions: Optional[str] = None
    tenthPercentage: Optional[float] = None
    twelfthPercentage: Optional[float] = None
    cgpa: Optional[float] = None
    skills: Optional[JobSkills] = None
    otherSkill: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

# Application Model
class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    jobId: str
    studentId: str
    studentName: str
    studentEmail: str
    collegeId: str
    appliedAt: datetime
    status: str = "pending"  # pending, accepted, rejected

class ApplicationCreate(BaseModel):
    jobId: str


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Multi-College Placement Portal API"}

# College Routes
@api_router.post("/colleges", response_model=College)
async def create_college(college: CollegeCreate):
    existing = await db.colleges.find_one({"code": college.code})
    if existing:
        raise HTTPException(status_code=400, detail="College code already exists")
    
    college_obj = College(**college.model_dump())
    doc = college_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.colleges.insert_one(doc)
    return college_obj

@api_router.get("/colleges", response_model=List[College])
async def get_colleges():
    colleges = await db.colleges.find({}, {"_id": 0}).to_list(1000)
    for college in colleges:
        if isinstance(college['createdAt'], str):
            college['createdAt'] = datetime.fromisoformat(college['createdAt'])
    return colleges

@api_router.get("/colleges/{college_id}", response_model=College)
async def get_college(college_id: str):
    college = await db.colleges.find_one({"id": college_id}, {"_id": 0})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    if isinstance(college['createdAt'], str):
        college['createdAt'] = datetime.fromisoformat(college['createdAt'])
    return college

@api_router.delete("/colleges/{college_id}")
async def delete_college(college_id: str):
    # Check if college has any users
    user_count = await db.users.count_documents({"collegeId": college_id})
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete college. It has {user_count} users associated with it.")
    
    # Check if college has any jobs
    job_count = await db.jobs.count_documents({"collegeId": college_id})
    if job_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete college. It has {job_count} jobs associated with it.")
    
    result = await db.colleges.delete_one({"id": college_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="College not found")
    
    return {"message": "College deleted successfully"}

# Authentication Routes
@api_router.post("/auth/register", response_model=User)
async def register_user(user: UserCreate):
    existing = await db.users.find_one({"username": user.username, "collegeId": user.collegeId})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists in this college")
    
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    college = await db.colleges.find_one({"id": user.collegeId})
    if not college:
        raise HTTPException(status_code=400, detail="College not found")
    
    user_dict = user.model_dump()
    password = user_dict.pop("password")
    hashed_password = hash_password(password)
    
    user_obj = User(**user_dict)
    
    # Admins are auto-approved, others need approval
    if user_obj.role == 'admin':
        user_obj.isApproved = True
    else:
        user_obj.isApproved = False
    
    doc = user_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.users.insert_one(doc)
    await db.user_passwords.insert_one({"user_id": doc['id'], "password": hashed_password})
    
    return user_obj

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_user(login: UserLogin):
    user = await db.users.find_one({"username": login.username, "collegeId": login.collegeId})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('isActive', True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Check if user is approved (admins are auto-approved)
    if not user.get('isApproved', False) and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Account pending approval. Please contact your admin.")
    
    password_doc = await db.user_passwords.find_one({"user_id": user['id']})
    if not password_doc or not verify_password(login.password, password_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user['id'], "role": user['role'], "college_id": user['collegeId']}
    )
    
    user_data = {
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "fullName": user['fullName'],
        "role": user['role'],
        "collegeId": user['collegeId'],
        "department": user.get('department', ''),
    }
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_data)

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Generate a password reset token and return it (in production, send via email)"""
    user = await db.users.find_one({
        "email": request.email, 
        "username": request.username,
        "collegeId": request.collegeId
    })
    if not user:
        # For security, don't reveal if email/username exists or not
        return {"message": "If the credentials are correct, a password reset token has been generated"}
    
    # Generate a reset token (valid for 1 hour)
    reset_token = create_access_token(
        data={"sub": user['id'], "type": "password_reset"},
        expires_delta=timedelta(hours=1)
    )
    
    # Store the reset token in the database
    await db.user_passwords.update_one(
        {"user_id": user['id']},
        {"$set": {"reset_token": reset_token, "reset_token_created": datetime.now(timezone.utc).isoformat()}}
    )
    
    # In production, send this token via email
    # For now, return it in the response (NOT SECURE - only for demo)
    return {
        "message": "Password reset token generated",
        "reset_token": reset_token,
        "email": request.email,
        "note": "In production, this token would be sent to your email"
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using the reset token"""
    # Verify the token
    try:
        payload = jwt.decode(request.resetToken, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
    except ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except DecodeError:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Verify user exists and email matches
    user = await db.users.find_one({"id": user_id, "email": request.email, "collegeId": request.collegeId})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify the token matches what's stored
    password_doc = await db.user_passwords.find_one({"user_id": user_id})
    if not password_doc or password_doc.get("reset_token") != request.resetToken:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Hash the new password
    new_hashed_password = hash_password(request.newPassword)
    
    # Update password and remove reset token
    await db.user_passwords.update_one(
        {"user_id": user_id},
        {
            "$set": {"password": new_hashed_password},
            "$unset": {"reset_token": "", "reset_token_created": ""}
        }
    )
    
    return {"message": "Password successfully reset"}

@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Allow authenticated users to change their password"""
    user_id = current_user['user_id']
    
    # Get current password hash
    password_doc = await db.user_passwords.find_one({"user_id": user_id})
    if not password_doc:
        raise HTTPException(status_code=404, detail="User password not found")
    
    # Verify current password
    if not verify_password(request.currentPassword, password_doc['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash the new password
    new_hashed_password = hash_password(request.newPassword)
    
    # Update password
    await db.user_passwords.update_one(
        {"user_id": user_id},
        {"$set": {"password": new_hashed_password}}
    )
    
    return {"message": "Password successfully changed"}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['createdAt'], str):
        user['createdAt'] = datetime.fromisoformat(user['createdAt'])
    return user

# Job Routes (College-specific)
@api_router.post("/jobs", response_model=JobPosting)
async def create_job(job: JobPostingCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only admins and moderators can create jobs")
    
    job_dict = job.model_dump()
    job_dict['collegeId'] = current_user['college_id']
    job_dict['createdBy'] = current_user['user_id']
    
    job_obj = JobPosting(**job_dict)
    doc = job_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    if doc['deadline']:
        doc['deadline'] = doc['deadline'].isoformat()
    doc['skills'] = dict(doc['skills'])
    
    await db.jobs.insert_one(doc)
    return job_obj

@api_router.get("/jobs", response_model=List[JobPosting])
async def get_jobs(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    query = {"collegeId": current_user['college_id']}
    if status:
        query["status"] = status
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    current_time = datetime.now(timezone.utc)
    
    for job in jobs:
        if isinstance(job['createdAt'], str):
            job['createdAt'] = datetime.fromisoformat(job['createdAt'])
        
        # Check and update deadline status
        if job.get('deadline'):
            if isinstance(job['deadline'], str):
                job['deadline'] = datetime.fromisoformat(job['deadline'])
            
            # Auto-disable job if deadline has passed
            if job['deadline'] < current_time and job.get('status') == 'active':
                await db.jobs.update_one(
                    {"id": job['id']},
                    {"$set": {"status": "inactive"}}
                )
                job['status'] = 'inactive'
    
    return jobs

@api_router.get("/jobs/{job_id}", response_model=JobPosting)
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id, "collegeId": current_user['college_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if isinstance(job['createdAt'], str):
        job['createdAt'] = datetime.fromisoformat(job['createdAt'])
    
    if job.get('deadline'):
        if isinstance(job['deadline'], str):
            job['deadline'] = datetime.fromisoformat(job['deadline'])
        
        # Auto-disable job if deadline has passed
        current_time = datetime.now(timezone.utc)
        if job['deadline'] < current_time and job.get('status') == 'active':
            await db.jobs.update_one(
                {"id": job['id']},
                {"$set": {"status": "inactive"}}
            )
            job['status'] = 'inactive'
    
    return job

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only admins and moderators can delete jobs")
    
    result = await db.jobs.delete_one({"id": job_id, "collegeId": current_user['college_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted"}

@api_router.put("/jobs/{job_id}", response_model=JobPosting)
async def update_job(job_id: str, job_update: JobPostingUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only admins and moderators can update jobs")
    
    # Get existing job
    existing_job = await db.jobs.find_one({"id": job_id, "collegeId": current_user['college_id']})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Build update data
    update_data = {}
    for field, value in job_update.model_dump(exclude_unset=True).items():
        if value is not None:
            if field == 'deadline' and isinstance(value, datetime):
                update_data[field] = value.isoformat()
            elif field == 'skills':
                update_data[field] = dict(value)
            else:
                update_data[field] = value
    
    if update_data:
        await db.jobs.update_one(
            {"id": job_id, "collegeId": current_user['college_id']},
            {"$set": update_data}
        )
    
    # Get updated job
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not updated_job:
        raise HTTPException(status_code=404, detail="Job not found after update")
        
    if isinstance(updated_job.get('createdAt'), str):
        updated_job['createdAt'] = datetime.fromisoformat(updated_job['createdAt'])
    if updated_job.get('deadline') and isinstance(updated_job['deadline'], str):
        updated_job['deadline'] = datetime.fromisoformat(updated_job['deadline'])
    
    return updated_job

# Application Management
@api_router.post("/applications", response_model=Application)
async def create_application(application: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'student':
        raise HTTPException(status_code=403, detail="Only students can apply for jobs")
    
    # Get the job to check if it exists and is active
    job = await db.jobs.find_one({"id": application.jobId, "collegeId": current_user['college_id']})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if job is still active and not expired
    if job.get('status') != 'active':
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications")
    
    if job.get('deadline'):
        deadline = job['deadline']
        if isinstance(deadline, str):
            deadline = datetime.fromisoformat(deadline)
        if deadline < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Application deadline has passed")
    
    # Check if student already applied
    existing_application = await db.applications.find_one({
        "jobId": application.jobId,
        "studentId": current_user['user_id']
    })
    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
    
    # Get student details
    student = await db.users.find_one({"id": current_user['user_id']})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create application
    app_obj = {
        "id": str(uuid.uuid4()),
        "jobId": application.jobId,
        "studentId": current_user['user_id'],
        "studentName": student.get('fullName', ''),
        "studentEmail": student.get('email', ''),
        "collegeId": current_user['college_id'],
        "appliedAt": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    
    await db.applications.insert_one(app_obj)
    
    app_obj['appliedAt'] = datetime.fromisoformat(app_obj['appliedAt'])
    return app_obj

@api_router.get("/applications", response_model=List[Application])
async def get_applications(current_user: dict = Depends(get_current_user), jobId: Optional[str] = None):
    query = {"collegeId": current_user['college_id']}
    
    if current_user['role'] == 'student':
        # Students can only see their own applications
        query["studentId"] = current_user['user_id']
    elif current_user['role'] in ['admin', 'moderator']:
        # Admins and moderators can see all applications
        if jobId:
            query["jobId"] = jobId
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    applications = await db.applications.find(query, {"_id": 0}).sort("appliedAt", -1).to_list(1000)
    
    for app in applications:
        if isinstance(app.get('appliedAt'), str):
            app['appliedAt'] = datetime.fromisoformat(app['appliedAt'])
    
    return applications

@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id, "collegeId": current_user['college_id']}, {"_id": 0})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Students can only view their own applications
    if current_user['role'] == 'student' and application['studentId'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if isinstance(application.get('appliedAt'), str):
        application['appliedAt'] = datetime.fromisoformat(application['appliedAt'])
    
    return application

@api_router.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'moderator']:
        raise HTTPException(status_code=403, detail="Only admins and moderators can update application status")
    
    if status not in ['pending', 'accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.applications.update_one(
        {"id": application_id, "collegeId": current_user['college_id']},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"success": True, "message": f"Application status updated to {status}"}

# User Management (Admin only, college-specific)
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user), role: Optional[str] = None):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view users")
    
    query = {"collegeId": current_user['college_id']}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for user in users:
        if isinstance(user['createdAt'], str):
            user['createdAt'] = datetime.fromisoformat(user['createdAt'])
    return users

@api_router.put("/users/{user_id}/approve")
async def approve_user(user_id: str, isApproved: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can approve users")
    
    result = await db.users.update_one(
        {"id": user_id, "collegeId": current_user['college_id']},
        {"$set": {"isApproved": isApproved}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User approval status updated"}

@api_router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, isActive: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update user status")
    
    result = await db.users.update_one(
        {"id": user_id, "collegeId": current_user['college_id']},
        {"$set": {"isActive": isActive}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User status updated"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    result = await db.users.delete_one({"id": user_id, "collegeId": current_user['college_id']})
    await db.user_passwords.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
