# Placement Portal

A full-stack placement management system built with React (frontend) and FastAPI (backend).

## Prerequisites

- **Node.js** (v14 or higher)
- **Python** (3.8 or higher)
- **MongoDB** (running on localhost:27017)

## Setup Instructions

### 1. Install Tailwind CSS IntelliSense Extension (Recommended)

To avoid CSS linting warnings for Tailwind directives:

1. Open VS Code Extensions (`Ctrl+Shift+P` → "Extensions: Install Extensions")
2. Search for **"Tailwind CSS IntelliSense"** (ID: `bradlc.vscode-tailwindcss`)
3. Install the extension
4. Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
py -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn motor pymongo python-dotenv pydantic

# Start the backend server
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

The backend API will be available at: http://127.0.0.1:8000

### 3. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm start
```

The frontend will be available at: http://localhost:3000

### 4. MongoDB Setup

Ensure MongoDB is running:

```powershell
# Start MongoDB service (if installed as service)
net start MongoDB

# Or run mongod directly
mongod
```

The application expects MongoDB at: `mongodb://localhost:27017/`

## Default Credentials

- **Username**: `admin`
- **Password**: `admin`

## Features

- **Job Posting Management**: Create, view, and delete job postings
- **Moderator Management**: Add, view, activate/deactivate moderators
- **Eligibility Criteria**: Set academic requirements for job postings
- **Role Requirements**: Define skill requirements for positions

## Troubleshooting

### CSS Warnings (@tailwind/@apply)

If you see warnings about unknown at-rules (`@tailwind`, `@apply`), either:
- Install the Tailwind CSS IntelliSense extension (recommended)
- Or reload VS Code window to apply workspace settings

These warnings don't affect functionality—Tailwind processes correctly during build.
