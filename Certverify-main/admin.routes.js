// Import express to define routing
const express = require('express');
const router = express.Router();

// Import the logic functions that admin requests will trigger
const adminController = require('../controllers/admin.controller');
// Import security middleware: 'protect' checks if user is logged in, 'requireAdmin' checks if they are an admin
const { protect, requireAdmin } = require('../middleware/auth.middleware');
// Import multer middleware to handle file uploads
const { upload } = require('../middleware/error.middleware');

// ── Security Blanket ──────────────────────────────────────────────
// This line applies BOTH the protect and requireAdmin middlewares to ALL routes below this point.
// None of these routes can be accessed by a regular user or anonymous visitor.
router.use(protect, requireAdmin);

// ── Admin Protected Routes ────────────────────────────────────────
// Upload an excel/csv file for bulk certificate creation
// 'upload.single("file")' waits for an incoming file named 'file' and saves it to disk before calling the controller
router.post('/upload', upload.single('file'), adminController.bulkUpload);

// Fetch a list of all registered users (for user management)
router.get('/users', adminController.getAllUsers);

// Enable or disable a user account
router.patch('/users/:id/toggle', adminController.toggleUser);

// Fetch statistics (e.g. total certificates, latest uploads) for the admin dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Export router to be mounted in server.js at /api/admin
module.exports = router;
