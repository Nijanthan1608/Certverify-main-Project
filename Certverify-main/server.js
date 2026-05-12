// Import the express framework to build our web server
const express = require('express');
// Import mongoose to interact with our MongoDB database
const mongoose = require('mongoose');
// Import cors to allow our frontend to make requests to our backend (Cross-Origin Resource Sharing)
const cors = require('cors');
// Import helmet for security, it sets various HTTP headers to protect the app
const helmet = require('helmet');
// Import morgan to log HTTP requests in the console for debugging
const morgan = require('morgan');
// Import rateLimit to prevent abuse by limiting how many requests a user can make
const rateLimit = require('express-rate-limit');
// Import path to handle file paths easily
const path = require('path');
// Import our database connection function
const connectDB = require('./config/database');

// Load environment variables from the .env file so we can access them securely
require('dotenv').config();

// Import our custom route handlers for authentication, certificates, and admin actions
const authRoutes = require('./routes/auth.routes');
const certificateRoutes = require('./routes/certificate.routes');
const adminRoutes = require('./routes/admin.routes');
// Import our custom error handling middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Initialize the Express application
const app = express();

// ── Security Middleware ──────────────────────────────────────────
// Use helmet to secure HTTP headers
app.use(helmet());
// Use cors to allow requests from our frontend application
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow only the frontend URL
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers in requests
}));

// ── Rate Limiting ────────────────────────────────────────────────
// Create a general rate limiter to prevent spam requests (max 100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
// Create a stricter rate limiter specifically for authentication routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts from this IP, please try again later.' },
});

// Apply the general limiter to all API routes
app.use('/api/', limiter);
// Apply the strict limiter to all authentication routes
app.use('/api/auth', authLimiter);

// ── Body Parsing ─────────────────────────────────────────────────
// Parse incoming JSON data from request bodies (with a 10MB limit for large payloads like file uploads)
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded data (data sent from HTML forms)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────────
// If we are running in development mode, use morgan to log requests to the console
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static Files ─────────────────────────────────────────────────
// Serve the 'uploads' directory as a static folder, making uploaded files accessible via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────────────
// Mount the authentication routes at /api/auth
app.use('/api/auth', authRoutes);
// Mount the certificate routes at /api/certificates
app.use('/api/certificates', certificateRoutes);
// Mount the admin routes at /api/admin
app.use('/api/admin', adminRoutes);

// ── Health Check ─────────────────────────────────────────────────
// Provide a simple endpoint to check if the server is running correctly
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CertVerify API is running smoothly',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve Frontend in Production ─────────────────────────────────
// If we are in production, serve the built React application
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  // For any route that isn't an API route, send back the React index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// ── Error Handlers ───────────────────────────────────────────────
// If a route is requested that doesn't exist, use the 'notFound' middleware
app.use(notFound);
// If an error is thrown anywhere in the app, use the 'errorHandler' middleware to catch it and send a formatted response
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
// Define the port our server will run on
const PORT = process.env.PORT || 5000;

// Function to start our application
const startServer = async () => {
  // First, connect to the database using the function imported from config/database.js
  await connectDB();
  
  // Once the database is connected, start listening for incoming HTTP requests on the defined port
  app.listen(PORT, () => {
    console.log(`🚀 CertVerify server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

// Execute the function to start the app
startServer();

// Export the app to be used by tests or other modules if needed
module.exports = app;
