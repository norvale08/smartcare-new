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
import { Mail, Eye, EyeOff, Lock } from "lucide-react";

const Login = () => {
  const { register, handleSubmit, formState, reset } = useForm<UserLoginType>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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
        toast.error(loginData.message || "Login failed");
        return;
      }

      const { token, user, redirectTo } = loginData;

      // Save in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      toast.success("Login successful!");
      reset();

      // ✅ Redirect logic for each role
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        if (user.role === "admin") {
          router.replace("/admin");
        } else if (user.role === "doctor") {
          if (!user.profileCompleted || user.isFirstLogin) {
            toast("Please complete your profile to continue.", { icon: "🩺" });
            router.replace("/doctor/profile");
          } else {
            router.replace("/doctor/dashboard");
          }
        } else if (user.role === "patient") {
          router.replace("/patient/dashboard");
        } else {
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

  return (
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
            <Link href="/registration" className="block text-center text-sm mt-2">
              Don't have an account?{" "}
              <span className="text-blue-500 underline">Register</span>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
