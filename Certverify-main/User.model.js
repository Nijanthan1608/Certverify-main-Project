// Import mongoose, a library for interacting with our MongoDB database
const mongoose = require('mongoose');
// Import bcryptjs, a library used to securely encrypt (hash) passwords
const bcrypt = require('bcryptjs');

// Define the blueprint (schema) for how a User is structured in our database
const userSchema = new mongoose.Schema(
  {
    // The user's full name
    name: {
      type: String, // Must be text
      required: [true, 'Name is required'], // This field cannot be left blank
      trim: true, // Automatically removes any spaces at the beginning or end
      minlength: [2, 'Name must be at least 2 characters'], // Must be at least 2 characters long
      maxlength: [100, 'Name cannot exceed 100 characters'], // Cannot be longer than 100 characters
    },
    // The user's email address
    email: {
      type: String, // Must be text
      required: [true, 'Email is required'], // This field cannot be left blank
      unique: true, // Every email in the database must be unique (no duplicates allowed)
      lowercase: true, // Automatically converts the email to lowercase
      trim: true, // Removes extra spaces
      // Use a "regular expression" to make sure the email is formatted correctly (e.g., name@domain.com)
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
    },
    // The user's secret password
    password: {
      type: String, // Must be text
      required: [true, 'Password is required'], // Cannot be blank
      minlength: [6, 'Password must be at least 6 characters'], // Must have enough characters to be secure
      // By default, do NOT return the password when we fetch a user from the database. This protects it from accidentally being sent to the frontend.
      select: false,
    },
    // The user's role (either an 'admin' or a regular 'user')
    role: {
      type: String,
      enum: ['admin', 'user'], // The role MUST be one of these exact two words
      default: 'user', // If no role is provided when the user is created, make them a standard 'user'
    },
    // Indicates if the account is active or disabled
    isActive: {
      type: Boolean, // True or false
      default: true, // Accounts are active by default
    },
    // Records the last time the user logged in
    lastLogin: {
      type: Date, // A specific date and time
    },
    // Records when the user last changed their password (helps with secure sessions)
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
    toJSON: { virtuals: true }, // Ensure virtual fields (calculated fields not stored in DB) are included when saving to JSON
    toObject: { virtuals: true }, // Ensure virtual fields are included in object forms
  }
);

// ── Indexes ───────────────────────────────────────────────────────
// Indexes make searching the database much faster for specific fields
userSchema.index({ email: 1 }); // Makes searching for users by email very fast
userSchema.index({ role: 1 }); // Makes filtering admins vs normal users fast

// ── Pre-save: Hash password ───────────────────────────────────────
// Right before saving a user to the database, run this function
userSchema.pre('save', async function (next) {
  // If the password hasn't been changed, skip this step and just save it
  if (!this.isModified('password')) return next();
  
  // Create a "salt" - random data added to the password to make cracking it harder
  const salt = await bcrypt.genSalt(12);
  // Encrypt the password using the salt
  this.password = await bcrypt.hash(this.password, salt);
  
  // If this is an existing user updating their password (not a new user), record the time they changed it. (Subtract 1 sec so it doesn't conflict with database timing)
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  
  // Continue saving
  next();
});

// ── Instance method: Compare password ────────────────────────────
// A custom function attached to a user to check if a typed password matches their encrypted password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt handles comparing the plain text password to the hashed version securely
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: Safe user object ────────────────────────────
// A helper function to return the user's data WITHOUT sensitive information like the password
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

// Create the model from our blueprint so we can use it to talk to the database
const User = mongoose.model('User', userSchema);

// Export the User model for use in other files
module.exports = User;
