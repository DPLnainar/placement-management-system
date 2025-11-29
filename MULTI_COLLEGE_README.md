# Multi-College Placement Portal

A comprehensive React-based placement portal that supports multiple colleges with role-based authentication and college-specific data management.

## Features

### Multi-College Support
- Each college has its own isolated data
- Admins, moderators, and students are scoped to their college
- Jobs are college-specific

### Role-Based Access Control
1. **Admin**: Full access to college data
   - Manage jobs (create, view, delete)
   - Manage moderators and students
   - View all users and their status
   - Activate/deactivate users

2. **Moderator**: Job management
   - Create and manage job postings
   - View all jobs for their college
   - Delete jobs

3. **Student**: View opportunities
   - View active job postings
   - See job details and eligibility criteria
   - Apply for positions

### Secure Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected API endpoints
- Automatic token refresh

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor async driver
- **JWT**: Token-based authentication
- **Passlib + Bcrypt**: Password hashing
- **Pydantic**: Data validation

### Frontend
- **React 19**: UI library
- **React Router**: Navigation
- **Context API**: State management
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Lucide React**: Icons

## Installation & Setup

### Prerequisites
1. **MongoDB**: Install and start MongoDB server
   ```bash
   # Install MongoDB Community Server from:
   # https://www.mongodb.com/try/download/community
   
   # Start MongoDB service
   net start MongoDB
   ```

2. **Node.js**: Version 16 or higher
3. **Python**: Version 3.10 or higher

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd placement-main/backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1  # On Windows PowerShell
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```
   MONGO_URL=mongodb://localhost:27017/
   DB_NAME=placement_db
   SECRET_KEY=your-secret-key-change-in-production-12345
   ```

5. Initialize sample data:
   ```bash
   python init_data.py
   ```

6. Start the backend server:
   ```bash
   uvicorn server_new:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd placement-main/frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Update `src/index.js` to use the new App:
   ```javascript
   import App from './AppNew';
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Access the application at `http://localhost:3000`

## Sample Login Credentials

After running `init_data.py`, use these credentials:

### MIT College (MIT)
- **Admin**: `adminmit` / `admin123`
- **Moderator**: `modmit` / `mod123`
- **Students**: 
  - `student1mit` / `student123`
  - `student2mit` / `student123`
  - `student3mit` / `student123`

### VIT University (VIT)
- **Admin**: `adminvit` / `admin123`
- **Moderator**: `modvit` / `mod123`
- **Students**: 
  - `student1vit` / `student123`
  - `student2vit` / `student123`
  - `student3vit` / `student123`

### BITS Pilani (BITS)
- **Admin**: `adminbits` / `admin123`
- **Moderator**: `modbits` / `mod123`
- **Students**: 
  - `student1bits` / `student123`
  - `student2bits` / `student123`
  - `student3bits` / `student123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Colleges
- `GET /api/colleges` - List all colleges
- `POST /api/colleges` - Create new college (no auth required for setup)
- `GET /api/colleges/{id}` - Get college details

### Jobs
- `GET /api/jobs` - List college-specific jobs
- `POST /api/jobs` - Create job (admin/moderator only)
- `GET /api/jobs/{id}` - Get job details
- `DELETE /api/jobs/{id}` - Delete job (admin/moderator only)

### Users
- `GET /api/users` - List college users (admin only)
- `PUT /api/users/{id}/status` - Update user status (admin only)
- `DELETE /api/users/{id}` - Delete user (admin only)

## Architecture

### Backend Architecture
```
backend/
├── server_new.py         # Main FastAPI application
├── init_data.py          # Sample data initialization
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

### Frontend Architecture
```
frontend/src/
├── components/
│   ├── Login.jsx                 # Login/Register component
│   ├── ProtectedRoute.jsx        # Route guard
│   ├── AdminDashboard.jsx        # Admin dashboard
│   ├── ModeratorDashboard.jsx    # Moderator dashboard
│   ├── StudentDash.jsx           # Student dashboard
│   ├── CreateJob.jsx             # Job creation form
│   └── ui/                       # shadcn/ui components
├── contexts/
│   └── AuthContext.jsx           # Authentication context
├── services/
│   └── api.js                    # API client
└── AppNew.jsx                    # Main app with routing
```

### Database Collections
- `colleges`: College information
- `users`: All users (students, moderators, admins)
- `user_passwords`: Hashed passwords
- `jobs`: Job postings

## Key Features Implementation

### 1. College Isolation
All data is scoped by `collegeId`. Users can only see and manage data from their own college.

### 2. JWT Authentication
- Token expires in 24 hours
- Contains user ID, role, and college ID
- Automatically attached to all API requests

### 3. Role-Based Access
- Routes protected by role
- API endpoints verify user role
- UI adapts based on user role

### 4. Data Validation
- Pydantic models validate all data
- Frontend validation before submission
- Email validation and unique constraints

## Usage Guide

### For Admins
1. Login with admin credentials
2. View dashboard with stats (jobs, students, moderators)
3. Navigate through tabs: Overview, Jobs, Moderators, Students
4. Create new jobs using "Create Job" button
5. Manage moderators and students (activate/deactivate/delete)

### For Moderators
1. Login with moderator credentials
2. View jobs dashboard
3. Create new job postings
4. Delete jobs as needed

### For Students
1. Login with student credentials
2. Browse active job postings
3. View detailed job requirements
4. Check eligibility criteria
5. Apply for positions

## Customization

### Adding New Colleges
Run this script or use the API:
```python
{
    "name": "College Name",
    "code": "COLLEGE_CODE",
    "location": "City, State"
}
```

### Adding New Users
Use the registration form or API endpoint with role specification.

### Modifying Job Fields
Update the `JobPosting` model in `server_new.py` and corresponding frontend forms.

## Security Considerations

1. **Change SECRET_KEY**: Use a strong, random secret key in production
2. **HTTPS**: Deploy with HTTPS in production
3. **Password Policy**: Implement stronger password requirements
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Input Validation**: All inputs are validated on both frontend and backend

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `net start MongoDB`
- Check connection string in `.env`
- Verify MongoDB port is not blocked

### Backend Not Starting
- Activate virtual environment
- Install all requirements
- Check Python version (3.10+)

### Frontend Build Errors
- Clear node_modules and reinstall
- Use `--legacy-peer-deps` flag
- Check Node.js version

### Authentication Errors
- Clear browser localStorage
- Check token expiration
- Verify backend is running

## Future Enhancements

- Application tracking system
- Email notifications
- Resume upload and management
- Interview scheduling
- Analytics and reporting
- Bulk user import
- Advanced search and filtering
- Mobile app support

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
