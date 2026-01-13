import mongoose from "mongoose";

let isConnected = false;

export const connectMongoDB = async () => {
  try {
    // Reuse existing connection
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log("♻️ Using existing MongoDB connection");
      return;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MongoDB URI is missing in environment variable.");
    }

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Limit concurrent connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    isConnected = true;
    console.log("✅ Connected to MongoDB successfully");

  } catch (error) {
    isConnected = false;
    console.error("❌ MongoDB connection error:", error);
    throw error; // Let the caller handle the error
  }
};