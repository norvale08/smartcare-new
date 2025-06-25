"use client"
import React from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button,Input,Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui' 

const Registration = () => {
    const { register, handleSubmit, formState, reset, watch } = useForm<UserRegisterType>();
    
    const password = watch("password");


    const handleFormSubmit = async (data: UserRegisterType) => {
        reset()
        
    }

    return (
        <div>
            <h1>Registration</h1>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div>
                    <Label htmlFor="firstName">First Name</Label>
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

                <Button type="submit">
                    Register
                </Button>
            </form>
        </div>
    )
}

export default Registration