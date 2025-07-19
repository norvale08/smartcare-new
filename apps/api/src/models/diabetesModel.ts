import {Schema,model,models} from "mongoose";

const DiabetesSchema= new Schema({
    glucose:{
        type:Number,
        required:true
    },
    context:{
       type:String,
       enum:["Fasting","Post-meal", "Random"] ,
       required:true
    },
    language:{
        type:String,
        enum:["en","sw"],
        default:"en"
    },
    
    aiRequested:{
        type:Boolean
    },
    aiFeedback:{
        type:String,
    }

},{timestamps:true});

const Diabetes= models.Diabetes || model("Diabetes",DiabetesSchema);
export default Diabetes;