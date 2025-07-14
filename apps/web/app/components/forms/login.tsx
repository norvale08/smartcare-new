"use client";
import React, { useEffect, useState } from "react";
import { UserLoginType } from "@/types/auth";
import { authValidationRules, Button, Input, Label } from "@repo/ui";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login = () => {
  const { register, handleSubmit, formState, reset } = useForm<UserLoginType>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); 

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
        router.replace("/"); 
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
   <div className='h-screen w-screen grid grid-cols-1 md:grid-cols-2'>
      <CustomToaster />

      
<div className='hidden md:flex relative flex-col justify-center items-start p-12 text-white overflow-hidden'>
    <div  
        className='absolute inset-0 bg-cover bg-center z-0'
        style={{ backgroundImage: "url('/doc1.jpg')" }}
    ></div>
    <div className='absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-500  opacity-70 z-0'></div>
    <div className='relative z-10 space-y-6'>
        <h1 className='text-4xl font-bold text-white mb-4'>Smartcare</h1>
        <p className='text-white mb-6 text-lg'>An AI-Powered Health Monitoring</p>
        <div className='space-y-4'>
            <div>
                <h3 className='font-semibold'>24/7 Health Monitoring</h3>
                <p>Advanced AI continuously monitors your health</p>
            </div>
            <div>
                <h3 className='font-semibold'>Emergency Response</h3>
                <p>Instant alerts to hospitals and EMTs</p>
            </div>
            <div>
                <h3 className='font-semibold'>AI Anomaly Detection</h3>
                <p>Smart detection of health irregularities</p>
            </div>
        </div>
    </div>
</div>


      {/* Right: Login Form */}
      <div className='flex flex-col items-center justify-center h-full p-12 bg-white'>
        <div className='w-full max-w-md'>
          <div className='mb-4'>
            <h1 className='text-2xl font-bold text-center'>Login</h1>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white'>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder='Email'
                {...register("email", authValidationRules.email)}
              />
              {formState.errors.email && (
                <p className='text-red-500 text-sm mt-1'>
                  {formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder='Password'
                {...register('password', authValidationRules.password)}
              />
              {formState.errors.password && (
                <p className='text-red-500 text-sm mt-1'>
                  {formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full bg-blue-700 hover:bg-emerald-700 disabled:bg-blue-300'
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Link href="/registration" className='block text-center text-sm mt-2'>
                            Don't have an account? <span className='text-blue-500 underline'>Register</span></Link>
          </form>
        </div>
      </div>
    </div>
  )
};

export default Login;
