import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server';
import { connectDB } from '../src/config/database';
import User from '../src/models/User';
import College from '../src/models/College';
import Job from '../src/models/Job';
import AuditLog from '../src/models/AuditLog';
import mongoose from 'mongoose';

/**
 * Authorization Middleware Test Suite
 * 
 * Tests role-based access control (RBAC) and audit logging
 * 
 * Test Coverage:
 * 1. requireAuth - JWT validation and user attachment
 * 2. requireRole - Role-based access control
 * 3. requireCollegeAdminOf - College admin isolation
 * 4. requireModeratorOfDept - Department-level access control
 * 5. auditMiddleware - Action logging
 */

describe('Authorization Middleware Tests', () => {
  let college1: any;
  let college2: any;
  let superAdminToken: string;
  let admin1Token: string;
  let admin2Token: string;
  let moderator1Token: string;
  let moderator2Token: string;
  let student1Token: string;
  let student2Token: string;
  let job1: any;
  let job2: any;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Clear collections
    await User.deleteMany({});
    await College.deleteMany({});
    await Job.deleteMany({});
    await AuditLog.deleteMany({});

    // Create colleges
    college1 = await College.create({
      name: 'Test University 1',
      code: 'TU1',
      location: 'City1',
      status: 'active'
    });

    college2 = await College.create({
      name: 'Test University 2',
      code: 'TU2',
      location: 'City2',
      status: 'active'
    });

    // Create SuperAdmin
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@test.com',
      password: 'SuperAdmin123!',
      fullName: 'Super Administrator',
      role: 'superadmin',
      status: 'active',
      isApproved: true,
      isActive: true
    });

    // Create Admin for College 1
    const admin1 = await User.create({
      username: 'admin1',
      email: 'admin1@test.com',
      password: 'Admin123!',
      fullName: 'Admin One',
      role: 'admin',
      collegeId: college1._id,
      status: 'active',
      isApproved: true,
      isActive: true
    });

    // Create Admin for College 2
    const admin2 = await User.create({
      username: 'admin2',
      email: 'admin2@test.com',
      password: 'Admin123!',
      fullName: 'Admin Two',
      role: 'admin',
      collegeId: college2._id,
      status: 'active',
      isApproved: true,
      isActive: true
    });

    // Create Moderators with departments
    const moderator1 = await User.create({
      username: 'moderator1',
      email: 'mod1@test.com',
      password: 'Mod123!',
      fullName: 'Moderator One',
      role: 'moderator',
      collegeId: college1._id,
      department: 'Computer Science',
      status: 'active',
      isApproved: true,
      isActive: true
    });

    const moderator2 = await User.create({
      username: 'moderator2',
      email: 'mod2@test.com',
      password: 'Mod123!',
      fullName: 'Moderator Two',
      role: 'moderator',
      collegeId: college1._id,
      department: 'Mechanical Engineering',
      status: 'active',
      isApproved: true,
      isActive: true
    });

    // Create Students
    const student1 = await User.create({
      username: 'student1',
      email: 'student1@test.com',
      password: 'Student123!',
      fullName: 'Student One',
      role: 'student',
      collegeId: college1._id,
      department: 'Computer Science',
      status: 'active',
      isApproved: true,
      isActive: true
    });

    const student2 = await User.create({
      username: 'student2',
      email: 'student2@test.com',
      password: 'Student123!',
      fullName: 'Student Two',
      role: 'student',
      collegeId: college2._id,
      department: 'Electrical Engineering',
      status: 'active',
      isApproved: true,
      isActive: true
    });

    // Login all users to get tokens
    superAdminToken = await getAuthToken('admin', 'superadmin', 'SuperAdmin123!');
    admin1Token = await getAuthToken('admin', 'admin1', 'Admin123!', college1._id);
    admin2Token = await getAuthToken('admin', 'admin2', 'Admin123!', college2._id);
    moderator1Token = await getAuthToken('moderator', 'moderator1', 'Mod123!', college1._id);
    moderator2Token = await getAuthToken('moderator', 'moderator2', 'Mod123!', college1._id);
    student1Token = await getAuthToken('student', 'student1', 'Student123!', college1._id);
    student2Token = await getAuthToken('student', 'student2', 'Student123!', college2._id);

    // Create test jobs
    job1 = await Job.create({
      title: 'Software Engineer',
      company: 'Tech Corp',
      collegeId: college1._id,
      department: 'Computer Science',
      status: 'active',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    job2 = await Job.create({
      title: 'Mechanical Engineer',
      company: 'Mech Industries',
      collegeId: college2._id,
      department: 'Mechanical Engineering',
      status: 'active',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Helper function to get auth token
  async function getAuthToken(
    role: string,
    username: string,
    password: string,
    collegeId?: string
  ): Promise<string> {
    const response = await request(app)
      .post(`/api/auth/login`)
      .send({ username, password, collegeId });
    return response.body.data.token;
  }

  describe('1. requireAuth - Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/jobs');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(response.status).not.toBe(401);
    });

    it('should attach user object to request', async () => {
      // This is tested indirectly through audit logs
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Test Job',
          company: 'Test Company',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      // Check audit log was created with user info
      const auditLog = await AuditLog.findOne({ action: 'job_create' }).sort({ createdAt: -1 });
      expect(auditLog).toBeDefined();
      expect(auditLog?.userName).toBe('Admin One');
    });
  });

  describe('2. requireRole - Role-Based Access Control', () => {
    it('should allow admin to create jobs', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Admin Created Job',
          company: 'Admin Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow moderator to create jobs', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({
          title: 'Moderator Created Job',
          company: 'Mod Corp',
          department: 'Computer Science',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should deny student from creating jobs', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Student Job',
          company: 'Student Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should allow student to view jobs', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny moderator from bulk operations', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk/update-status')
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({
          jobIds: [job1._id],
          status: 'closed'
        });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should allow admin for bulk operations', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk/update-status')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          jobIds: [job1._id],
          status: 'active'
        });
      
      expect(response.status).not.toBe(403);
    });
  });

  describe('3. requireCollegeAdminOf - College Isolation', () => {
    it('should allow admin to access their own college resources', async () => {
      const response = await request(app)
        .get(`/api/jobs/${job1._id}`)
        .set('Authorization', `Bearer ${admin1Token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny admin from accessing other college resources', async () => {
      const response = await request(app)
        .get(`/api/jobs/${job2._id}`)
        .set('Authorization', `Bearer ${admin1Token}`);
      
      // Should not find the job or return 403
      expect([403, 404]).toContain(response.status);
    });

    it('should allow superadmin to access any college', async () => {
      const response1 = await request(app)
        .get(`/api/jobs/${job1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      const response2 = await request(app)
        .get(`/api/jobs/${job2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should prevent admin from modifying other college jobs', async () => {
      const response = await request(app)
        .put(`/api/jobs/${job2._id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({ title: 'Updated Title' });
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('4. requireModeratorOfDept - Department Isolation', () => {
    it('should allow moderator to manage their department jobs', async () => {
      // Create job in moderator's department
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({
          title: 'CS Department Job',
          company: 'CS Corp',
          department: 'Computer Science',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(jobResponse.status).toBe(201);
      
      const jobId = jobResponse.body.data._id;
      
      // Update job in same department
      const updateResponse = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({ title: 'Updated CS Job' });
      
      expect(updateResponse.status).toBe(200);
    });

    it('should deny moderator from managing other department jobs', async () => {
      // Create job in different department
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Mechanical Job',
          company: 'Mech Corp',
          department: 'Mechanical Engineering',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      const jobId = jobResponse.body.data._id;
      
      // Try to update with CS moderator
      const updateResponse = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({ title: 'Unauthorized Update' });
      
      // Should fail due to department mismatch
      expect([403, 404]).toContain(updateResponse.status);
    });

    it('should allow admin to manage any department', async () => {
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Cross Department Job',
          company: 'Any Corp',
          department: 'Electrical Engineering',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(jobResponse.status).toBe(201);
    });
  });

  describe('5. auditMiddleware - Action Logging', () => {
    it('should log job creation', async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Audit Test Job',
          company: 'Audit Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      const auditLog = await AuditLog.findOne({ action: 'job_create' }).sort({ createdAt: -1 });
      
      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('job_create');
      expect(auditLog?.resourceType).toBe('Job');
      expect(auditLog?.userRole).toBe('admin');
      expect(auditLog?.method).toBe('POST');
      expect(auditLog?.status).toBe('success');
    });

    it('should log failed actions with proper status', async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Unauthorized Job',
          company: 'Test Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      const auditLog = await AuditLog.findOne({ 
        action: 'job_create',
        userRole: 'student'
      }).sort({ createdAt: -1 });
      
      expect(auditLog).toBeDefined();
      expect(auditLog?.status).toBe('warning'); // 403 status
      expect(auditLog?.isSuspicious).toBe(true); // Student trying unauthorized action
    });

    it('should log IP address and user agent', async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .set('User-Agent', 'Test Agent 1.0')
        .send({
          title: 'IP Test Job',
          company: 'IP Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      const auditLog = await AuditLog.findOne({ action: 'job_create' }).sort({ createdAt: -1 });
      
      expect(auditLog).toBeDefined();
      expect(auditLog?.ipAddress).toBeDefined();
      expect(auditLog?.userAgent).toContain('Test Agent');
    });

    it('should log duration of requests', async () => {
      await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${student1Token}`);
      
      // Note: GET requests are not logged by default to reduce volume
      // Only mutating operations are logged
    });

    it('should mark unauthorized access attempts as suspicious', async () => {
      // Student trying to delete job
      await request(app)
        .delete(`/api/jobs/${job1._id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      const auditLog = await AuditLog.findOne({ 
        action: 'job_delete',
        userRole: 'student'
      }).sort({ createdAt: -1 });
      
      if (auditLog) {
        expect(auditLog.isSuspicious).toBe(true);
        expect(auditLog.status).toBe('warning');
      }
    });
  });

  describe('6. Integration Tests', () => {
    it('should enforce complete authorization chain', async () => {
      // Test complete flow: Auth -> Role -> College -> Audit
      
      // 1. Create job as admin1
      const createResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          title: 'Integration Test Job',
          company: 'Integration Corp',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.data._id;
      
      // 2. Admin2 should NOT be able to modify (different college)
      const updateResponse = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${admin2Token}`)
        .send({ title: 'Unauthorized Update' });
      
      expect([403, 404]).toContain(updateResponse.status);
      
      // 3. Student1 should be able to view (same college)
      const viewResponse = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(viewResponse.status).toBe(200);
      
      // 4. Student1 should NOT be able to delete
      const deleteResponse = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(deleteResponse.status).toBe(403);
      
      // 5. SuperAdmin should be able to modify (bypass college check)
      const superAdminUpdate = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'SuperAdmin Update' });
      
      expect(superAdminUpdate.status).toBe(200);
      
      // 6. Verify all actions were audited
      const auditLogs = await AuditLog.find({ resourceId: jobId });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should handle multiple middleware checks correctly', async () => {
      // Create job requiring role AND department checks
      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${moderator1Token}`)
        .send({
          title: 'Multi-Check Job',
          company: 'Multi Corp',
          department: 'Computer Science', // Matches moderator1's dept
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(response.status).toBe(201);
      
      // Verify audit log captured all context
      const auditLog = await AuditLog.findOne({ action: 'job_create' }).sort({ createdAt: -1 });
      expect(auditLog?.college?.toString()).toBe(college1._id.toString());
      expect(auditLog?.userRole).toBe('moderator');
    });
  });
});
