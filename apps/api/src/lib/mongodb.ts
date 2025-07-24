import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

export const connectMongoDB = async () => {
    try {
        console.log("Checking environment variables...");
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
        
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error("MongoDB URI is missing in environment variable.");
        }

        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1); // Exit if can't connect to database
    }
}