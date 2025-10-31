"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Label } from "@repo/ui";
import { authValidationRules, getConfirmPasswordRule } from "@repo/ui";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { Mail, Lock, User, Phone, Eye, EyeOff, Stethoscope, Heart, Activity, Building, IdCard } from "lucide-react";

type DoctorRegisterType = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role?: string;
  specialization: string;
  treatsDiabetes: boolean;
  treatsHypertension: boolean;
  licenseNumber: string;
  hospital: string;
};

const DoctorsRegistration = () => {
  const { register, handleSubmit, formState, reset, watch } =
    useForm<DoctorRegisterType>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const password = watch("password");

  // IMPORTANT: Update this to match your backend server port
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleFormSubmit = async (data: DoctorRegisterType) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;

      // DEBUG: Check what's being sent
      console.log("Form data being sent:", submitData);
      
      // force role as doctor
      const payload = { 
        ...submitData, 
        role: "doctor",
        treatsDiabetes: Boolean(submitData.treatsDiabetes),
        treatsHypertension: Boolean(submitData.treatsHypertension)
      };

      console.log("Final payload:", payload);
      console.log("Sending to:", `${API_URL}/api/doctors/create`);

      const response = await fetch(`${API_URL}/api/doctors/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Server response error:", result);
        throw new Error(result.message || "Failed to register doctor");
      }

      toast.success("Doctor registered successfully!");
      reset();
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-12">
      <CustomToaster />
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-950">
          Register Doctor
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Add a doctor to SmartCare system
        </p>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white"
        >
          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First Name"
                  className="pl-10"
                  {...register("firstName", authValidationRules.firstName)}
                />
              </div>
              {formState.errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="pl-10"
                  {...register("lastName", authValidationRules.lastName)}
                />
              </div>
              {formState.errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="email"
                type="email"
                placeholder="Email"
                className="pl-10"
                {...register("email", authValidationRules.email)}
              />
            </div>
            {formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Phone Number"
                className="pl-10"
                {...register("phoneNumber", authValidationRules.phoneNumber)}
              />
            </div>
            {formState.errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* License Number */}
          <div>
            <Label htmlFor="licenseNumber">Professional License Number</Label>
            <div className="relative">
              <IdCard
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="licenseNumber"
                type="text"
                placeholder="e.g., MD123456"
                className="pl-10"
                {...register("licenseNumber", { 
                  required: "License number is required",
                  minLength: {
                    value: 3,
                    message: "License number must be at least 3 characters"
                  }
                })}
              />
            </div>
            {formState.errors.licenseNumber && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.licenseNumber.message}
              </p>
            )}
          </div>

          {/* Hospital/Affiliation */}
          <div>
            <Label htmlFor="hospital">Hospital/Clinic Affiliation</Label>
            <div className="relative">
              <Building
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="hospital"
                type="text"
                placeholder="e.g., City General Hospital"
                className="pl-10"
                {...register("hospital", { 
                  required: "Hospital/Clinic name is required",
                  minLength: {
                    value: 2,
                    message: "Please enter a valid hospital name"
                  }
                })}
              />
            </div>
            {formState.errors.hospital && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.hospital.message}
              </p>
            )}
          </div>

          {/* Specialization Field */}
          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <div className="relative">
              <Stethoscope
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                id="specialization"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                {...register("specialization", { 
                  required: "Specialization is required" 
                })}
              >
                <option value="">Select Specialization</option>
                <option value="general-practice">General Practice / Family Medicine</option>
                <option value="endocrinology">Endocrinology</option>
                <option value="cardiology">Cardiology</option>
                <option value="nephrology">Nephrology</option>
                <option value="internal-medicine">Internal Medicine</option>
                <option value="other">Other</option>
              </select>
            </div>
            {formState.errors.specialization && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.specialization.message}
              </p>
            )}
          </div>

          {/* Conditions They Treat */}
          <div>
            <Label>Conditions They Treat</Label>
            <div className="space-y-3 mt-2 p-3 border border-gray-200 rounded-md">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="treatsDiabetes"
                  {...register("treatsDiabetes")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="treatsDiabetes" className="flex items-center">
                  <Activity className="mr-2 text-green-600" size={16} />
                  Diabetes Mellitus
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="treatsHypertension"
                  {...register("treatsHypertension")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="treatsHypertension" className="flex items-center">
                  <Heart className="mr-2 text-red-600" size={16} />
                  Hypertension (High Blood Pressure)
                </Label>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Select all conditions this doctor treats
            </p>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pl-10"
                {...register("password", authValidationRules.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="pl-10"
                {...register("confirmPassword", getConfirmPasswordRule(password))}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-emerald-400 hover:bg-blue-950 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register Doctor"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DoctorsRegistration;