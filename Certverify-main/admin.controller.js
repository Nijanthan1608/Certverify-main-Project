// Import XLSX library to handle reading data from uploaded Excel spreadsheets
const XLSX = require('xlsx');
// Import the Certificate model to add new data to the database
const Certificate = require('../models/Certificate.model');
// Import the User model to manage other users
const User = require('../models/User.model');

// ── Bulk Upload via Excel ─────────────────────────────────────────
// This function takes an uploaded Excel or CSV file, reads all the rows, and registers them as certificates.
exports.bulkUpload = async (req, res) => {
  try {
    // If there's no file attached to the request, send an error back
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read the file directly from memory into an Excel "workbook" object
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    // Get the first sheet in the Excel file
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert the data in the sheet into an array of Javascript objects
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    // Define "Alias" mappings: an admin might name the column "student_name" or just "name".
    // This makes sure our parser grabs the correct column data no matter what they named it (within reason).
    const ALIASES = {
      certificateId: ['certificate_id', 'cert_id', 'id', 'certificate id', 'certid', 'cert id', 'certificateid'],
      studentName: ['student_name', 'name', 'student', 'studentname', 'student name', 'full_name', 'fullname'],
      domain: ['domain', 'internship_domain', 'internship domain', 'field', 'area', 'subject'],
      institution: ['institution', 'college', 'university', 'school', 'organization', 'org'],
      startDate: ['start_date', 'start date', 'startdate', 'from', 'from_date', 'beginning'],
      endDate: ['end_date', 'end date', 'enddate', 'to', 'to_date', 'completion_date'],
      notes: ['notes', 'remarks', 'comment', 'comments', 'additional'],
    };

    // A helper function that searches a specific "row" for data matching our aliases
    const findValue = (row, field) => {
      // Get all the column names in this row and make them lowercase
      const rowKeys = Object.keys(row).map((k) => k.toLowerCase().trim());
      // Check each possible alias for the field we want
      for (const alias of ALIASES[field]) {
        const idx = rowKeys.indexOf(alias.toLowerCase());
        // If we find a matching column, grab its specific value
        if (idx !== -1) {
          const val = Object.values(row)[idx];
          return val !== null && val !== undefined ? String(val).trim() : '';
        }
      }
      return '';
    };

    // Helper function to safely read dates from the Excel data
    const parseDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val; // Already a clean Javascript Date
      if (typeof val === 'number') {
        // Handle weird Excel date serial numbers
        const d = XLSX.SSF.parse_date_code(val);
        if (d) return new Date(d.y, d.m - 1, d.d);
      }
      // Attempt standard text parsing
      const parsed = new Date(val);
      return isNaN(parsed) ? null : parsed;
    };

    // Give this entire upload event a specific internal batch ID
    const batchId = `BATCH-${Date.now()}`;
    const errors = []; // Records any missing data or bad rows
    const toInsert = []; // Data that is clean and ready to save to database
    const seen = new Set(); // Prevent duplicates within the file itself

    // Loop through every single row in the excel file
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is the header, and arrays start at 0

      // Extract all values cleanly
      const certId = findValue(row, 'certificateId').toUpperCase();
      const studentName = findValue(row, 'studentName');
      const domain = findValue(row, 'domain');
      const institution = findValue(row, 'institution');
      const startDate = parseDate(findValue(row, 'startDate'));
      const endDate = parseDate(findValue(row, 'endDate'));
      const notes = findValue(row, 'notes');

      // ── Data Validation ──
      // If data is missing or invalid, record an error and skip to the next row
      if (!certId) { errors.push({ row: rowNum, message: 'Missing Certificate ID' }); continue; }
      if (!studentName) { errors.push({ row: rowNum, message: `Row ${rowNum}: Missing student name` }); continue; }
      if (!domain) { errors.push({ row: rowNum, message: `Row ${rowNum}: Missing domain` }); continue; }
      if (!startDate) { errors.push({ row: rowNum, message: `Row ${rowNum}: Invalid start date` }); continue; }
      if (!endDate) { errors.push({ row: rowNum, message: `Row ${rowNum}: Invalid end date` }); continue; }
      if (endDate <= startDate) { errors.push({ row: rowNum, message: `Row ${rowNum}: End date must be after start date` }); continue; }
      if (seen.has(certId)) { errors.push({ row: rowNum, message: `Row ${rowNum}: Duplicate ID "${certId}" in file` }); continue; }
      
      seen.add(certId);

      // If it passes validation, stage it for insertion into DB
      toInsert.push({ certificateId: certId, studentName, domain, institution, startDate, endDate, notes, createdBy: req.user.id, uploadBatch: batchId });
    }

    // ── Database Insertion ──
    let added = 0;
    let skipped = 0;
    const dbErrors = [];

    // Save every valid staged record into the database
    for (const cert of toInsert) {
      try {
        // Make sure it doesn't already exist in the database from an older upload
        const exists = await Certificate.findOne({ certificateId: cert.certificateId });
        if (exists) { skipped++; continue; }
        
        await Certificate.create(cert);
        added++;
      } catch (err) {
        dbErrors.push({ id: cert.certificateId, message: err.message });
      }
    }

    // Return a summary report to the admin screen
    res.status(201).json({
      success: true,
      message: `Import complete`,
      summary: {
        total: rows.length,
        added,
        skipped,
        validationErrors: errors.length,
        dbErrors: dbErrors.length,
      },
      errors: [...errors, ...dbErrors].slice(0, 20), // Show up to 20 specific errors
      batchId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process file', error: error.message });
  }
};

// ── Get All Users (Admin Feature) ─────────────────────────────────
// Allows admins to view a list of everyone registered on the platform
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }); // Get all users, newest first
    res.json({ success: true, users: users.map((u) => u.toSafeObject()) }); // Strip passwords!
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Toggle User Active State ──────────────────────────────────────
// Allows admins to ban/unban or grant access to users
exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Security: Prevents an admin from accidentally banning themselves
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Flip the user's active state
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Dashboard Stats ───────────────────────────────────────────────
// Gathers metric data used to render the charts on the admin panel
exports.getDashboardStats = async (req, res) => {
  try {
    // Run several database queries concurrently for speed
    const [totalCerts, totalUsers, domains, recentActivity] = await Promise.all([
      Certificate.countDocuments({ isActive: true }), // Total active certificates
      User.countDocuments({ isActive: true }), // Total active users
      Certificate.distinct('domain', { isActive: true }), // List of unique categories/fields
      Certificate.find({ isActive: true }).sort({ createdAt: -1 }).limit(10).select('certificateId studentName domain createdAt'), // The 10 most recent uploads
    ]);

    // Aggregate monthly data (e.g. how many certs were generated each month for the last 6 months)
    const monthlyData = await Certificate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      stats: {
        totalCertificates: totalCerts,
        totalUsers,
        totalDomains: domains.length,
        recentActivity,
        monthlyData: monthlyData.reverse(), // Reverse to show chronological order
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
