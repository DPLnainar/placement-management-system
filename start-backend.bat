@echo off
echo Starting Backend Server on Port 8000...
cd backend-node
set PORT=8000
call npm run dev
pause
