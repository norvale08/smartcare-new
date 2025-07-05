import express,{Request,Response} from 'express';
import bcrypt from "bcryptjs";
import User from '../models/user';
import { connectMongoDB } from '../lib/mongodb';

const router = express.Router();

router.post('/',async (req, res) => {
  try{
    const {firstName,lastName,email,phoneNumber,password}=req.body;

   const existingUser = await User.findOne({email});
    if(existingUser){
      res.status(400).json({message:"User already exists"});
      return;
    }

    const hashedPassword= await bcrypt.hash(password,10);

    const userData={
      firstName,lastName,email,phoneNumber,password:hashedPassword
    }
    const user= await User.create(userData)
    res.status(201).json({message:"user registered successfully"})

  }catch(error){
    res.status(500).json({message:"Server error"})
  }
});

export default router;