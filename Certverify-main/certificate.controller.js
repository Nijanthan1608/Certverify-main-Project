// Express validator helps us ensure no one sends bad/incomplete requests
const { validationResult } = require('express-validator');
// Link to our Database Model for certificates
const Certificate = require('../models/Certificate.model');

// ── Verify / Search by ID (public) ───────────────────────────────
// This is the core functionality of the whole app! Allows anyone to verify if a certificate is real by entering its ID
exports.verifyCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Look for a specific certificate that matches the ID perfectly and is currently marked as "active/valid"
    const cert = await Certificate.findOne({
      certificateId: id.toUpperCase(), // IDs are stored in uppercase
      isActive: true, // If it's false, the certificate was revoked!
    }).populate('createdBy', 'name'); // Also pull in the name of the admin who created it

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: `No active certificate found with ID "${id}"`,
      });
    }

    // Since someone is looking at it, add +1 to the 'times verified' tracker
    cert.verificationCount += 1;
    cert.lastVerifiedAt = new Date();
    await cert.save({ validateBeforeSave: false }); // Save this new tracking info

    // Send back all the certificate details to the person verifying it
    res.json({
      success: true,
      message: 'Certificate verified successfully',
      certificate: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        domain: cert.domain,
        institution: cert.institution,
        startDate: cert.startDate,
        endDate: cert.endDate,
        durationFormatted: cert.durationFormatted, // Example: "2 months, 5 days"
        durationDays: cert.durationDays,
        notes: cert.notes,
        issuedAt: cert.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Get All (admin paginated) ─────────────────────────────────────
// Allows an admin to view the whole database of certificates, with search & pages
exports.getAllCertificates = async (req, res) => {
  try {
    // Pagination: Set defaults (page 1, 20 items per page)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || ''; // User's search text
    const domain = req.query.domain || ''; // Filter by category
    const skip = (page - 1) * limit; // Math to figure out how many database items to skip based on page #

    const filter = { isActive: true }; // Only show valid certs
    
    // If they typed something in the search bar, search by ID, name, domain, OR institution using regex text matching
    if (search) {
      filter.$or = [
        { certificateId: { $regex: search, $options: 'i' } }, // 'i' means case-insensitive
        { studentName: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } },
      ];
    }
    // Specific dropdown filter for domain
    if (domain) filter.domain = { $regex: domain, $options: 'i' };

    // Ask database for the matching certificates AND the total count of how many exist
    const [certs, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ createdAt: -1 }) // Sort newest first
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name'),
      Certificate.countDocuments(filter),
    ]);

    // Send the data AND the calculated page tracking math back to the frontend
    res.json({
      success: true,
      data: certs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Create Single ─────────────────────────────────────────────────
// Allows an admin to manually type in details and create one single certificate (no excel)
exports.createCertificate = async (req, res) => {
  try {
    // Stop if user left required fields blank
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { certificateId, studentName, domain, institution, startDate, endDate, notes } = req.body;

    // Check if ID is already claimed
    const existing = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A certificate with this ID already exists' });
    }

    // Save it to MongoDB
    const cert = await Certificate.create({
      certificateId,
      studentName,
      domain,
      institution: institution || '',
      startDate,
      endDate,
      notes: notes || '',
      createdBy: req.user.id, // Log who made this
    });

    res.status(201).json({ success: true, message: 'Certificate created', certificate: cert });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Certificate ID already exists in DB' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Update ────────────────────────────────────────────────────────
// Allows an admin to edit a typo on a certificate
exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Safety lock: You are NEVER allowed to change the unique Certificate ID. 
    delete updates.certificateId;

    // Find it and apply the requested changes
    const cert = await Certificate.findOneAndUpdate(
      { certificateId: id.toUpperCase() },
      updates,
      { new: true, runValidators: true } // 'new' means it gives us back the modified version, not the old version
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate updated', certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Delete (soft) ─────────────────────────────────────────────────
// Allows an admin to revoke/delete a certificate
// Note: We do a "soft delete". We don't erase it from the hard drive, we just set "isActive: false" so it stops working
exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOneAndUpdate(
      { certificateId: id.toUpperCase() },
      { isActive: false }, // Soft delete it
      { new: true }
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate successfully revoked/deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Get Stats (public) ─────────────────────────────────────────────
// Returns limited statistical data that anyone visiting the homepage can see
exports.getStats = async (req, res) => {
  try {
    const [total, domains, recentCerts] = await Promise.all([
      Certificate.countDocuments({ isActive: true }), // Number of real certificates
      Certificate.distinct('domain', { isActive: true }), // Which topics exist
      Certificate.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('certificateId studentName domain createdAt'), // Just the 5 newest
    ]);

    // Figure out how many certificates belong to each domain specifically
    const domainBreakdown = await Certificate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, // Largest groups first
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        totalCertificates: total,
        totalDomains: domains.length,
        recentCertificates: recentCerts,
        domainBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
