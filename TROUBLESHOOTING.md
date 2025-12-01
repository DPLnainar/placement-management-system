# 🔍 Application Status & Troubleshooting Guide

## ✅ Current Status (December 1, 2025 - 4:42 PM)

### Backend Server
- **Status**: ✅ RUNNING
- **Port**: 8000
- **Uptime**: 15 minutes 50 seconds
- **URL**: http://localhost:8000
- **Health**: No errors detected

### Frontend Server
- **Status**: ✅ RUNNING
- **Port**: 3000
- **Uptime**: 8 minutes 55 seconds
- **URL**: http://localhost:3000
- **Build**: Compiled successfully

---

## 🧪 Quick Test

### Test Backend API:
Open this URL in your browser:
```
http://localhost:8000/api/jobs
```
**Expected**: JSON response with jobs data or empty array `[]`

### Test Frontend:
Open this URL in your browser:
```
http://localhost:3000
```
**Expected**: Role selection page with Student/Moderator/Admin buttons

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Symptoms**: 
- Network errors in console
- ERR_CONNECTION_REFUSED

**Solution**:
```bash
# Check if backend is running
# Should see process on port 8000
netstat -ano | findstr :8000

# If not running, restart:
cd backend-node
npm start
```

### Issue 2: "Page not loading"
**Symptoms**:
- Blank page
- Loading forever

**Solution**:
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check console for errors (F12)

### Issue 3: "Login fails with 401"
**Symptoms**:
- Unauthorized error
- Invalid credentials

**Solution**:
1. Use correct credentials:
   - Student: `student1_tu` / `student123`
   - Admin: `admin_tu` / `admin123`
2. Make sure backend is running
3. Check MongoDB is connected

### Issue 4: "Rate limit exceeded (429)"
**Symptoms**:
- Too many requests error
- Login blocked

**Solution**:
- Wait 15 minutes OR
- Restart backend server (already increased to 50 attempts)

---

## 📋 Verification Checklist

Run through this checklist:

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] MongoDB service started
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:8000/api/jobs
- [ ] Browser console shows no errors
- [ ] Login page loads correctly

---

## 🔧 Manual Testing Steps

### Step 1: Test Backend
```bash
# In a new terminal or browser
curl http://localhost:8000/api/jobs
```
**Expected**: JSON response

### Step 2: Test Frontend
1. Open browser
2. Go to: http://localhost:3000
3. Should see role selection page

### Step 3: Test Login
1. Click "Student"
2. Enter: `student1_tu` / `student123`
3. Click "Sign In"
4. Should redirect to dashboard

---

## 🚨 If Nothing Works

### Nuclear Option - Full Restart:

1. **Stop all servers**:
   - Close all terminal windows
   - Or press Ctrl+C in each terminal

2. **Restart MongoDB**:
   ```bash
   net start MongoDB
   ```

3. **Start Backend**:
   ```bash
   cd backend-node
   npm start
   ```

4. **Start Frontend** (in new terminal):
   ```bash
   cd frontend
   npm start
   ```

5. **Clear browser cache**:
   - Press Ctrl + Shift + Delete
   - Clear all cached data
   - Close and reopen browser

---

## 📊 System Requirements Check

### Required Services:
- ✅ Node.js 16+ installed
- ✅ MongoDB running
- ✅ npm packages installed

### Check Node.js:
```bash
node --version
# Should show v16.x.x or higher
```

### Check MongoDB:
```bash
net start MongoDB
# Should show "service is already running" or start it
```

### Check npm packages:
```bash
# In backend-node folder
npm list --depth=0

# In frontend folder
npm list --depth=0
```

---

## 🎯 What Should Be Working

If everything is correct, you should be able to:

1. ✅ Access http://localhost:3000
2. ✅ See role selection page
3. ✅ Login with test credentials
4. ✅ View dashboard
5. ✅ See jobs (if any exist)
6. ✅ Use all features

---

## 📞 Debug Information

### Backend Logs Location:
Check the terminal where backend is running for any errors

### Frontend Logs Location:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red errors

### Common Error Messages:

**"ECONNREFUSED"**
→ Backend not running or wrong port

**"401 Unauthorized"**
→ Wrong credentials or not logged in

**"429 Too Many Requests"**
→ Rate limit hit, wait or restart

**"404 Not Found"**
→ Wrong URL or route doesn't exist

**"500 Internal Server Error"**
→ Backend error, check backend logs

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ No errors in backend terminal
2. ✅ No errors in frontend terminal
3. ✅ http://localhost:3000 loads
4. ✅ http://localhost:8000/api/jobs returns data
5. ✅ Login works
6. ✅ Dashboard displays

---

## 🎉 Current Status Summary

**Backend**: ✅ Running perfectly (15+ minutes)
**Frontend**: ✅ Running perfectly (8+ minutes)
**MongoDB**: ✅ Should be connected
**Application**: ✅ Ready to use

**Action**: Open http://localhost:3000 in your browser!

---

**Last Updated**: December 1, 2025, 4:42 PM
**Status**: OPERATIONAL ✅
