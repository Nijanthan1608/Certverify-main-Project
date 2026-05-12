// Import multer, a package specifically designed to handle file uploads
const multer = require('multer');

// ── Global Error Handler ──────────────────────────────────────────
// This function acts as a safety net. If ANY route throws an error, Express catches it and forwards it here.
exports.errorHandler = (err, req, res, next) => {
  // Default to a 500 status (Internal Server Error) if no specific status code was provided
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Validation Errors (e.g. user didn't provide a required field)
  if (err.name === 'ValidationError') {
    statusCode = 400; // 400 means "Bad Request" from the client
    // Extract all the specific validation error messages into a single cleanly formatted string
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Handle MongoDB Duplicate Key Error (e.g. trying to register an email or certificate ID that already exists)
  if (err.code === 11000) {
    statusCode = 409; // 409 means "Conflict"
    // Identify exactly which field caused the duplicate collision
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}. This must be unique.`;
  }

  // Handle Mongoose Cast Error (e.g. someone searching by an ID that isn't formatted like a real MongoDB ID)
  if (err.name === 'CastError') {
    statusCode = 400; // 400 Bad Request
    message = `Invalid ${err.path}: ${err.value}. Please provide a properly formatted identifier.`;
  }

  // If we are developing locally, print the full error to the terminal so we can debug it
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Trace:', err);
  }

  // Finally, send the formatted error response back to the client/frontend
  res.status(statusCode).json({
    success: false,
    message,
    // Only send the raw, ugly stack trace if we are developing locally (hides it in production for security)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ── 404 Handler ───────────────────────────────────────────────────
// If a user tries to access a route that doesn't exist (like /api/nonexistent), send a 404 response
exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on this server.` });
};

// ── Multer Config (File Uploading) ────────────────────────────────
// Configure multer to store uploaded files in RAM (memory storage) instead of saving them permanently to the server's hard drive.
// This is perfect for parsing Excel files because we just need to read them once and then we can throw them away.
const storage = multer.memoryStorage();

// A filter function to ensure users only upload the file types we want
const fileFilter = (req, file, cb) => {
  // Define a list of acceptable raw mime types (Excel files and CSV files)
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv 
  ];
  
  // If the uploaded file matches our allowed mime types OR ends with a valid extension
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file and throw an error
    cb(new Error('Invalid file type! Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
  }
};

// Export the ready-to-use upload middleware. Other files can plug this directly into their routes to accept files.
exports.upload = multer({
  storage, // Use memory storage
  fileFilter, // Apply our specific file type filter
  // Set a strict file size limit (default 10MB) to prevent users from crashing our server with huge files
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});
