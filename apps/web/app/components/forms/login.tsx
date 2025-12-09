"use client";
import React, { useState } from "react";
import { UserLoginType } from "@/types/auth";
import { authValidationRules, Button, Input, Label } from "@repo/ui";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHeartbeat } from "react-icons/fa";
import { Mail, Eye, EyeOff, Lock, Users, AlertCircle } from "lucide-react";

const Login = () => {
  const { register, handleSubmit, formState, reset, watch } = useForm<UserLoginType>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const router = useRouter();

  const email = watch("email");

  const handleFormSubmit = async (data: UserLoginType) => {
    setIsLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const loginRes = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        console.log("Login failed response:", loginData);
        
        // ✅ Handle relative setup case
        if (loginData.needsSetup && loginData.role === "relative") {
          setShowSetupModal(true);
          return;
        }
        
        toast.error(loginData.message || "Login failed");
        return;
      }

      const { token, user, redirectTo, message } = loginData;

      // Save in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      toast.success(message || "Login successful!");
      reset();

      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        // Handle based on role
        switch (user.role) {
          case "admin":
            router.replace("/admin");
            break;
          case "doctor":
            if (!user.profileCompleted || user.isFirstLogin) {
              toast("Please complete your profile to continue.", { icon: "🩺" });
              router.replace("/doctor/profile");
            } else {
              router.replace("/doctor/dashboard");
            }
            break;
          case "patient":
            router.replace("/patient/dashboard");
            break;
          case "relative":
            router.replace("/relatives/dashboard");
            break;
          default:
            toast.error("Unknown user role");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSetupEmail = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_URL}/api/login/relative-setup-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Setup email sent! Check your inbox.");
        setShowSetupModal(false);
      } else {
        toast.error(data.message || "Failed to send setup email");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      toast.error("Failed to send setup email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-2">
        <CustomToaster />

        {/* Left Section */}
        <div className="hidden md:flex relative flex-col justify-center items-start p-12 text-white overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('/doc1.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-950 opacity-70 z-0"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-center text-center">
              <FaHeartbeat className="text-blue-500 text-2xl mr-2" />
              <h1 className="text-2xl text-emerald-400 font-bold">SmartCare</h1>
            </div>

            <p className="text-black mb-6 text-lg font-serif font-semibold">
              An AI-Powered Health Monitoring
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">24/7 Health Monitoring</h3>
                <p>Advanced AI continuously monitors your health</p>
              </div>
              <div>
                <h3 className="font-semibold">Emergency Response</h3>
                <p>Instant alerts to hospitals and EMTs</p>
              </div>
              <div>
                <h3 className="font-semibold">AI Anomaly Detection</h3>
                <p>Smart detection of health irregularities</p>
              </div>
              <div className="pt-4 border-t border-white/20">
                <h3 className="font-semibold flex items-center">
                  <Users className="mr-2" size={18} />
                  Family Access
                </h3>
                <p>Family members can monitor patient health with secure access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="flex flex-col items-center justify-center h-full p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-4 md:hidden">
              <FaHeartbeat className="text-blue-500 text-4xl mb-2" />
              <h1 className="text-2xl text-emerald-400 font-bold">SmartCare</h1>
            </div>
            <h1 className="text-2xl font-bold text-center text-blue-950">
              Login
            </h1>
            <p className="text-center text-gray-600 mt-2 mb-3">
              Login into your SmartCare account
            </p>

            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white"
            >
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

              <Button
                type="submit"
                className="w-full bg-emerald-400 hover:bg-blue-950 disabled:bg-blue-300"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="text-center space-y-2">
                <Link href="/registration" className="block text-sm text-gray-600">
                  Don't have an account?{" "}
                  <span className="text-blue-500 underline">Register</span>
                </Link>
                <p className="text-xs text-gray-500">
                  Family members: Check your email for setup link
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Setup Required Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-amber-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold">Account Setup Required</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              You need to complete your account setup before logging in. Please check your email for the setup link.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {email}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleResendSetupEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Setup Email"}
              </Button>
              <Button
                onClick={() => setShowSetupModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Close
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need help?{" "}
                <a href="mailto:support@smartcare.com" className="text-blue-500 hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;