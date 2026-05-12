// Import the mongoose library which helps us connect to and interact with our MongoDB database
const mongoose = require('mongoose');

// This function connects our backend server to the MongoDB database
const connectDB = async () => {
  try {
    // Attempt to connect using the connection string stored in our environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true, // Use the new url parser instead of the deprecated one
      useUnifiedTopology: true, // Use the new Server Discovery and Monitoring engine
    });

    // If successful, log a success message with the host name of the database
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Listen for any database connection errors after the initial connection is made
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Listen for disconnections so we can log them if the database goes offline
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    // If the initial connection fails, log the error and stop the server completely (exit code 1)
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// Export the connection function so it can be used in our main server file
module.exports = connectDB;
