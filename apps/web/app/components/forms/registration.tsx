"use client"
import React, { useState } from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button, Input, Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui'
import Link from 'next/link'
import { toast } from "react-hot-toast"
import CustomToaster from '../ui/CustomToaster'

const Registration = () => {
    const { register, handleSubmit, formState, reset, watch } = useForm<UserRegisterType>();
    const [isLoading, setIsLoading] = useState(false);
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
    <div className='absolute inset-0 bg-blue-600 opacity-70 z-0'></div>
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


            {/* Right Panel: Form */}
            <div className='flex flex-col items-center justify-center h-full p-12'>
                <div className='w-full max-w-md'>
                    <div className='mb-4'>
                        <h1 className='text-2xl font-bold text-center'>Register</h1>
                    </div>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder='First Name'
                                    {...register("firstName", authValidationRules.firstName)}
                                />
                                {formState.errors.firstName &&
                                    <p className='text-red-500 text-sm mt-1'>{formState.errors.firstName.message}</p>
                                }
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder='Last Name'
                                    {...register("lastName", authValidationRules.lastName)}
                                />
                                {formState.errors.lastName &&
                                    <p className='text-red-500 text-sm mt-1'>{formState.errors.lastName.message}</p>
                                }
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder='Email'
                                {...register("email", authValidationRules.email)}
                            />
                            {formState.errors.email &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.email.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder='Phone Number'
                                {...register("phoneNumber", authValidationRules.phoneNumber)}
                            />
                            {formState.errors.phoneNumber &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.phoneNumber.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder='Password'
                                {...register("password", authValidationRules.password)}
                            />
                            {formState.errors.password &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.password.message}</p>
                            }
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder='Confirm Password'
                                {...register("confirmPassword", getConfirmPasswordRule(password))}
                            />
                            {formState.errors.confirmPassword &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.confirmPassword.message}</p>
                            }
                        </div>

                        <Button
                            type='submit'
                            className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
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
