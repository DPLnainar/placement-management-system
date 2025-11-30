const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');

// Create company
exports.createCompany = async (req, res) => {
  try {
    const companyData = {
      ...req.body,
      college: req.user.college,
      createdBy: req.user._id
    };
    
    // If portal access is enabled, hash password
    if (companyData.portalAccess && companyData.portalAccess.enabled && companyData.portalAccess.password) {
      const salt = await bcrypt.genSalt(10);
      companyData.portalAccess.password = await bcrypt.hash(companyData.portalAccess.password, salt);
    }
    
    const company = new Company(companyData);
    await company.save();
    
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const { status, tier, industry, search } = req.query;
    
    const query = { college: req.user.college };
    
    if (status) query.status = status;
    if (tier) query.tier = tier;
    if (industry) query.industry = industry;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const companies = await Company.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      college: req.user.college
    })
      .populate('createdBy', 'name email')
      .populate('reviews.student', 'name rollNumber');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Get company's job statistics
    const jobs = await Job.find({
      collegeId: req.user.college,
      'company.name': company.name
    });
    
    const applications = await Application.find({
      jobId: { $in: jobs.map(j => j._id) }
    });
    
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: applications.length,
      selectedStudents: applications.filter(a => ['selected', 'offered', 'offer_accepted'].includes(a.status)).length
    };
    
    res.json({
      success: true,
      data: {
        ...company.toObject(),
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // If updating password, hash it
    if (req.body.portalAccess && req.body.portalAccess.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.portalAccess.password = await bcrypt.hash(req.body.portalAccess.password, salt);
    }
    
    Object.assign(company, req.body);
    company.lastModifiedBy = req.user._id;
    
    await company.save();
    
    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndDelete({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company dashboard (for company portal)
exports.getCompanyDashboard = async (req, res) => {
  try {
    // Assuming company is authenticated via portal
    const company = await Company.findById(req.company._id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Get company's jobs
    const jobs = await Job.find({
      collegeId: company.college,
      'company.name': company.name
    }).sort({ createdAt: -1 });
    
    // Get applications for these jobs
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({
      jobId: { $in: jobIds }
    })
      .populate('studentId', 'name email rollNumber branch year cgpa')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 });
    
    const dashboard = {
      company: {
        name: company.name,
        logo: company.logo,
        tier: company.tier
      },
      stats: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        selected: applications.filter(a => ['selected', 'offered', 'offer_accepted'].includes(a.status)).length
      },
      recentJobs: jobs.slice(0, 5),
      recentApplications: applications.slice(0, 10)
    };
    
    // Update last visit
    company.stats.lastVisitDate = new Date();
    await company.save();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add review to company
exports.addCompanyReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const { companyId } = req.params;
    
    const company = await Company.findOne({
      _id: companyId,
      college: req.user.college
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check if student has already reviewed
    const existingReview = company.reviews.find(
      r => r.student && r.student.toString() === req.user._id.toString()
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this company'
      });
    }
    
    await company.addReview(req.user._id, rating, review);
    
    res.json({
      success: true,
      message: 'Review added successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get company statistics
exports.getCompanyStatistics = async (req, res) => {
  try {
    const companies = await Company.find({
      college: req.user.college,
      status: 'active'
    });
    
    const stats = {
      totalCompanies: companies.length,
      tierBreakdown: {
        super_dream: companies.filter(c => c.tier === 'super_dream').length,
        dream: companies.filter(c => c.tier === 'dream').length,
        normal: companies.filter(c => c.tier === 'normal').length
      },
      industryBreakdown: {},
      companiesWithPortalAccess: companies.filter(c => c.portalAccess && c.portalAccess.enabled).length,
      topRatedCompanies: companies
        .filter(c => c.rating.reviewCount > 0)
        .sort((a, b) => b.rating.overall - a.rating.overall)
        .slice(0, 10)
        .map(c => ({
          name: c.name,
          rating: c.rating.overall,
          reviewCount: c.rating.reviewCount
        }))
    };
    
    // Industry breakdown
    companies.forEach(c => {
      if (c.industry) {
        stats.industryBreakdown[c.industry] = (stats.industryBreakdown[c.industry] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Module exports are defined inline using exports.functionName
