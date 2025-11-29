"""
Check current database status
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "placement_db"

async def check_database():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("📊 Current Database Status:\n")
    
    collections = ['colleges', 'users', 'user_passwords', 'jobs']
    
    for collection in collections:
        count = await db[collection].count_documents({})
        print(f"  {collection}: {count} documents")
        
        if count > 0 and collection == 'colleges':
            colleges = await db[collection].find({}, {"_id": 0, "name": 1, "code": 1}).to_list(100)
            for college in colleges:
                print(f"    - {college.get('name')} ({college.get('code')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_database())
