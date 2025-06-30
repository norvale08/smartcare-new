"use client"
import React, { useState } from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button, Input, Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui' 
import Link from 'next/link'
import { toast } from "react-hot-toast"

const Registration = () => {
    const { register, handleSubmit, formState, reset, watch } = useForm<UserRegisterType>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const password = watch("password");
    
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleFormSubmit = async (data: UserRegisterType) => {
        setIsLoading(true);
        setError(null);
        
        try {
            
            const { confirmPassword, ...submitData } = data;
            
            
            const response = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to register user");
            }

            toast.success("Registration successful!");
            setSuccess(true);
            reset();
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen min-h-screen'>
           <div className='w-full max-w-md'>
            <div className='text-center mb-8'>
                <h1 className='text-xl text-blue-500'>Registration Page</h1>
            </div>
            
            {success && (
                <div className='mb-4 p-4 text-green-700 bg-green-100 border border-green-300 rounded-md'>
                    Registration successful! You can now login to your account.
                </div>
            )}
            
            {error && (
                <div className='mb-4 p-4 text-red-700 bg-red-100 border border-red-300 rounded-md'>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit(handleFormSubmit)} className='border border-gray-200 shadow-md rounded-md p-6 space-y-2'>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            type="text"
                            placeholder='First Name'
                            {...register("firstName", authValidationRules.firstName)}
                        />
                        {formState.errors.firstName && 
                            <p className='text-red-500 text-sm mt-1'>
                                {formState.errors.firstName.message}
                            </p>
                        }
                    </div>

                    <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            type="text"
                            placeholder='Last Name'
                            {...register("lastName", authValidationRules.lastName)}
                        />
                        {formState.errors.lastName &&
                            <p className='text-red-500 text-sm mt-1'>
                                {formState.errors.lastName.message}
                            </p>
                        }
                    </div>
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        placeholder='Email'
                        {...register("email", authValidationRules.email)}
                    />
                    {formState.errors.email && 
                        <p className='text-red-500 text-sm mt-1'>
                            {formState.errors.email.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                        type="tel"
                        placeholder='Phone Number'
                        {...register("phoneNumber", authValidationRules.phoneNumber)}
                    />
                    {formState.errors.phoneNumber &&
                        <p className='text-red-500 text-sm mt-1'>
                            {formState.errors.phoneNumber.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        type="password"
                        placeholder='Password'
                        {...register('password', authValidationRules.password)}
                    />
                    {formState.errors.password && 
                        <p className='text-red-500 text-sm mt-1'>
                            {formState.errors.password.message}
                        </p>
                    }
                </div>

               <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        type="password"
                        placeholder='Confirm Password'
                        {...register('confirmPassword', getConfirmPasswordRule(password))}
                    />
                    {formState.errors.confirmPassword && 
                        <p className='text-red-500 text-sm mt-1'>
                            {formState.errors.confirmPassword.message}
                        </p>
                    }
                </div>

                <Button 
                    type="submit" 
                    className='w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
                    disabled={isLoading}
                >
                    {isLoading ? 'Registering...' : 'Register'}
                </Button>

                <Link className="text-sm mt-4 text-right block" href={"/login"}>
                    Already have an account? <span className='underline text-blue-500'>Login</span>
                </Link>
            </form>
        </div>
        </div>
    )
}

export default Registration