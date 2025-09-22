"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Label } from "@repo/ui";
import { authValidationRules, getConfirmPasswordRule } from "@repo/ui";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

type DoctorRegisterType = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role?: string;
};

const DoctorsRegistration = () => {
  const { register, handleSubmit, formState, reset, watch } =
    useForm<DoctorRegisterType>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const password = watch("password");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleFormSubmit = async (data: DoctorRegisterType) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;

      // force role as doctor
      const payload = { ...submitData, role: "doctor" };

      const response = await fetch(`${API_URL}/api/doctors/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to register doctor");

      toast.success("Doctor registered successfully!");
      reset();
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
