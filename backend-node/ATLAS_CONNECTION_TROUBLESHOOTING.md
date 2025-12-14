# MongoDB Atlas Connection Issue - Troubleshooting Guide

## Problem
The backend cannot connect to MongoDB Atlas. Connection attempts are **timing out**, which indicates a **network access restriction**.

## Root Cause
Your IP address is not whitelisted in MongoDB Atlas Network Access settings.

## Solution: Whitelist Your IP in Atlas

### Step 1: Log into MongoDB Atlas
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign in with your credentials
3. Select your project

### Step 2: Configure Network Access
1. Click on **"Network Access"** in the left sidebar (under Security)
2. Click **"Add IP Address"** button
3. Choose one of these options:

   **Option A: Allow Access from Anywhere (Recommended for Testing)**
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0` to the whitelist
   - ✅ Best for development/testing
   - ⚠️ Not recommended for production

   **Option B: Add Your Current IP**
   - Click "Add Current IP Address"
   - Atlas will detect and add your current IP
   - ✅ More secure
   - ⚠️ May need to update if your IP changes

4. Click **"Confirm"**
5. Wait 1-2 minutes for changes to propagate

### Step 3: Verify Database User
1. Click on **"Database Access"** in the left sidebar
2. Verify your database user exists
3. Check that the username and password match your `.env` file
4. Ensure the user has **"Read and write to any database"** privileges

### Step 4: Check Connection String
Your connection string format should be:
```
mongodb+srv://username:password@cluster-url/database?retryWrites=true&w=majority
```

**Important**: If your password contains special characters, they must be URL-encoded:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`

### Step 5: Test Connection
After whitelisting your IP, restart the backend:
```bash
# Stop the current backend (Ctrl+C)
# Then run:
.\start-backend.bat
```

## Alternative: Use Local MongoDB (Currently Working)
If you want to use the app immediately, you can switch back to local MongoDB:

```bash
cd backend-node
node switch-to-local-mongodb.js
```

Then restart the backend server.

## Current Status
- ✅ Local MongoDB is installed and running
- ❌ MongoDB Atlas connection is timing out (IP not whitelisted)
- ✅ Frontend is running on port 3000
- ⏸️ Backend needs Atlas IP whitelisting OR switch to local MongoDB

## Quick Test Command
After configuring Atlas, test the connection:
```bash
cd backend-node
node test-atlas-direct.js
```

This will show if the connection succeeds or provide specific error details.
