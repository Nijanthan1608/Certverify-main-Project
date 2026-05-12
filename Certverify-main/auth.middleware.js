// Import jsonwebtoken to read and verify the secure tokens sent by users
const jwt = require('jsonwebtoken');
// Import the User model so we can look up users in the database
const User = require('../models/User.model');

// ── Verify JWT ────────────────────────────────────────────────────
// This middleware runs on routes that require the user to be logged in.
// It checks if they have a valid "badge" (token) to prove who they are.
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if the request contains an Authorization header that starts with 'Bearer '
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Extract just the token part (ignore the word "Bearer ")
      token = req.headers.authorization.split(' ')[1];
    }

    // If there's no token at all, stop them and ask them to log in
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    // Verify the token using our secret key. If it's tampered with or fake, this will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up the user by the ID safely stored inside the token payload
    const user = await User.findById(decoded.id);
    
    // If we can't find the user, or if their account has been deactivated, stop them here
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated' });
    }

    // Attach the found user object directly to the request (req) so the next functions don't have to look them up again
    req.user = user;
    
    // The user is valid! Proceed to the next step or actual route logic
    next();
  } catch (error) {
    // If the token is fake or malformed
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Access denied.' });
    }
    // If the token is too old (expired)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please log in again.' });
    }
    // Any other error
    res.status(500).json({ success: false, message: 'Auth error', error: error.message });
  }
};

// ── Require Admin Role ────────────────────────────────────────────
// This middleware stops anyone who isn't an admin. It should ONLY be used AFTER the `protect` middleware.
exports.requireAdmin = (req, res, next) => {
  // Check if req.user exists (set by `protect`) and if their role is distinctly 'admin'
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required. You do not have permission.' });
  }
  // They are an admin. Proceed.
  next();
};

// ── Optional Auth ──────────────────────────────────────────────────
// This function checks for a token. If it finds one, it attaches the user to the request.
// However, unlike `protect`, if there is NO token or the token is invalid, it DOES NOT stop the request.
// This is useful for routes that are public but might behave slightly differently if you happen to be logged in.
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      // Decode the token and find the user silently
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      // If user is valid, attach to req
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_) {
    // We intentionally do nothing on error, just let it fail silently and behave as a guest
  }
  
  // Always proceed, no matter what happened
  next();
};
