"use client";
import React, { useEffect, useState } from "react";
import { UserLoginType } from "@/types/auth";
import { authValidationRules, Button, Input, Label } from "@repo/ui";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const Login = () => {
  const { register, handleSubmit, formState, reset } = useForm<UserLoginType>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // ✅ Move here

  const handleFormSubmit = async (data: UserLoginType) => {
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.ok) {
        toast.success("Login successful!");
        reset();
        router.replace("/"); // ✅ Redirect to homepage
      } else {
        toast.error(res?.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CustomToaster />
      <div className="w-full max-w-md">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center">Login</h1>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="border border-gray-200 shadow-md rounded-md p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email", authValidationRules.email)}
            />
            {formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...register("password", authValidationRules.password)}
            />
            {formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">{formState.errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
