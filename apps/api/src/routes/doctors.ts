// /routes/doctors.ts
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    await connectMongoDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "doctor", // force doctor role
    });

    res.status(201).json({ message: "Doctor created successfully", doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
