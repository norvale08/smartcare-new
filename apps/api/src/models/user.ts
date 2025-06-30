import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type:Number,
    required: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

const User = models.User || model("User", userSchema);

export default User;
