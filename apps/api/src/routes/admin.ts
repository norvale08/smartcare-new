import express from "express";
import User from "../models/user";

const router = express.Router();

// ✅ Middleware to check admin
function isAdmin(req: any, res: any, next: any) {
  if (req.session?.user && req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
}

// ✅ Get all users (patients + doctors)
router.get("/users", isAdmin, async (_req, res) => {
  try {
    const users = await User.find({}, "-password"); // hide password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;
