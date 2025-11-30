const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const StudentData = require('../models/StudentData');
const Company = require('../models/Company');
const json2csv = require('json2csv').parse;
const XLSX = require('xlsx');

// Export students data
exports.exportStudents = async (req, res) => {
  try {
    const { format = 'csv', branch, year, isPlaced } = req.query;
    
    const query = {
      collegeId: req.user.college,
      role: 'student'
    };
    
    if (branch) query.branch = branch;
    if (year) query.year = parseInt(year);
    if (isPlaced !== undefined) query.isPlaced = isPlaced === 'true';
    
    const students = await User.find(query)
      .select('name email rollNumber branch year cgpa currentBacklogs isPlaced placedCompany placedCTC')
      .lean();
    
    // Get student data
    const studentIds = students.map(s => s._id);
    const studentDataRecords = await StudentData.find({
      userId: { $in: studentIds }
    }).select('userId education skills experience').lean();
    
    const studentDataMap = {};
    studentDataRecords.forEach(sd => {
      studentDataMap[sd.userId.toString()] = sd;
    });
    
    // Combine data
    const exportData = students.map(student => {
      const sd = studentDataMap[student._id.toString()] || {};
      return {
        'Name': student.name,
        'Email': student.email,
        'Roll Number': student.rollNumber,
        'Branch': student.branch,
        'Year': student.year,
        'CGPA': student.cgpa || 'N/A',
        'Backlogs': student.currentBacklogs || 0,
        'Placed': student.isPlaced ? 'Yes' : 'No',
        'Company': student.placedCompany || 'N/A',
        'CTC': student.placedCTC ? `${student.placedCTC} LPA` : 'N/A',
        'Skills': sd.skills ? sd.skills.map(s => s.name).join(', ') : 'N/A',
        'Experience': sd.experience ? `${sd.experience.length} positions` : '0'
      };
    });
    
    if (format === 'csv') {
      const csv = json2csv(exportData);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=students.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename=students.xlsx');
      return res.send(excelBuffer);
    } else {
      return res.json({
        success: true,
        count: exportData.length,
        data: exportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export applications data
exports.exportApplications = async (req, res) => {
  try {
    const { format = 'csv', jobId, status } = req.query;
    
    const query = { collegeId: req.user.college };
    
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    
    const applications = await Application.find(query)
      .populate('studentId', 'name email rollNumber branch year cgpa')
      .populate('jobId', 'title company')
      .lean();
    
    const exportData = applications.map(app => ({
      'Student Name': app.studentId?.name || 'N/A',
      'Roll Number': app.studentId?.rollNumber || 'N/A',
      'Branch': app.studentId?.branch || 'N/A',
      'Year': app.studentId?.year || 'N/A',
      'CGPA': app.studentId?.cgpa || 'N/A',
      'Job Title': app.jobId?.title || 'N/A',
      'Company': app.jobId?.company?.name || 'N/A',
      'Status': app.status,
      'Applied Date': new Date(app.appliedAt).toLocaleDateString(),
      'Current Round': app.currentRound || 'N/A',
      'Offered CTC': app.selectionDetails?.offeredCTC ? `${app.selectionDetails.offeredCTC} LPA` : 'N/A'
    }));
    
    if (format === 'csv') {
      const csv = json2csv(exportData);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=applications.csv');
      return res.send(csv);
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename=applications.xlsx');
      return res.send(excelBuffer);
    } else {
      return res.json({
        success: true,
        count: exportData.length,
        data: exportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Import students from CSV/Excel
exports.importStudents = async (req, res) => {
  try {
    const { students } = req.body; // Array of student objects
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Students array is required'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const studentData of students) {
      try {
        // Check if student already exists
        const existingStudent = await User.findOne({
          collegeId: req.user.college,
          $or: [
            { email: studentData.email },
            { rollNumber: studentData.rollNumber }
          ]
        });
        
        if (existingStudent) {
          results.failed.push({
            data: studentData,
            reason: 'Student already exists'
          });
          continue;
        }
        
        // Create student
        const student = new User({
          ...studentData,
          collegeId: req.user.college,
          role: 'student',
          password: studentData.password || 'defaultPassword123', // Should be changed on first login
          isApproved: true
        });
        
        await student.save();
        
        results.success.push({
          email: student.email,
          rollNumber: student.rollNumber
        });
      } catch (error) {
        results.failed.push({
          data: studentData,
          reason: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${results.success.length} students successfully, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate placement report
exports.generatePlacementReport = async (req, res) => {
  try {
    const { year, format = 'pdf' } = req.query;
    
    // Get placement statistics
    const query = { collegeId: req.user.college };
    if (year) query.year = parseInt(year);
    
    const totalStudents = await User.countDocuments({ ...query, role: 'student' });
    const placedStudents = await User.countDocuments({ ...query, role: 'student', isPlaced: true });
    
    const students = await User.find({ ...query, role: 'student', isPlaced: true })
      .select('name branch placedCompany placedCTC')
      .lean();
    
    const packageData = students.map(s => s.placedCTC).filter(Boolean);
    const avgPackage = packageData.length > 0 ? packageData.reduce((a, b) => a + b, 0) / packageData.length : 0;
    const highestPackage = packageData.length > 0 ? Math.max(...packageData) : 0;
    
    // Branch-wise breakdown
    const branchWise = {};
    students.forEach(s => {
      if (!branchWise[s.branch]) {
        branchWise[s.branch] = { total: 0, placed: 0, packages: [] };
      }
      branchWise[s.branch].placed++;
      if (s.placedCTC) branchWise[s.branch].packages.push(s.placedCTC);
    });
    
    // Get total by branch
    const branches = Object.keys(branchWise);
    for (const branch of branches) {
      const total = await User.countDocuments({ ...query, role: 'student', branch });
      branchWise[branch].total = total;
      branchWise[branch].percentage = Math.round((branchWise[branch].placed / total) * 100);
      branchWise[branch].avgPackage = branchWise[branch].packages.length > 0 ?
        Math.round((branchWise[branch].packages.reduce((a, b) => a + b, 0) / branchWise[branch].packages.length) * 100) / 100 : 0;
    }
    
    const reportData = {
      generatedOn: new Date().toISOString(),
      year: year || 'All Years',
      summary: {
        totalStudents,
        placedStudents,
        placementPercentage: Math.round((placedStudents / totalStudents) * 100),
        averagePackage: Math.round(avgPackage * 100) / 100,
        highestPackage
      },
      branchWise,
      topRecruiters: students.reduce((acc, s) => {
        if (s.placedCompany) {
          acc[s.placedCompany] = (acc[s.placedCompany] || 0) + 1;
        }
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Module exports are defined inline using exports.functionName
