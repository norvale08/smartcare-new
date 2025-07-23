import mongoose from "mongoose";

export const connectMongoDB = async () => {
    // Debug: Log environment info (remove in production)
    console.log("🔍 Environment check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log("Available env vars with 'MONGO':", Object.keys(process.env).filter(key => key.includes('MONGO')));
    
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
        const errorMsg = "MongoDB URI is missing in environment variable.";
        console.error("❌", errorMsg);
        // Re-throw the error so it stops the application
        throw new Error(errorMsg);
    }

    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log("✅ Already connected to MongoDB");
            return;
        }

        await mongoose.connect(mongoURI, {
            // Add connection options for better reliability
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        
        console.log("✅ Connected to MongoDB successfully");
        
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        // Re-throw the error so calling code knows connection failed
        throw error;
    }
};