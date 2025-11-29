"""
Clear all data from the placement database
Run this to start fresh with your own data
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "placement_db"

async def clear_all_data():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🗑️  Clearing all data from the database...")
    
    # Clear all collections
    collections = ['colleges', 'users', 'user_passwords', 'jobs']
    
    for collection in collections:
        count = await db[collection].count_documents({})
        if count > 0:
            result = await db[collection].delete_many({})
            print(f"✅ Deleted {result.deleted_count} documents from '{collection}' collection")
        else:
            print(f"ℹ️  '{collection}' collection is already empty")
    
    print("\n✨ Database cleared! You can now add your own data via the /setup page")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_data())
