# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the comprehensive role-based access control (RBAC) middleware system implemented for the Placement Management System. The system provides authentication, authorization, and audit logging capabilities.

## Architecture

### Roles Hierarchy

```
SuperAdmin (System-wide access)
    ↓
Admin (College-scoped access)
    ↓
Moderator (Department-scoped access)
    ↓
Student (Read-only, own data)
```

### Core Middleware Components

1. **Authentication Middleware** (`src/middleware/auth.ts`)
   - `requireAuth` / `authenticate` - Validates JWT and attaches user to request
   - `requireRole([roles])` - Restricts access to specific roles
   - `requireCollegeAdminOf(paramName)` - Ensures admin manages only their college
   - `requireModeratorOfDept(paramName)` - Ensures moderator manages only their department
   - `requireSameCollege` - Ensures users access only their college data

2. **Audit Middleware** (`src/middleware/audit.ts`)
   - Automatic logging of all authenticated actions
   - Tracks: actor, action, resource, timestamp, IP, user agent, duration
   - Identifies suspicious activity
   - Severity classification (low, medium, high, critical)

## Middleware Usage

### Basic Authentication

```typescript
// Require any authenticated user
router.get('/profile', requireAuth, getProfile);

// Require specific role(s)
router.post('/jobs', requireAuth, requireRole(['admin', 'moderator']), createJob);

// Multiple roles allowed
router.put('/jobs/:id', requireAuth, requireRole(['admin', 'moderator']), updateJob);
```

### College-Level Access Control

```typescript
// Ensure admin can only manage their college
router.put('/colleges/:id', 
  requireAuth, 
  requireRole(['admin', 'superadmin']),
  requireCollegeAdminOf('id'), // Admins restricted to their college, SuperAdmin bypasses
  updateCollege
);

// Example: Admin with collegeId=123 can only PUT to /colleges/123
// SuperAdmin can PUT to any college
```

### Department-Level Access Control

```typescript
// Ensure moderator manages only their department
router.post('/departments/:dept/announcements',
  requireAuth,
  requireRole(['moderator', 'admin', 'superadmin']),
  requireModeratorOfDept('dept'), // Moderators restricted to their dept, higher roles bypass
  createAnnouncement
);

// Example: Moderator with department='CSE' can only POST to /departments/CSE/...
// Admin and SuperAdmin can POST to any department
```

### Combining Middleware

```typescript
// Complete authorization chain
router.delete('/jobs/:id',
  requireAuth,                        // 1. Authenticate user
  requireRole(['admin', 'moderator']), // 2. Check role
  requireCollegeAdminOf('collegeId'), // 3. Verify college access
  deleteJob
);
```

### Audit Logging

Audit middleware is applied globally after authentication:

```typescript
// In server.ts or route files
app.use('/api', requireAuth, auditMiddleware);

// All authenticated requests are automatically logged with:
// - User information (id, role, email, name)
// - Action type (create, read, update, delete, etc.)
// - Resource type and ID
// - Request/response details
// - Performance metrics (duration)
// - Security flags (suspicious activity)
```

## TypeScript Types

### IAuthRequest

Extended Express Request with authenticated user:

```typescript
interface IAuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: 'superadmin' | 'admin' | 'moderator' | 'student';
    collegeId?: string;
    department?: string;
    name?: string;
  };
}
```

### Audit Log Schema

```typescript
{
  college: ObjectId,              // Reference to College
  user: ObjectId,                 // Reference to User
  userRole: string,               // Role at time of action
  userName: string,               // User's name
  userEmail: string,              // User's email
  action: string,                 // Action performed (create, update, delete, etc.)
  resourceType: string,           // Type of resource (job, company, student, etc.)
  resourceId: string,             // ID of affected resource
  resourceName: string,           // Name/title of resource
  method: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH',
  endpoint: string,               // API endpoint
  ipAddress: string,              // Client IP
  userAgent: string,              // Browser/client info
  changes: {
    before: object,               // Previous state (for updates)
    after: object,                // New state
    fieldsChanged: string[]       // Changed field names
  },
  description: string,            // Human-readable description
  status: 'success'|'warning'|'failure',
  errorMessage: string,           // Error details if failed
  severity: 'low'|'medium'|'high'|'critical',
  isSuspicious: boolean,          // Flag for security monitoring
  duration: number,               // Request processing time (ms)
  metadata: object,               // Additional context
  timestamp: Date                 // Action timestamp
}
```

## Access Control Matrix

| Role        | Create Jobs | Update Jobs | Delete Jobs | View Jobs | Manage College | Manage Dept |
|-------------|-------------|-------------|-------------|-----------|----------------|-------------|
| SuperAdmin  | ✅ All      | ✅ All      | ✅ All      | ✅ All    | ✅ All         | ✅ All      |
| Admin       | ✅ Own      | ✅ Own      | ✅ Own      | ✅ Own    | ✅ Own         | ✅ Own      |
| Moderator   | ✅ Own Dept | ✅ Own Dept | ✅ Own Dept | ✅ Own    | ❌             | ✅ Own      |
| Student     | ❌          | ❌          | ❌          | ✅ Own    | ❌             | ❌          |

## Security Features

### 1. Role-Based Access
- Hierarchical roles with inheritance
- Granular permissions per role
- Multiple roles allowed per endpoint

### 2. College Isolation
- Admins restricted to their college
- Data segmentation by college
- SuperAdmin has cross-college access

### 3. Department Isolation
- Moderators restricted to their department
- Department-level data access control
- Admin/SuperAdmin bypass department restrictions

### 4. Audit Trail
- Complete action history
- Performance monitoring
- Suspicious activity detection
- IP and user agent tracking
- Automated severity classification

### 5. Error Handling
- Consistent 401 (Unauthorized) for auth failures
- 403 (Forbidden) for insufficient permissions
- Detailed error messages for debugging
- Audit logging doesn't block requests on failure

## Examples

### Example 1: Creating a Job Posting

```typescript
// Route definition
router.post('/jobs',
  requireAuth,
  requireRole(['admin', 'moderator']),
  requireSameCollege,
  createJob
);

// Flow:
// 1. requireAuth validates JWT → attaches user to req
// 2. requireRole checks if user.role is 'admin' or 'moderator'
// 3. requireSameCollege ensures job.collegeId matches user.collegeId
// 4. createJob controller executes
// 5. auditMiddleware logs: "admin John Doe performed create on job"
```

### Example 2: Updating College Settings

```typescript
// Route definition
router.put('/colleges/:id',
  requireAuth,
  requireRole(['admin', 'superadmin']),
  requireCollegeAdminOf('id'),
  updateCollege
);

// Scenarios:
// Admin (collegeId=123) → PUT /colleges/123 → ✅ Allowed
// Admin (collegeId=123) → PUT /colleges/456 → ❌ 403 Forbidden
// SuperAdmin → PUT /colleges/123 → ✅ Allowed
// SuperAdmin → PUT /colleges/456 → ✅ Allowed
```

### Example 3: Department Announcements

```typescript
// Route definition
router.post('/departments/:dept/announcements',
  requireAuth,
  requireRole(['moderator', 'admin', 'superadmin']),
  requireModeratorOfDept('dept'),
  createAnnouncement
);

// Scenarios:
// Moderator (dept=CSE) → POST /departments/CSE/announcements → ✅ Allowed
// Moderator (dept=CSE) → POST /departments/ECE/announcements → ❌ 403 Forbidden
// Admin (any dept) → POST /departments/CSE/announcements → ✅ Allowed
// SuperAdmin → POST /departments/ANY/announcements → ✅ Allowed
```

## Testing

### Test Suite Location
`tests/auth-middleware.test.ts`

### Prerequisites

Install Jest and testing dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

Configure Jest (`jest.config.js`):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};
```

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/auth-middleware.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:
- ✅ JWT authentication (valid, invalid, missing tokens)
- ✅ Role-based access control (all roles)
- ✅ College-level isolation (admins, superadmin)
- ✅ Department-level isolation (moderators, admins)
- ✅ Audit logging (success, failure, suspicious activity)
- ✅ Integration scenarios (multiple middleware)

Expected test output:
```
PASS tests/auth-middleware.test.ts
  requireAuth Middleware
    ✓ should reject requests without token (XXms)
    ✓ should reject requests with invalid token (XXms)
    ✓ should allow requests with valid token (XXms)
    ✓ should attach user to request (XXms)
  
  requireRole Middleware
    ✓ should allow admin to create jobs (XXms)
    ✓ should allow moderator to create jobs (XXms)
    ✓ should deny student from creating jobs (XXms)
  
  requireCollegeAdminOf Middleware
    ✓ should allow admin to manage their college (XXms)
    ✓ should deny admin from managing other colleges (XXms)
    ✓ should allow superadmin to manage any college (XXms)
  
  requireModeratorOfDept Middleware
    ✓ should allow moderator to manage their department (XXms)
    ✓ should deny moderator from managing other departments (XXms)
    ✓ should allow admin to manage any department (XXms)
  
  auditMiddleware
    ✓ should log successful actions (XXms)
    ✓ should log failed actions (XXms)
    ✓ should capture IP and user agent (XXms)
    ✓ should mark suspicious activity (XXms)
  
  Integration Tests
    ✓ should enforce complete authorization chain (XXms)
    ✓ should allow multiple roles (XXms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

## Implementation Checklist

- [x] Enhanced IAuthRequest type with department field
- [x] Implemented requireAuth alias for authenticate
- [x] Implemented requireCollegeAdminOf middleware
- [x] Implemented requireModeratorOfDept middleware
- [x] Enhanced audit middleware with comprehensive logging
- [x] Created comprehensive test suite
- [x] Verified TypeScript compilation
- [x] Documented usage patterns and examples
- [ ] Install Jest testing framework
- [ ] Run test suite and verify all tests pass
- [ ] Apply middleware to additional routes (most already protected)

## Migration Guide

### Updating Existing Routes

1. **Add authentication:**
   ```typescript
   // Before
   router.post('/jobs', createJob);
   
   // After
   router.post('/jobs', requireAuth, createJob);
   ```

2. **Add role restriction:**
   ```typescript
   // Before
   router.post('/jobs', requireAuth, createJob);
   
   // After
   router.post('/jobs', requireAuth, requireRole(['admin', 'moderator']), createJob);
   ```

3. **Add college isolation:**
   ```typescript
   // Before
   router.put('/colleges/:id', requireAuth, requireRole(['admin']), updateCollege);
   
   // After
   router.put('/colleges/:id', 
     requireAuth, 
     requireRole(['admin', 'superadmin']),
     requireCollegeAdminOf('id'),
     updateCollege
   );
   ```

4. **Add department isolation:**
   ```typescript
   // Before
   router.post('/announcements', requireAuth, requireRole(['moderator']), createAnnouncement);
   
   // After
   router.post('/departments/:dept/announcements',
     requireAuth,
     requireRole(['moderator', 'admin', 'superadmin']),
     requireModeratorOfDept('dept'),
     createAnnouncement
   );
   ```

## Troubleshooting

### Issue: "req.user is undefined"
**Cause:** Middleware order is incorrect  
**Solution:** Ensure `requireAuth` is called before any middleware that uses `req.user`

### Issue: 403 Forbidden for admin
**Cause:** Admin trying to access other college's data  
**Solution:** Verify `req.params` or `req.body` contains correct college ID matching user's college

### Issue: Audit logs not created
**Cause:** User not authenticated or audit middleware not applied  
**Solution:** Ensure audit middleware comes after authentication middleware

### Issue: TypeScript error "Property 'user' does not exist"
**Cause:** Request not typed as IAuthRequest  
**Solution:** Use `const req = request as IAuthRequest` or define handler parameter type

## Best Practices

1. **Always authenticate first:** `requireAuth` should be the first middleware
2. **Use specific roles:** Prefer `requireRole(['admin'])` over checking in controller
3. **Combine middleware:** Chain multiple middleware for layered security
4. **Test thoroughly:** Verify both allowed and forbidden scenarios
5. **Monitor audit logs:** Review suspicious activity regularly
6. **Keep roles minimal:** Assign lowest necessary role to users
7. **Update documentation:** Document any custom middleware or access patterns

## Related Files

- `src/middleware/auth.ts` - Authentication and authorization middleware
- `src/middleware/audit.ts` - Audit logging middleware
- `src/types/index.ts` - TypeScript type definitions
- `src/models/AuditLog.ts` - Audit log data model
- `src/routes/jobRoutes.ts` - Example of protected routes
- `tests/auth-middleware.test.ts` - Comprehensive test suite

## References

- JWT Authentication: https://jwt.io/
- Express Middleware: https://expressjs.com/en/guide/using-middleware.html
- MongoDB Audit Logging: https://www.mongodb.com/docs/manual/core/auditing/
- RBAC Patterns: https://auth0.com/docs/manage-users/access-control/rbac
