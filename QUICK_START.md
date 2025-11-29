# Quick Start Guide - Multi-College Placement Portal

## Prerequisites Check
✅ MongoDB installed and running  
✅ Python 3.10+ installed  
✅ Node.js 16+ installed  

## Step-by-Step Setup (5 minutes)

### 1. Start MongoDB
```powershell
# Check if MongoDB is running
net start MongoDB

# If not started, install MongoDB from:
# https://www.mongodb.com/try/download/community
```

### 2. Backend Setup (Terminal 1)
```powershell
cd placement-main\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Initialize sample data (creates 3 colleges with users)
python init_data.py

# Start backend server on NEW server file
uvicorn server_new:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup (Terminal 2)
```powershell
cd placement-main\frontend

# Install dependencies (if not already installed)
npm install --legacy-peer-deps

# Start frontend
npm start
```

### 4. Access Application
Open browser: `http://localhost:3000`

## Test Login Credentials

### MIT College
**Select College**: MIT College of Engineering - Pune, Maharashtra

| Role | Username | Password |
|------|----------|----------|
| Admin | adminmit | admin123 |
| Moderator | modmit | mod123 |
| Student | student1mit | student123 |

### VIT University
**Select College**: VIT University - Vellore, Tamil Nadu

| Role | Username | Password |
|------|----------|----------|
| Admin | adminvit | admin123 |
| Moderator | modvit | mod123 |
| Student | student1vit | student123 |

### BITS Pilani
**Select College**: BITS Pilani - Pilani, Rajasthan

| Role | Username | Password |
|------|----------|----------|
| Admin | adminbits | admin123 |
| Moderator | modbits | mod123 |
| Student | student1bits | student123 |

## Quick Test Flow

### 1. Test as Admin (adminmit)
1. Login with MIT admin credentials
2. View dashboard with stats
3. Click "Jobs" tab - see MIT-specific jobs
4. Click "Create Job" - add a new job posting
5. Click "Moderators" tab - view/manage moderators
6. Click "Students" tab - view/manage students
7. Logout

### 2. Test as Moderator (modmit)
1. Login with MIT moderator credentials
2. View jobs dashboard
3. Create a new job posting
4. Delete a job
5. Logout

### 3. Test as Student (student1mit)
1. Login with MIT student credentials
2. View available job postings
3. Check job details and eligibility
4. Logout

### 4. Test College Isolation
1. Login as VIT admin (adminvit)
2. Notice: Only VIT jobs and users visible
3. Create a VIT-specific job
4. Logout and login as MIT admin
5. Verify: VIT jobs NOT visible to MIT admin ✓

## What's Different from Old System?

### Old System
- ❌ Single college only
- ❌ No authentication
- ❌ Local state management
- ❌ No user roles
- ❌ Frontend-only app

### New System
- ✅ Multiple colleges supported
- ✅ JWT authentication with bcrypt
- ✅ Full backend API with MongoDB
- ✅ Three user roles (Admin/Moderator/Student)
- ✅ College-specific data isolation
- ✅ Protected routes and API endpoints
- ✅ Professional UI with role-based dashboards

## Files to Use

### Backend
- **USE**: `server_new.py` (new multi-college backend)
- ~~Old~~: `server.py` (old single-college version)

### Frontend
- **UPDATE**: `src/index.js` - Change import to use `AppNew`
  ```javascript
  import App from './AppNew';  // Change this line
  ```
- **USE**: `src/AppNew.jsx` (new routing)
- ~~Old~~: `src/App.js` (old version)

## Troubleshooting

### Issue: "MongoDB connection refused"
**Solution**: Start MongoDB service
```powershell
net start MongoDB
```

### Issue: "Module not found: passlib"
**Solution**: Install Python dependencies
```powershell
pip install -r requirements.txt
```

### Issue: "Port 3000 already in use"
**Solution**: Kill the process or use different port
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Issue: Frontend shows old app
**Solution**: Update src/index.js to import AppNew

### Issue: "Invalid credentials" when logging in
**Solution**: 
1. Make sure you ran `python init_data.py`
2. Select correct college from dropdown
3. Use exact username (case-sensitive)

## Next Steps

1. ✅ Login and test each role
2. ✅ Create jobs in different colleges
3. ✅ Verify data isolation between colleges
4. ✅ Test user management features
5. ✅ Explore the comprehensive documentation in `MULTI_COLLEGE_README.md`

## Need Help?

Check the full documentation: `MULTI_COLLEGE_README.md`

---
**Note**: The new system uses `server_new.py` and `AppNew.jsx`. Make sure to update your imports!
