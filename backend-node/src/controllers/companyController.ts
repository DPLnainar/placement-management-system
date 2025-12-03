import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { IAuthRequest, IApiResponse } from '../types/index';
import { Company, Job, Application } from '../models/index';

/**
 * Create a new company
 */
export const createCompany = async (req: IAuthRequest, res: Response<IApiResponse<any>>): Promise<void> => {
  try {
    const companyData = {
      ...req.body,
      college: req.user?.collegeId,
      createdBy: req.user?._id,
    };

    // Hash password if portal access is enabled
    if (
      companyData.portalAccess &&
      companyData.portalAccess.enabled &&
      companyData.portalAccess.password
    ) {
      const salt = await bcrypt.genSalt(10);
      companyData.portalAccess.password = await bcrypt.hash(companyData.portalAccess.password, salt);
    }

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all companies with optional filtering
 */
export const getCompanies = async (req: IAuthRequest, res: Response<IApiResponse<any>>): Promise<void> => {
  try {
    const { status, tier, industry, search } = req.query;

    const query: any = { college: req.user?.collegeId };

    if (status) query.status = status;
    if (tier) query.tier = tier;
    if (industry) query.industry = industry;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const companies = await Company.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      message: 'Companies retrieved successfully',
      count: companies.length,
      data: companies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get company by ID with statistics
 */
export const getCompanyById = async (req: IAuthRequest, res: Response<IApiResponse<any>>): Promise<void> => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      college: req.user?.collegeId,
    })
      .populate('createdBy', 'name email')
      .populate('reviews.student', 'name rollNumber');

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found',
      });
      return;
    }

    // Get company's job statistics
    const jobs = await Job.find({
      collegeId: req.user?.collegeId,
      company: company._id,
    });

    const applications = await Application.find({
      jobId: { $in: jobs.map((j) => j._id) },
    });

    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'active').length,
      totalApplications: applications.length,
      selectedStudents: applications.filter((a) =>
        ['selected', 'offered', 'offer_accepted'].includes(a.status)
      ).length,
    };

    res.json({
      success: true,
      message: 'Company details retrieved successfully',
      data: {
        ...company.toObject(),
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update company information
 */
export const updateCompany = async (req: IAuthRequest, res: Response<IApiResponse<any>>): Promise<void> => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      college: req.user?.collegeId,
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found',
      });
      return;
    }

    // Hash password if provided
    if (req.body.portalAccess && req.body.portalAccess.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.portalAccess.password = await bcrypt.hash(req.body.portalAccess.password, salt);
    }

    Object.assign(company, req.body);
    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete company
 */
export const deleteCompany = async (req: IAuthRequest, res: Response<IApiResponse<any>>): Promise<void> => {
  try {
    const company = await Company.findOneAndDelete({
      _id: req.params.id,
      college: req.user?.collegeId,
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get company statistics
 */
export const getCompanyStatistics = async (
  req: IAuthRequest,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const companies = await Company.find({
      college: req.user?.collegeId,
      status: 'active',
    });

    const stats: any = {
      totalCompanies: companies.length,
      tierBreakdown: {
        super_dream: companies.filter((c) => c.tier === 'super_dream').length,
        dream: companies.filter((c) => c.tier === 'dream').length,
        normal: companies.filter((c) => c.tier === 'normal').length,
      },
      industryBreakdown: {},
      companiesWithPortalAccess: companies.filter((c) => c.portalAccess?.enabled).length,
      topRatedCompanies: companies
        .filter((c) => c.rating.reviewCount > 0)
        .sort((a, b) => b.rating.overall - a.rating.overall)
        .slice(0, 10)
        .map((c) => ({
          name: c.name,
          rating: c.rating.overall,
          reviewCount: c.rating.reviewCount,
        })),
    };

    // Industry breakdown
    companies.forEach((c) => {
      if (c.industry) {
        stats.industryBreakdown[c.industry] = (stats.industryBreakdown[c.industry] || 0) + 1;
      }
    });

    res.json({
      success: true,
      message: 'Company statistics retrieved successfully',
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
