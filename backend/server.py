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
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

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
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
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

# User Models (for Students, Admins, Moderators)
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

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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
    collegeId: str  # Link to college
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
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    createdBy: str  # User ID of creator
    status: str = "active"  # active, closed, draft

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

# Moderator Models
class Moderator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    fullName: str
    department: str = ""
    role: str = "moderator"  # moderator, admin
    isActive: bool = True
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModeratorCreate(BaseModel):
    username: str
    email: str
    fullName: str
    department: str
    password: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Job Posting Routes
@api_router.post("/jobs", response_model=JobPosting)
async def create_job_posting(job: JobPostingCreate):
    job_dict = job.model_dump()
    job_obj = JobPosting(**job_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = job_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['skills'] = dict(doc['skills'])
    
    await db.jobs.insert_one(doc)
    return job_obj

@api_router.get("/jobs", response_model=List[JobPosting])
async def get_job_postings(status: str = None):
    query = {} if status is None else {"status": status}
    jobs = await db.jobs.find(query, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for job in jobs:
        if isinstance(job['createdAt'], str):
            job['createdAt'] = datetime.fromisoformat(job['createdAt'])
    
    return jobs

@api_router.get("/jobs/{job_id}", response_model=JobPosting)
async def get_job_posting(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    
    if isinstance(job['createdAt'], str):
        job['createdAt'] = datetime.fromisoformat(job['createdAt'])
    
    return job

@api_router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, status: str):
    result = await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job status updated"}

@api_router.delete("/jobs/{job_id}")
async def delete_job_posting(job_id: str):
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "message": "Job deleted"}

# Moderator Routes
@api_router.post("/moderators", response_model=Moderator)
async def create_moderator(moderator: ModeratorCreate):
    # Check if username already exists
    existing = await db.moderators.find_one({"username": moderator.username})
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await db.moderators.find_one({"email": moderator.email})
    if existing_email:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email already exists")
    
    moderator_dict = moderator.model_dump()
    password = moderator_dict.pop("password")  # Remove password from stored data
    
    # In production, hash the password before storing
    # For now, we'll store it separately in a passwords collection
    moderator_obj = Moderator(**moderator_dict)
    
    doc = moderator_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.moderators.insert_one(doc)
    # Store password separately (in production, use proper hashing)
    await db.moderator_passwords.insert_one({"moderator_id": doc['id'], "password": password})
    
    return moderator_obj

@api_router.get("/moderators", response_model=List[Moderator])
async def get_moderators(active_only: bool = None):
    query = {}
    if active_only is not None:
        query["isActive"] = active_only
    
    moderators = await db.moderators.find(query, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    
    for mod in moderators:
        if isinstance(mod['createdAt'], str):
            mod['createdAt'] = datetime.fromisoformat(mod['createdAt'])
    
    return moderators

@api_router.get("/moderators/{moderator_id}", response_model=Moderator)
async def get_moderator(moderator_id: str):
    moderator = await db.moderators.find_one({"id": moderator_id}, {"_id": 0})
    if not moderator:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    if isinstance(moderator['createdAt'], str):
        moderator['createdAt'] = datetime.fromisoformat(moderator['createdAt'])
    
    return moderator

@api_router.put("/moderators/{moderator_id}/status")
async def update_moderator_status(moderator_id: str, isActive: bool):
    result = await db.moderators.update_one(
        {"id": moderator_id},
        {"$set": {"isActive": isActive}}
    )
    if result.modified_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Moderator not found")
    return {"success": True, "message": "Moderator status updated"}

@api_router.delete("/moderators/{moderator_id}")
async def delete_moderator(moderator_id: str):
    result = await db.moderators.delete_one({"id": moderator_id})
    await db.moderator_passwords.delete_one({"moderator_id": moderator_id})
    
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Moderator not found")
    return {"success": True, "message": "Moderator deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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