"use client"
import React from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button,Input,Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui' 
import Link from 'next/link'

const Registration = () => {
    const { register, handleSubmit, formState, reset, watch } = useForm<UserRegisterType>();
    
    const password = watch("password");


    const handleFormSubmit = async (data: UserRegisterType) => {
        reset()
        
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen min-h-screen'>
           <div className='w-full max-w-md'>
            <div className='text-center mb-8'>
            <h1 className='text-xl text-blue-500'>Registration</h1>
            </div>
            <form onSubmit={handleSubmit(handleFormSubmit)} className='border border-gray-200 shadow-md rounded-md p-6  space-y-2'>
                <div className='grid grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="firstName" >First Name</Label>
                    <Input
                        type="text"
                        placeholder='firstName'
                        {...register("firstName", authValidationRules.firstName)}
                    />
                    {formState.errors.firstName && 
                        <p className='text-red-500'>
                            {formState.errors.firstName.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        type="text"
                        placeholder='lastName'
                        {...register("lastName", authValidationRules.lastName)}
                    />
                    {formState.errors.lastName &&
                        <p className='text-red-500'>
                            {formState.errors.lastName.message}
                        </p>
                    }
                </div>
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        placeholder='email'
                        {...register("email", authValidationRules.email)}
                    />
                    {formState.errors.email && 
                        <p className='text-red-500'>
                            {formState.errors.email.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        type="password"
                        placeholder='password'
                        {...register('password', authValidationRules.password)}
                    />
                    {formState.errors.password && 
                        <p className='text-red-500'>
                            {formState.errors.password.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        type="password"
                        placeholder='confirmPassword'
                        {...register('confirmPassword', getConfirmPasswordRule(password))}
                    />
                    {formState.errors.confirmPassword && 
                        <p className='text-red-500'>
                            {formState.errors.confirmPassword.message}
                        </p>
                    }
                </div>

                <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                        type="tel"
                        placeholder='phoneNumber'
                        {...register("phoneNumber", authValidationRules.phoneNumber)}
                    />
                    {formState.errors.phoneNumber &&
                        <p className='text-red-500'>
                            {formState.errors.phoneNumber.message}
                        </p>
                    }
                </div>

                <Button type="submit" className='w-full bg-blue-300'>
                    Register
                </Button>
                

                <Link className="text-sm mt-4 text-right block" href={"/login"}>Already have an account ? <span className='underline text-blue-500'>Login</span></Link>
            </form>
        </div>
        </div>
        
    )
}

export default Registration