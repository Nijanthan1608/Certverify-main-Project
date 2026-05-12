// Import mongoose, a library for communicating with our MongoDB database
const mongoose = require('mongoose');

// Define the blueprint (schema) for how a Certificate is structured and stored in our database
const certificateSchema = new mongoose.Schema(
  {
    // The unique identifier code for this certificate
    certificateId: {
      type: String, // Must be text
      required: [true, 'Certificate ID is required'], // Cannot be blank
      unique: true, // Must be completely unique in the database
      uppercase: true, // Automatically converts it to ALL CAPS
      trim: true, // Removes extra spaces before and after
      // Ensure the ID only uses safe characters (letters, numbers, hyphens, underscores)
      match: [/^[A-Z0-9\-_]+$/, 'Certificate ID can only contain letters, numbers, hyphens, and underscores'],
    },
    // The full name of the student who earned the certificate
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    // The field or subject the certificate is in (e.g., "Web Development", "Data Science")
    domain: {
      type: String,
      required: [true, 'Internship domain is required'],
      trim: true,
      maxlength: [200, 'Domain cannot exceed 200 characters'],
    },
    // The organization or school they belong to
    institution: {
      type: String,
      trim: true,
      default: '', // If none provided, leave it blank
      maxlength: [200, 'Institution name cannot exceed 200 characters'],
    },
    // The date they started their internship or course
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    // The date they finished their internship or course
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Optional extra details about their performance or the program
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Is this certificate valid? Admins might set this to false to revoke a certificate.
    isActive: {
      type: Boolean,
      default: true, // Valid by default
    },
    // Links this certificate to the User (Admin) who created it. This is a relational reference.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // It stores the unique ID of the user
      ref: 'User', // It tells mongoose this references the 'User' database collection
    },
    // If the certificate was uploaded as part of an excel sheet, we store the batch ID here to identify it later
    uploadBatch: {
      type: String,
      default: null,
    },
    // Keep track of how many times people have checked if this certificate is real
    verificationCount: {
      type: Number,
      default: 0,
    },
    // Record the exact time this certificate was most recently verified by someone
    lastVerifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' tracking
    toJSON: { virtuals: true }, // Ensure calculated "virtual" fields are included in JSON output
    toObject: { virtuals: true }, // Ensure calculated "virtual" fields are included in object forms
  }
);

// ── Indexes ───────────────────────────────────────────────────────
// Indexes tell the database to pre-sort certain things, making searches much faster.
certificateSchema.index({ certificateId: 1 }); // Makes fetching a certificate by its unique ID very fast
// A highly specialized text index. Allows us to do powerful text searches for specific names or domains
certificateSchema.index({ studentName: 'text', domain: 'text' });
certificateSchema.index({ createdAt: -1 }); // Optimizes sorting certificates by newest first
certificateSchema.index({ domain: 1 }); // Speeds up filtering certificates by their category/domain
certificateSchema.index({ isActive: 1 }); // Speeds up filtering for only active certificates

// ── Virtual: Duration in days ─────────────────────────────────────
// "Virtuals" are properties that are NOT stored in the database but are calculated right when we ask for them.
// This calculates how many total days the internship/course lasted.
certificateSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  // Subtract start date from end date (it gives milliseconds), then divide to convert to days.
  return Math.max(0, Math.round((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)));
});

// ── Virtual: Duration formatted ───────────────────────────────────
// This creates a human-readable text string for the duration (e.g. "2 months, 5 days")
certificateSchema.virtual('durationFormatted').get(function () {
  const days = this.durationDays;
  if (days === 0) return '—';
  const months = Math.floor(days / 30); // Approximate months
  const remDays = days % 30; // Remaining days
  
  if (months === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (remDays === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''}`;
});

// ── Pre-validate: end must be after start ─────────────────────────
// This runs before saving database to make sure the data makes logical sense.
certificateSchema.pre('validate', function (next) {
  // It stops saving if the start date happens AFTER the end date
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

// Create the model from our blueprint
const Certificate = mongoose.model('Certificate', certificateSchema);

// Make the Certificate model available to other files
module.exports = Certificate;
