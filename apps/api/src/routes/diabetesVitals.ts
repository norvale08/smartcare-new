import express from "express";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();
connectMongoDB();

router.post('/',async (req,res)=>{
    try{
        const newVitals= new Diabetes(req.body);
        const saved = await newVitals.save();
        res.status(201).json({message:"Saved",id:saved.id});


    }catch(error){
        res.status(500).json({message:"Server error"})
    }
})

export default router;