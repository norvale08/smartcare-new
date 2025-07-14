import express from "express";
import Patient from "../models/patient"; 

import { connectMongoDB } from "../lib/mongodb"

const router= express.Router();
connectMongoDB();

router.post("/", async(req, res) => {

  try{
const newPatient = new Patient (req.body);
const saved= await newPatient.save();
res.status(201).json({message:"Saved",id:saved._id})

  }catch(error){
    console.error(error);
    res.status(500).json({error:"Failed to save patients profile"})
  }
})

export default router; 