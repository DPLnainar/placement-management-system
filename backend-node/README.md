# College Placement Management System - Node.js Backend

A role-based authentication system for college placement management using Node.js, Express, and MongoDB.

## 🎯 Key Features

### Authentication Architecture

**DEVELOPER-CONTROLLED ACCESS** - Critical security feature:

1. **Only developers can create admin accounts** (via database or seed script)
2. **No self-registration** - Users cannot register themselves
3. **Admin logs in** → Auto-linked to their pre-assigned college
4. **Admin creates moderators/students** → Auto-assigned to admin's college
5. **All users log in** → Auto-linked to their assigned college (no selection needed)

### Access Control Hierarchy

```
DEVELOPER (Database/Seed Script)
    ↓
Creates Admin + Assigns to College
    ↓
ADMIN (Can login after developer creates account)
    ↓
Admin Creates Moderators & Students (for their college only)
    ↓
MODERATORS & STUDENTS (Can login after admin creates account)
```

### Role Hierarchy

- **Admin**: Full control over their college
  - Create moderators and students
  - Manage users (activate/deactivate/delete)
  - View all college data
  - Cannot access other colleges

- **Moderator**: Limited management permissions
  - View users in their college
  - View college data
  - Cannot create or delete users

- **Student**: Basic access
  - View jobs from their college
  - Apply for positions
  - Cannot manage users

### Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based middleware protection
- College boundary enforcement
- Auto-assignment validation
- **NO public registration** - Only developers can create admins
- **NO college selection during login** - Users auto-linked to assigned college

## 📦 Installation

```powershell
# Navigate to backend-node directory
cd backend-node

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your settings
```

## 🔧 Configuration

Edit `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/placement_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h
NODE_ENV=development
```

## 🚀 Running the Server

```powershell
# Seed database with sample admin users
npm run seed

# Start server (production)
npm start

# Start server with auto-restart (development)
npm run dev
```

## 👤 Sample Credentials (after seeding)

### Tech University (TU)
- **Admin**: `admin_tu` / `admin123`
- **Moderator**: `mod_tu` / `mod123`
- **Student**: `student1_tu` / `student123`

### State Engineering College (SEC)
- **Admin**: `admin_sec` / `admin123`
- **Moderator**: `mod_sec` / `mod123`
- **Student**: `student1_sec` / `student123`

## 📡 API Endpoints

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_tu",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "admin_tu",
    "email": "admin@techuni.edu",
    "fullName": "John Admin",
    "role": "admin",
    "college": {
      "id": "...",
      "name": "Tech University",
      "code": "TU",
      "location": "New York, NY"
    }
  }
}
```

### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

### Create User (Admin Only)

```http
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "newstudent",
  "email": "newstudent@techuni.edu",
  "password": "password123",
  "fullName": "New Student",
  "role": "student"
}
```

**Note:** `collegeId` is automatically set to admin's college. Admin cannot assign users to other colleges.

### Get College Users

```http
GET /api/users
Authorization: Bearer <token>

# Optional filters
GET /api/users?role=student
GET /api/users?status=active
```

### Update User Status (Admin Only)

```http
PUT /api/users/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "inactive"
}
```

### Delete User (Admin Only)

```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

## 🏗️ Project Structure

```
backend-node/
├── config/
│   └── database.js           # MongoDB connection
├── controllers/
│   ├── authController.js     # Login, profile, password management
│   └── userController.js     # User CRUD operations
├── middleware/
│   └── auth.js               # JWT verification, role checks, college validation
├── models/
│   ├── College.js            # College schema
│   └── User.js               # User schema with role and collegeId
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   └── userRoutes.js         # User management endpoints
├── scripts/
│   └── seedAdmin.js          # Create sample admin users
├── .env                      # Environment variables
├── .env.example              # Example environment config
├── package.json              # Dependencies and scripts
└── server.js                 # Express app entry point
```

## 🔐 Authentication Flow

### Login Process (No College Selection)

1. User provides `username` and `password`
2. System finds user in database (user already has `collegeId` assigned)
3. System validates password
4. System generates JWT with `userId`, `role`, and `collegeId`
5. User receives token and college information
6. Frontend stores token (no college selection needed)

### Admin Assignment Flow

1. **Developer** creates college in database (manual operation)
2. **Developer** creates admin user with `collegeId` (manual operation)
3. **Admin** logs in → auto-linked to their college
4. **Admin** creates moderator/student → auto-assigned to admin's college
5. **New user** logs in → auto-linked to their assigned college

## 🛡️ Middleware Protection

### authenticate
- Verifies JWT token
- Loads user data with college info
- Attaches `req.user` for downstream middleware

### requireRole(['admin', 'moderator'])
- Checks if user has required role
- Returns 403 if role doesn't match

### requireSameCollege
- Ensures resource belongs to user's college
- Prevents cross-college data access
- Auto-sets `req.collegeId` if not specified

### requireAdminForAssignment
- Validates admin is creating user
- Ensures user assigned to admin's college only
- Prevents cross-college user creation

## 📊 Database Models

### User Model
```javascript
{
  username: String (unique, lowercase),
  email: String (unique, lowercase),
  password: String (hashed),
  fullName: String,
  role: 'admin' | 'moderator' | 'student',
  collegeId: ObjectId (ref: College) - REQUIRED,
  assignedBy: ObjectId (ref: User) - null for admins,
  status: 'active' | 'inactive' | 'pending',
  createdAt: Date,
  updatedAt: Date
}
```

### College Model
```javascript
{
  name: String (unique),
  location: String,
  code: String (unique, uppercase),
  adminId: ObjectId (ref: User),
  status: 'active' | 'inactive',
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 Key Concepts

### Developer-Only Admin Creation

**CRITICAL SECURITY FEATURE:**

This system does NOT allow public registration. Only developers can create admin accounts.

**Why this approach?**
- **Security**: Prevents unauthorized access
- **Control**: Developers verify and approve each college/admin
- **Accountability**: Clear audit trail of who created each admin
- **No self-registration exploits**: Users cannot create their own admin accounts

**How developers create admins:**
1. Run seed script: `npm run seed` (creates sample admins)
2. Manually add to database using MongoDB shell/Compass
3. Create custom seed script for production admins

**After admin is created by developer:**
- Admin receives credentials from developer
- Admin logs in (auto-linked to their college)
- Admin can then create moderators and students for their college

### Why No College Selection?

**Traditional (problematic) approach:**
- User logs in → Selects college from dropdown → Gets access
- Problems: Users can switch colleges, data isolation issues

**This system (secure) approach:**
- Developer assigns admin to college in database
- Admin creates users for their college
- Users auto-linked to their pre-assigned college on login
- Benefits: Permanent college association, no switching, clear boundaries

### Role Assignment Logic

```
Developer (manual DB operation)
    ↓
Creates Admin + Assigns to College
    ↓
Admin logs in (auto-linked to college)
    ↓
Admin creates Moderator/Student (auto-assigned to admin's college)
    ↓
Moderator/Student logs in (auto-linked to college)
```

### Access Control Matrix

| Action | Admin | Moderator | Student |
|--------|-------|-----------|---------|
| Create users | ✅ (own college) | ❌ | ❌ |
| View users | ✅ (own college) | ✅ (own college) | ❌ |
| Update user status | ✅ (own college) | ❌ | ❌ |
| Delete users | ✅ (own college) | ❌ | ❌ |
| View jobs | ✅ (own college) | ✅ (own college) | ✅ (own college) |
| Access other college | ❌ | ❌ | ❌ |

## 🧪 Testing

```powershell
# 1. Seed database
npm run seed

# 2. Test login (no college selection)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_tu","password":"admin123"}'

# 3. Test creating user (admin only)
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"username":"test","email":"test@techuni.edu","password":"test123","fullName":"Test User","role":"student"}'
```

## 🚨 Important Notes

1. **No College Selection**: Users do NOT select their college during login. It's pre-assigned.

2. **Admin Creation**: Admins are created manually by developers in the database (use seed script).

3. **College Boundaries**: Middleware strictly enforces college boundaries. Cross-college access is impossible.

4. **Role Restrictions**: Only admins can create users. Moderators and students cannot.

5. **Auto-Assignment**: When admin creates a user, the user is automatically assigned to admin's college.

## 📝 License

ISC
