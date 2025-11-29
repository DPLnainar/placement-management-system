"""
Script to initialize the multi-college placement portal with sample data.
Run this after MongoDB is running and before starting the application.
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

# Database connection
MONGO_URL = "mongodb://localhost:27017/"
DB_NAME = "placement_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def initialize_data():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Clear existing data
        print("\nClearing existing data...")
        await db.colleges.delete_many({})
        await db.users.delete_many({})
        await db.user_passwords.delete_many({})
        await db.jobs.delete_many({})
        
        # Create sample colleges
        print("\nCreating sample colleges...")
        colleges = [
            {
                "id": str(uuid.uuid4()),
                "name": "MIT College of Engineering",
                "code": "MIT",
                "location": "Pune, Maharashtra",
                "createdAt": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "VIT University",
                "code": "VIT",
                "location": "Vellore, Tamil Nadu",
                "createdAt": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "BITS Pilani",
                "code": "BITS",
                "location": "Pilani, Rajasthan",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.colleges.insert_many(colleges)
        print(f"✓ Created {len(colleges)} colleges")
        
        # Create sample users for each college
        print("\nCreating sample users...")
        
        for college in colleges:
            college_id = college['id']
            college_code = college['code']
            
            # Admin
            admin_id = str(uuid.uuid4())
            admin = {
                "id": admin_id,
                "username": f"admin{college_code.lower()}",
                "email": f"admin@{college_code.lower()}.edu",
                "fullName": f"{college_code} Admin",
                "role": "admin",
                "collegeId": college_id,
                "department": "Administration",
                "isActive": True,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(admin)
            await db.user_passwords.insert_one({
                "user_id": admin_id,
                "password": pwd_context.hash("admin123")
            })
            
            # Moderator
            moderator_id = str(uuid.uuid4())
            moderator = {
                "id": moderator_id,
                "username": f"mod{college_code.lower()}",
                "email": f"moderator@{college_code.lower()}.edu",
                "fullName": f"{college_code} Moderator",
                "role": "moderator",
                "collegeId": college_id,
                "department": "Computer Science",
                "isActive": True,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(moderator)
            await db.user_passwords.insert_one({
                "user_id": moderator_id,
                "password": pwd_context.hash("mod123")
            })
            
            # Students
            for i in range(1, 4):
                student_id = str(uuid.uuid4())
                student = {
                    "id": student_id,
                    "username": f"student{i}{college_code.lower()}",
                    "email": f"student{i}@{college_code.lower()}.edu",
                    "fullName": f"{college_code} Student {i}",
                    "role": "student",
                    "collegeId": college_id,
                    "department": ["Computer Science", "Electronics", "Mechanical"][i-1],
                    "isActive": True,
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(student)
                await db.user_passwords.insert_one({
                    "user_id": student_id,
                    "password": pwd_context.hash("student123")
                })
            
            print(f"✓ Created users for {college['name']}")
        
        # Create sample jobs
        print("\nCreating sample jobs...")
        for college in colleges[:2]:  # Only first 2 colleges get jobs
            # Get admin for this college
            admin_user = await db.users.find_one({"collegeId": college['id'], "role": "admin"})
            
            job = {
                "id": str(uuid.uuid4()),
                "collegeId": college['id'],
                "companyName": f"Tech Corp for {college['code']}",
                "location": "Bangalore, Karnataka",
                "jobCategory": "Software Development",
                "jobDescription": "Looking for talented software developers to join our team",
                "termsConditions": "Full-time position. Relocation provided.",
                "tenthPercentage": 75.0,
                "twelfthPercentage": 75.0,
                "cgpa": 7.0,
                "skills": {
                    "fullstackDeveloper": True,
                    "cloud": True,
                    "wirelessCommunication": False,
                    "embedded": False,
                    "vlsi": False,
                    "cybersecurity": False,
                    "networking": False,
                    "blockchain": False,
                    "others": False
                },
                "otherSkill": "",
                "createdBy": admin_user['id'] if admin_user else "",
                "status": "active",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await db.jobs.insert_one(job)
        
        print(f"✓ Created sample jobs")
        
        print("\n" + "="*60)
        print("Sample Data Created Successfully!")
        print("="*60)
        print("\nLogin Credentials:")
        print("\nFor each college (MIT, VIT, BITS):")
        print("  Admin:")
        print("    Username: admin<code> (e.g., adminmit)")
        print("    Password: admin123")
        print("\n  Moderator:")
        print("    Username: mod<code> (e.g., modmit)")
        print("    Password: mod123")
        print("\n  Students:")
        print("    Username: student1<code>, student2<code>, student3<code>")
        print("    Password: student123")
        print("\nExample:")
        print("  MIT Admin: username=adminmit, password=admin123")
        print("  VIT Moderator: username=modvit, password=mod123")
        print("  BITS Student: username=student1bits, password=student123")
        print("="*60)
        
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    print("Multi-College Placement Portal - Data Initialization")
    print("=" * 60)
    asyncio.run(initialize_data())
