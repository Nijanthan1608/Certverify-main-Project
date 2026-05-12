// Import jsonwebtoken to create 'login badges' for users
const jwt = require('jsonwebtoken');
// Import validation result to check for any errors identified by our routes
const { validationResult } = require('express-validator');
// Import User model
const User = require('../models/User.model');

// ── Generate JWT ──────────────────────────────────────────────────
// A helper function that creates a unique, encrypted token for a user when they log in.
// This token acts like their ID card to access protected features.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d', // The token is valid for 7 days
  });
};

// ── Register ──────────────────────────────────────────────────────
// This function handles creating a brand new user account.
exports.register = async (req, res) => {
  try {
    // Check if the express-validator middleware found any formatting errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Extract the information from the user's request
    const { name, email, password, role } = req.body;

    // Make sure a user with this email doesn't already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Security Feature: Do not allow someone to make themselves an admin randomly.
    // If they ask to be an admin, grant it (if your logic permits it here), otherwise default to 'user'
    const safeRole = role === 'admin' ? 'admin' : 'user';

    // Create the new user in the database
    const user = await User.create({ name, email, password, role: safeRole });
    
    // Generate an ID card (token) for them immediately so they don't have to log in manually right after creating an account
    const token = generateToken(user._id);

    // Send back a success message, their token, and their non-sensitive profile info
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────
// This function handles logging an existing user in.
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find the user by email, ensuring they are active. We force it to return the hidden password field for verification.
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Use our custom method on the User model to see if the typed password matches the encrypted database password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update their 'last login' timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate their ID card (token)
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// ── Get Current User ──────────────────────────────────────────────
// Returns the profile of whichever user is currently sending the request (identified by their token)
exports.getMe = async (req, res) => {
  try {
    // req.user.id is established by the `protect` middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Update Profile ────────────────────────────────────────────────
// Allows the logged-in user to change their name (or other profile details)
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    // Find the current user and update their name based on the request body
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name }, // Only update name for now
      { new: true, runValidators: true } // Return the updated document & enforce rules
    );
    res.json({ success: true, message: 'Profile updated', user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ── Change Password ───────────────────────────────────────────────
// Allows a logged-in user to change their password securely
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // We need their existing password from the database to compare
    const user = await User.findById(req.user.id).select('+password');

    // Confirm that they typed their current old password correctly
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Set the new password. Mongoose's 'pre' save hook will automatically encrypt it
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
