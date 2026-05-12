// Import express so we can create a new route handler
const express = require('express');
// Import a validation tool to check that user inputs are correct before they hit our database
const { body } = require('express-validator');

// Create a new router to handle all '/api/auth' requests
const router = express.Router();

// Import the logic (controllers) that will run when these routes are visited
const authController = require('../controllers/auth.controller');
// Import a middleware function to protect routes (users must be logged in to access them)
const { protect } = require('../middleware/auth.middleware');

// ── Validation Rules ──────────────────────────────────────────────
// Define what a valid "Register" request looks like
const registerValidation = [
  // Check that name is not empty and is between 2 and 100 characters long
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  // Check that the email is actually an email format
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  // Check that the password is at least 6 characters
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Define what a valid "Login" request looks like
const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'), // Cannot submit a blank password
];

// ── Routes ────────────────────────────────────────────────────────
// Public Routes (Anyone can access these)
// When a POST request is sent to '/register', first validate data, then run the register function
router.post('/register', registerValidation, authController.register);
// When a POST request is sent to '/login', validate data, then log the user in
router.post('/login', loginValidation, authController.login);

// Protected Routes (Only logged-in users with valid tokens can access these)
// The 'protect' middleware stops the request if the user is not logged in
router.get('/me', protect, authController.getMe); // Get the currently logged in user's profile info
router.put('/profile', protect, authController.updateProfile); // Update their profile details
router.put('/change-password', protect, authController.changePassword); // Change their password

// Export the router so it can be used in server.js
module.exports = router;
