"use client"
import React, { useState } from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button, Input, Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui'
import Link from 'next/link'
import { toast } from "react-hot-toast"
import CustomToaster from '../ui/CustomToaster'
import { FaUser, FaEnvelope, FaLock, FaPhone, FaHeartbeat, FaAmbulance, FaBrain } from "react-icons/fa"
import {Mail,Lock,User,Phone,Eye,EyeOff} from "lucide-react"
const Registration = () => {
    const { register, handleSubmit, formState, reset, watch } = useForm<UserRegisterType>();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const password = watch("password");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleFormSubmit = async (data: UserRegisterType) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...submitData } = data;
            const response = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to register user");

            toast.success("Registration successful!");
            reset();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='h-screen w-screen grid grid-cols-1 md:grid-cols-2'>
            <CustomToaster />

            
            {/* Left Panel: Branding */}
<div className='hidden md:flex relative flex-col justify-center items-start p-12 text-white overflow-hidden'>
    <div  
        className='absolute inset-0 bg-cover bg-center z-0'
        style={{ backgroundImage: "url('/doc2.jpg')" }}
    ></div>
    <div className='absolute inset-0 bg-gradient-to-r from-blue-950  to-emerald-950 opacity-70 z-0'></div>
    <div className='relative z-10 space-y-6'>
         <div className="flex items-center justify-center text-center">
  <FaHeartbeat className="text-blue-500 text-2xl mr-2" />
  <h1 className="text-2xl text-emerald-400 font-bold">
    SmartCare
  </h1>
</div>

        <p className='text-black mb-6 text-lg font-serif font-semibold'>An AI-Powered Health Monitoring</p>
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


            {/* Right Panel: Form */}
            <div className='flex flex-col items-center justify-center h-full p-12'>
                <div className='w-full max-w-md'>
                    <div className='mb-4'>
                        <div className='flex flex-row items-center justify-center text-center md:hidden '>
                         <FaHeartbeat className=' text-blue-500 mr-3'/>     
                        <h1 className=' text-2xl  text-emerald-400 font-bold'>
                            SmartCare</h1>
                        </div>
                        <h1 className='text-2xl font-bold text-center text-blue-950'>Register</h1>
                        <p className='text-center text-gray-600 mt-2'>Create your Smartcare account</p>
                    </div>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <div className='relative'>
                                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400  size={18'/>

                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder='First Name'
                                    className='pl-10'
                                    {...register("firstName", authValidationRules.firstName)}
                                />
                                </div>
                                {formState.errors.firstName &&
                                    <p className='text-red-500 text-sm mt-1'>{formState.errors.firstName.message}</p>
                                }
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <div className='relative'>
                                   <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400  size={18 '/>  
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder='Last Name'
                                    className='pl-10'
                                    {...register("lastName", authValidationRules.lastName)}
                                />
                                </div>
                                {formState.errors.lastName &&
                                    <p className='text-red-500 text-sm mt-1'>{formState.errors.lastName.message}</p>
                                }
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                id="email"
                                type="email"
                                placeholder='Email'
                                className='pl-10'
                                {...register("email", authValidationRules.email)}
                            />
                            </div>
                            {formState.errors.email &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.email.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                             <div className="relative">
                             <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder='Phone Number'
                                className='pl-10'
                                {...register("phoneNumber", authValidationRules.phoneNumber)}
                            />
                            </div>
                            {formState.errors.phoneNumber &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.phoneNumber.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={"password"}
                                className='pl-10'
                                {...register("password", authValidationRules.password)}
                            />
                            <button type="button"
                            onClick={()=>setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                            </button>
                            </div>
                            {formState.errors.password &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.password.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                             <div className="relative">
                               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> 
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder='Confirm Password'
                                className='pl-10'
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
                            {formState.errors.confirmPassword &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.confirmPassword.message}</p>
                            }
                        </div>

                        <Button
                            type='submit'
                            className='w-full bg-emerald-400 hover:bg-blue-950 disabled:bg-blue-300'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </Button>

                        <Link href="/login" className='block text-center text-sm mt-2'>
                            Already have an account? <span className='text-blue-500 underline'>Login</span>
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Registration
