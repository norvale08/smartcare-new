import mongoose from "mongoose";

let isConnected = false;

export const connectMongoDB = async () => {
    // If already connected, return early
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        // Debug logging - remove after fixing
        console.log('🔍 Environment check:');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length);
        
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('❌ Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
            throw new Error("MongoDB URI is missing in environment variable.");
        }

        // Only connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoURI, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
        }
        
        isConnected = true;
        console.log("✅ Connected to MongoDB");
        
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        isConnected = false;
        throw error;
    }
};