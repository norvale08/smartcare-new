"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Label } from "@repo/ui";
import { authValidationRules, getConfirmPasswordRule } from "@repo/ui";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, Stethoscope, 
  Heart, Activity, Building, IdCard, Plus, Shield
} from "lucide-react";

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
  const [showSuccess, setShowSuccess] = useState(false);

  const password = watch("password");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFormSubmit = async (data: DoctorRegisterType) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;

      const payload = { 
        ...submitData, 
        role: "doctor",
        treatsDiabetes: Boolean(submitData.treatsDiabetes),
        treatsHypertension: Boolean(submitData.treatsHypertension)
      };

      const response = await fetch(`${API_URL}/api/doctors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to register doctor");
      }

      toast.success("Doctor registered successfully!");
      setShowSuccess(true);
      reset();
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-800 to-blue-950 rounded-2xl shadow-lg mb-4">
          <Shield className="text-white" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Register New Doctor
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Add qualified medical professionals to your healthcare team. All fields are required to ensure proper credentialing.
        </p>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-fade-in">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Plus className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Doctor Registered Successfully!</h3>
              <p className="text-green-600 text-sm">The doctor has been added to the system and can now access their account.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-blue-900 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-4">
                <Stethoscope className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Doctor Registration Form</h2>
                <p className="text-blue-100 text-sm">Complete all sections to register a new doctor</p>
              </div>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">Required *</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-8"
        >
          <CustomToaster />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Personal & Professional Info */}
            <div className="space-y-8">
              {/* Personal Information Card */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                  <User className="mr-3" size={20} />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="w-full bg-white"
                      {...register("firstName", authValidationRules.firstName)}
                    />
                    {formState.errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="w-full bg-white"
                      {...register("lastName", authValidationRules.lastName)}
                    />
                    {formState.errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@hospital.com"
                        className="w-full bg-white pl-10"
                        {...register("email", authValidationRules.email)}
                      />
                    </div>
                    {formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-white pl-10"
                        {...register("phoneNumber", authValidationRules.phoneNumber)}
                      />
                    </div>
                    {formState.errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information Card */}
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="font-semibold text-emerald-900 mb-4 flex items-center text-lg">
                  <IdCard className="mr-3" size={20} />
                  Professional Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                      License Number *
                    </Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="MD123456"
                        className="w-full bg-white pl-10"
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

                  <div>
                    <Label htmlFor="hospital" className="text-sm font-medium text-gray-700 mb-2 block">
                      Hospital/Clinic *
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="hospital"
                        type="text"
                        placeholder="City General Hospital"
                        className="w-full bg-white pl-10"
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
                </div>
              </div>
            </div>

            {/* Right Column - Medical Specialization & Account */}
            <div className="space-y-8">
              {/* Medical Specialization Card */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center text-lg">
                  <Stethoscope className="mr-3" size={20} />
                  Medical Specialization
                </h3>

                <div className="mb-6">
                  <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 mb-2 block">
                    Primary Specialization *
                  </Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
                    <select
                      id="specialization"
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 appearance-none"
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

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Conditions Treated *
                  </Label>
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        id="treatsDiabetes"
                        {...register("treatsDiabetes")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="treatsDiabetes" className="flex items-center flex-1 cursor-pointer">
                        <Activity className="mr-3 text-green-600" size={18} />
                        <div>
                          <div className="font-medium text-gray-900">Diabetes Mellitus</div>
                          <div className="text-sm text-gray-500">Blood sugar management and treatment</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        id="treatsHypertension"
                        {...register("treatsHypertension")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="treatsHypertension" className="flex items-center flex-1 cursor-pointer">
                        <Heart className="mr-3 text-red-600" size={18} />
                        <div>
                          <div className="font-medium text-gray-900">Hypertension</div>
                          <div className="text-sm text-gray-500">High blood pressure management</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Select all conditions this doctor is qualified to treat
                  </p>
                </div>
              </div>

              {/* Account Security Card */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center text-lg">
                  <Lock className="mr-3" size={20} />
                  Account Security
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        className="w-full bg-white pl-10 pr-10"
                        {...register("password", authValidationRules.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="w-full bg-white pl-10 pr-10"
                        {...register("confirmPassword", getConfirmPasswordRule(password))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-w-48"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering Doctor...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2" size={18} />
                  Register Doctor
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorsRegistration;