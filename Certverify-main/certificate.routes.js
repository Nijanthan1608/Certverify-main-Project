// Import express routing capabilities
const express = require('express');
// Import the express-validator to ensure users submit valid certificate data
const { body } = require('express-validator');

// Create the router object
const router = express.Router();

// Import functions that tell the server what to do for each endpoint
const certController = require('../controllers/certificate.controller');
// Import our security functions to verify users and admin status
const { protect, requireAdmin } = require('../middleware/auth.middleware');

// ── Validation Rules ──────────────────────────────────────────────
// Before an admin creates a certificate, make sure the data is structured correctly
const certValidation = [
  // ID must be present and only contain normal characters/hyphens
  body('certificateId').trim().notEmpty().withMessage('Certificate ID is required')
    .matches(/^[A-Za-z0-9\-_]+$/).withMessage('Certificate ID can only contain letters, numbers, hyphens, and underscores'),
  // Must have a student name
  body('studentName').trim().notEmpty().withMessage('Student name is required'),
  // Must declare a domain/field
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  // Check that the dates are correctly formatted
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
];

// ── Public Routes (Anyone can visit these) ──────────────────────
// This is the core route! Anyone with a certificate ID can use this to grab its details and verify it.
router.get('/verify/:id', certController.verifyCertificate);
// Public-facing statistics (e.g. "Over 10,000 Certificates Verified")
router.get('/stats', certController.getStats);

// ── Protected Admin Routes (Only Admins) ────────────────────────
// View a list of ALL certificates in the database (with pagination/search)
router.get('/', protect, requireAdmin, certController.getAllCertificates);

// Create a SINGLE new certificate
router.post('/', protect, requireAdmin, certValidation, certController.createCertificate);

// Edit an existing certificate (identified by its MongoDB _id)
router.put('/:id', protect, requireAdmin, certController.updateCertificate);

// Completely delete a certificate from the database
router.delete('/:id', protect, requireAdmin, certController.deleteCertificate);

// Export router
module.exports = router;
