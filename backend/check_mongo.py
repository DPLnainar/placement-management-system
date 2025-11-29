#!/usr/bin/env python3
"""
Simple script to check if MongoDB is running and provide helpful messages
"""
import sys
try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError
    
    print("Checking MongoDB connection...")
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    client.server_info()
    print("✓ MongoDB is running and accessible!")
    client.close()
    sys.exit(0)
    
except ServerSelectionTimeoutError:
    print("\n❌ MongoDB is NOT running!")
    print("\nPlease start MongoDB:")
    print("  Windows: net start MongoDB")
    print("  Or install from: https://www.mongodb.com/try/download/community")
    sys.exit(1)
    
except ImportError:
    print("\n❌ pymongo not installed!")
    print("\nPlease install requirements:")
    print("  pip install -r requirements.txt")
    sys.exit(1)
