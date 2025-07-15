
import express,{Request,Response} from 'express';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 
import User from '../models/user';
import { connectMongoDB } from '../lib/mongodb';

const router = express.Router();

router.post('/',async (req, res) => {
  try{
    const {email,password}=req.body;

    await connectMongoDB();

    const user = await User.findOne({email});
    if(!user){
      res.status(401).json({message:"User not found"});
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      res.status(401).json({message:"Invalid credentials"});
      return;
    }

    
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}` 
      },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    };
    
    
    res.status(200).json({
      user: safeUser,
      token: token
    });

  }catch(error){
    res.status(500).json({message:"Server error"})
  }
});

export default router;