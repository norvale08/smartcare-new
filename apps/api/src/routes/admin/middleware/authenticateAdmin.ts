import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../../models/user";

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || (req.body as any).token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;
    
   
    next();
  } catch (error) {
    console.error("❌ Admin authentication failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};