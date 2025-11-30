const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');

// Advanced job search with filters
exports.searchJobs = async (req, res) => {
  try {
    const {
      search,
      jobType,
      jobCategory,
      companyTier,
      minPackage,
      maxPackage,
      location,
      industry,
      skills,
      branch,
      minCGPA,
      maxBacklogs,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = { 
      collegeId: req.user.college,
      status: 'active'
    };
    
    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'skills.required': { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filters
    if (jobType) query.jobType = jobType;
    if (jobCategory) query.jobCategory = jobCategory;
    if (companyTier) query['company.tier'] = companyTier;
    if (industry) query['company.industry'] = industry;
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    
    // Package range
    if (minPackage || maxPackage) {
      query['package.base'] = {};
      if (minPackage) query['package.base'].$gte = parseFloat(minPackage);
      if (maxPackage) query['package.base'].$lte = parseFloat(maxPackage);
    }
    
    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query['skills.required'] = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }
    
    // Eligibility filters
    if (branch) {
      query.$or = [
        { 'eligibilityCriteria.branches': { $in: [branch] } },
        { 'eligibilityCriteria.branches': { $size: 0 } },
        { 'eligibilityCriteria.branches': { $exists: false } }
      ];
    }
    
    if (minCGPA) {
      query.$or = [
        { 'eligibilityCriteria.minCGPA': { $lte: parseFloat(minCGPA) } },
        { 'eligibilityCriteria.minCGPA': { $exists: false } }
      ];
    }
    
    if (maxBacklogs !== undefined) {
      query.$or = [
        { 'eligibilityCriteria.maxBacklogs': { $gte: parseInt(maxBacklogs) } },
        { 'eligibilityCriteria.maxBacklogs': { $exists: false } }
      ];
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobs = await Job.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Job.countDocuments(query);
    
    // Check if user has applied
    if (req.user.role === 'student') {
      const studentApplications = await Application.find({
        studentId: req.user._id,
        jobId: { $in: jobs.map(j => j._id) }
      }).select('jobId status');
      
      const applicationMap = {};
      studentApplications.forEach(app => {
        applicationMap[app.jobId.toString()] = app.status;
      });
      
      jobs.forEach(job => {
        job._doc.hasApplied = !!applicationMap[job._id.toString()];
        job._doc.applicationStatus = applicationMap[job._id.toString()] || null;
      });
    }
    
    res.json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recommended jobs for student
exports.getRecommendedJobs = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for students'
      });
    }
    
    const student = req.user;
    const studentData = await require('../models/StudentData').findOne({ userId: student._id });
    
    const query = {
      collegeId: req.user.college,
      status: 'active',
      $or: [
        { 'eligibilityCriteria.branches': { $in: [student.branch] } },
        { 'eligibilityCriteria.branches': { $size: 0 } }
      ]
    };
    
    // Filter by CGPA
    if (student.cgpa) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'eligibilityCriteria.minCGPA': { $lte: student.cgpa } },
          { 'eligibilityCriteria.minCGPA': { $exists: false } }
        ]
      });
    }
    
    // Filter by backlogs
    if (student.currentBacklogs !== undefined) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'eligibilityCriteria.maxBacklogs': { $gte: student.currentBacklogs } },
          { 'eligibilityCriteria.maxBacklogs': { $exists: false } }
        ]
      });
    }
    
    let jobs = await Job.find(query).sort({ createdAt: -1 }).limit(20);
    
    // Score jobs based on student skills if available
    if (studentData && studentData.skills && studentData.skills.length > 0) {
      const studentSkills = studentData.skills.map(s => s.name.toLowerCase());
      
      jobs = jobs.map(job => {
        let score = 0;
        
        // Match required skills
        if (job.skills && job.skills.required) {
          const matchedSkills = job.skills.required.filter(skill => 
            studentSkills.includes(skill.toLowerCase())
          );
          score += matchedSkills.length * 10;
        }
        
        // Match preferred skills
        if (job.skills && job.skills.preferred) {
          const matchedSkills = job.skills.preferred.filter(skill => 
            studentSkills.includes(skill.toLowerCase())
          );
          score += matchedSkills.length * 5;
        }
        
        // Boost for higher packages
        if (job.package && job.package.base) {
          score += job.package.base / 2;
        }
        
        return {
          ...job.toObject(),
          matchScore: score
        };
      });
      
      // Sort by match score
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    // Check application status
    const studentApplications = await Application.find({
      studentId: req.user._id,
      jobId: { $in: jobs.map(j => j._id) }
    }).select('jobId status');
    
    const applicationMap = {};
    studentApplications.forEach(app => {
      applicationMap[app.jobId.toString()] = app.status;
    });
    
    jobs.forEach(job => {
      job.hasApplied = !!applicationMap[job._id.toString()];
      job.applicationStatus = applicationMap[job._id.toString()] || null;
    });
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get job filters metadata
exports.getJobFilters = async (req, res) => {
  try {
    const jobs = await Job.find({
      collegeId: req.user.college,
      status: 'active'
    });
    
    const filters = {
      jobTypes: [...new Set(jobs.map(j => j.jobType))],
      jobCategories: [...new Set(jobs.map(j => j.jobCategory))],
      companyTiers: [...new Set(jobs.map(j => j.company?.tier).filter(Boolean))],
      industries: [...new Set(jobs.map(j => j.company?.industry).filter(Boolean))],
      locations: [...new Set(jobs.map(j => j.location?.city).filter(Boolean))],
      packageRange: {
        min: Math.min(...jobs.map(j => j.package?.base || 0)),
        max: Math.max(...jobs.map(j => j.package?.base || 0))
      },
      skills: [...new Set(jobs.flatMap(j => [...(j.skills?.required || []), ...(j.skills?.preferred || [])]))].slice(0, 50)
    };
    
    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Module exports are defined inline using exports.functionName
