/**
 * Analytics Service Tests
 * Tests for placement statistics and eligibility violations
 */

import { Types } from 'mongoose';
import {
  getPlacementStats,
  getEligibilityViolations,
  getWeeklySummary
} from '../src/services/analyticsService';
import User from '../src/models/User';
import StudentData from '../src/models/StudentData';
import Job from '../src/models/Job';
import Application from '../src/models/Application';
import College from '../src/models/College';

// Mock data
const mockCollegeId = new Types.ObjectId().toString();
const mockJobId = new Types.ObjectId().toString();

describe('Analytics Service', () => {
  describe('getPlacementStats', () => {
    it('should return correct placement statistics', async () => {
      // Mock database responses
      const mockStudents = [
        { _id: new Types.ObjectId(), department: 'CSE', role: 'student', collegeId: mockCollegeId },
        { _id: new Types.ObjectId(), department: 'CSE', role: 'student', collegeId: mockCollegeId },
        { _id: new Types.ObjectId(), department: 'ECE', role: 'student', collegeId: mockCollegeId },
        { _id: new Types.ObjectId(), department: 'ECE', role: 'student', collegeId: mockCollegeId }
      ];

      const mockProfiles = [
        { userId: mockStudents[0]._id, placementStatus: 'placed', department: 'CSE' },
        { userId: mockStudents[1]._id, placementStatus: 'not_placed', department: 'CSE' },
        { userId: mockStudents[2]._id, placementStatus: 'placed', department: 'ECE' },
        { userId: mockStudents[3]._id, placementStatus: 'not_placed', department: 'ECE' }
      ];

      jest.spyOn(User, 'find').mockResolvedValue(mockStudents as any);
      jest.spyOn(StudentData, 'find').mockResolvedValue(mockProfiles as any);
      jest.spyOn(Job, 'find').mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          title: 'Software Engineer',
          companyName: 'Tech Corp'
        }
      ] as any);
      jest.spyOn(Application, 'find').mockResolvedValue([
        {
          jobId: new Types.ObjectId(),
          studentId: mockStudents[0]._id,
          status: 'PLACED'
        }
      ] as any);

      const stats = await getPlacementStats(mockCollegeId);

      expect(stats.totalStudents).toBe(4);
      expect(stats.totalPlaced).toBe(2);
      expect(stats.placementRate).toBe(50);
      expect(stats.deptWiseCounts).toHaveLength(2);
      expect(stats.deptWiseCounts.find(d => d.dept === 'CSE')).toEqual({
        dept: 'CSE',
        total: 2,
        placed: 1,
        placementRate: 50
      });
    });

    it('should handle date range filtering', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');

      jest.spyOn(User, 'find').mockResolvedValue([] as any);
      jest.spyOn(StudentData, 'find').mockResolvedValue([] as any);
      jest.spyOn(Job, 'find').mockResolvedValue([] as any);
      jest.spyOn(Application, 'find').mockResolvedValue([] as any);

      const stats = await getPlacementStats(mockCollegeId, { fromDate, toDate });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: fromDate,
            $lte: toDate
          })
        })
      );
    });

    it('should return zero stats for empty college', async () => {
      jest.spyOn(User, 'find').mockResolvedValue([] as any);
      jest.spyOn(StudentData, 'find').mockResolvedValue([] as any);
      jest.spyOn(Job, 'find').mockResolvedValue([] as any);
      jest.spyOn(Application, 'find').mockResolvedValue([] as any);

      const stats = await getPlacementStats(mockCollegeId);

      expect(stats.totalStudents).toBe(0);
      expect(stats.totalPlaced).toBe(0);
      expect(stats.placementRate).toBe(0);
      expect(stats.deptWiseCounts).toHaveLength(0);
    });
  });

  describe('getEligibilityViolations', () => {
    it('should identify CGPA violations', async () => {
      const mockJob = {
        _id: mockJobId,
        title: 'Software Engineer',
        college: mockCollegeId,
        eligibilityCriteria: {
          cgpa: 7.0,
          tenthPct: 60,
          twelfthPct: 60,
          allowArrears: false,
          deptList: ['CSE', 'ECE']
        }
      };

      const mockStudents = [
        { _id: new Types.ObjectId(), department: 'CSE' },
        { _id: new Types.ObjectId(), department: 'CSE' }
      ];

      const mockProfiles = [
        {
          userId: mockStudents[0]._id,
          education: {
            graduation: { cgpa: 6.5 },
            tenth: { percentage: 65 },
            twelfth: { percentage: 65 }
          },
          activeBacklogs: 0
        },
        {
          userId: mockStudents[1]._id,
          education: {
            graduation: { cgpa: 7.5 },
            tenth: { percentage: 55 },
            twelfth: { percentage: 65 }
          },
          activeBacklogs: 0
        }
      ];

      jest.spyOn(Job, 'findOne').mockResolvedValue(mockJob as any);
      jest.spyOn(User, 'find').mockResolvedValue(mockStudents as any);
      jest.spyOn(StudentData, 'find').mockResolvedValue(mockProfiles as any);

      const violations = await getEligibilityViolations(mockCollegeId, mockJobId);

      expect(violations).toContainEqual(
        expect.objectContaining({
          reason: expect.stringContaining('CGPA below 7')
        })
      );
      expect(violations).toContainEqual(
        expect.objectContaining({
          reason: expect.stringContaining('10th % below 60')
        })
      );
    });

    it('should identify backlog violations', async () => {
      const mockJob = {
        _id: mockJobId,
        college: mockCollegeId,
        eligibilityCriteria: {
          cgpa: 6.0,
          allowArrears: false,
          deptList: ['CSE']
        }
      };

      const mockStudent = { _id: new Types.ObjectId(), department: 'CSE' };
      const mockProfile = {
        userId: mockStudent._id,
        education: { graduation: { cgpa: 7.0 } },
        activeBacklogs: 2
      };

      jest.spyOn(Job, 'findOne').mockResolvedValue(mockJob as any);
      jest.spyOn(User, 'find').mockResolvedValue([mockStudent] as any);
      jest.spyOn(StudentData, 'find').mockResolvedValue([mockProfile] as any);

      const violations = await getEligibilityViolations(mockCollegeId, mockJobId);

      expect(violations).toContainEqual(
        expect.objectContaining({
          reason: expect.stringContaining('Has active backlogs (2)')
        })
      );
    });

    it('should return empty array for non-existent job', async () => {
      jest.spyOn(Job, 'findOne').mockResolvedValue(null);

      const violations = await getEligibilityViolations(mockCollegeId, 'invalid-job-id');

      expect(violations).toHaveLength(0);
    });
  });

  describe('getWeeklySummary', () => {
    it('should return weekly summary with trends', async () => {
      // Mock stats for current and previous week
      const mockCurrentWeek = {
        totalStudents: 100,
        totalPlaced: 60,
        placementRate: 60,
        deptWiseCounts: [
          { dept: 'CSE', total: 50, placed: 35, placementRate: 70 },
          { dept: 'ECE', total: 50, placed: 25, placementRate: 50 }
        ],
        companyWisePlacements: [
          { company: 'Tech Corp', placedCount: 30 },
          { company: 'Info Systems', placedCount: 20 }
        ],
        jobWiseStats: []
      };

      const mockPreviousWeek = {
        totalStudents: 100,
        totalPlaced: 50,
        placementRate: 50,
        deptWiseCounts: [
          { dept: 'CSE', total: 50, placed: 30, placementRate: 60 },
          { dept: 'ECE', total: 50, placed: 20, placementRate: 40 }
        ],
        companyWisePlacements: [
          { company: 'Tech Corp', placedCount: 25 }
        ],
        jobWiseStats: []
      };

      // Mock getPlacementStats calls
      const getPlacementStatsSpy = jest.spyOn(
        require('../src/services/analyticsService'),
        'getPlacementStats'
      );

      getPlacementStatsSpy
        .mockResolvedValueOnce(mockCurrentWeek)
        .mockResolvedValueOnce(mockPreviousWeek);

      const summary = await getWeeklySummary(mockCollegeId);

      expect(summary.currentWeek.placementRate).toBe(60);
      expect(summary.previousWeek.placementRate).toBe(50);
      expect(summary.trends.placementRateChange).toBe(10);
      expect(summary.trends.topPerformingDept).toBe('CSE');
      expect(summary.trends.topHiringCompany).toBe('Tech Corp');
    });

    it('should generate urgent actions for placement rate drop', async () => {
      const mockCurrentWeek = {
        totalStudents: 100,
        totalPlaced: 40,
        placementRate: 40,
        deptWiseCounts: [],
        companyWisePlacements: [],
        jobWiseStats: []
      };

      const mockPreviousWeek = {
        totalStudents: 100,
        totalPlaced: 60,
        placementRate: 60,
        deptWiseCounts: [],
        companyWisePlacements: [],
        jobWiseStats: []
      };

      const getPlacementStatsSpy = jest.spyOn(
        require('../src/services/analyticsService'),
        'getPlacementStats'
      );

      getPlacementStatsSpy
        .mockResolvedValueOnce(mockCurrentWeek)
        .mockResolvedValueOnce(mockPreviousWeek);

      const summary = await getWeeklySummary(mockCollegeId);

      expect(summary.trends.urgentActions).toContainEqual(
        expect.stringContaining('Placement rate dropped by 20%')
      );
    });
  });
});
