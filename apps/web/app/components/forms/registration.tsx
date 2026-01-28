"use client"
import React, { useState } from 'react'
import { UserRegisterType } from '../../../types/auth'
import { useForm } from "react-hook-form"
import { Button, Input, Label } from '@repo/ui'
import { authValidationRules, getConfirmPasswordRule } from '@repo/ui'
import Link from 'next/link'
import { toast } from "react-hot-toast"
import { useRouter } from 'next/navigation'
import CustomToaster from '../ui/CustomToaster'
import { FaHeartbeat } from "react-icons/fa"
import { Mail, Lock, User, Phone, Eye, EyeOff, Shield, CheckCircle, Clock } from "lucide-react"

interface ExtendedUserRegisterType extends UserRegisterType {
    dataConsent: boolean;
}

const Registration = () => {
    const router = useRouter();
    const { register, handleSubmit, formState, reset, watch } = useForm<ExtendedUserRegisterType>();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const password = watch("password");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleFormSubmit = async (data: ExtendedUserRegisterType) => {
        setIsLoading(true);
        try {
            const { confirmPassword, dataConsent, ...submitData } = data;
            const response = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...submitData, dataConsent }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to register user");

            // Store email and show success screen
            setUserEmail(data.email);
            setRegistrationComplete(true);
            reset();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    // Pending Approval Success Screen
    if (registrationComplete) {
        return (
            <div className='min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4'>
                <CustomToaster />
                <div className='w-full max-w-2xl'>
                    <div className='bg-white rounded-lg shadow-xl overflow-hidden'>
                        {/* Header */}
                        <div className='bg-gradient-to-r from-emerald-400 to-blue-950 p-6 text-white text-center'>
                            <div className="flex items-center justify-center mb-3">
                                <FaHeartbeat className="text-3xl mr-2" />
                                <h1 className="text-2xl font-bold">SmartCare</h1>
                            </div>
                            <p className="text-sm opacity-90">Registration Successful</p>
                        </div>

                        {/* Content */}
                        <div className='p-8'>
                            <div className='text-center mb-6'>
                                <div className='inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4'>
                                    <Clock className='w-10 h-10 text-yellow-600' />
                                </div>
                                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                                    Account Pending Approval
                                </h2>
                                <p className='text-gray-600 mb-4'>
                                    Thank you for registering with SmartCare!
                                </p>
                                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                                    <div className='flex items-start'>
                                        <Mail className='w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
                                        <div className='text-left'>
                                            <p className='text-sm text-gray-700'>
                                                We've sent a confirmation email to:
                                            </p>
                                            <p className='font-semibold text-gray-900 mt-1'>
                                                {userEmail}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Information */}
                            <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6'>
                                <div className='flex items-start'>
                                    <div className='flex-shrink-0'>
                                        <Clock className='h-5 w-5 text-yellow-400' />
                                    </div>
                                    <div className='ml-3'>
                                        <h3 className='text-sm font-semibold text-yellow-800 mb-2'>
                                            What happens next?
                                        </h3>
                                        <div className='text-sm text-yellow-700 space-y-2'>
                                            <div className='flex items-start'>
                                                <CheckCircle className='w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0' />
                                                <p>Our admin team will review your registration (typically within 24-48 hours)</p>
                                            </div>
                                            <div className='flex items-start'>
                                                <CheckCircle className='w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0' />
                                                <p>Once approved, you'll receive an activation email with a secure link</p>
                                            </div>
                                            <div className='flex items-start'>
                                                <CheckCircle className='w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0' />
                                                <p>Click the activation link to verify your email and activate your account</p>
                                            </div>
                                            <div className='flex items-start'>
                                                <CheckCircle className='w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0' />
                                                <p>You'll then be able to log in and access all SmartCare features</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notice */}
                            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                                <div className='flex items-start'>
                                    <Shield className='w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0' />
                                    <div>
                                        <h3 className='font-semibold text-red-900 mb-1'>Important</h3>
                                        <p className='text-sm text-red-700'>
                                            Please do not attempt to log in until you receive your activation email. 
                                            Your account will not be accessible until it has been approved and activated.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className='space-y-3'>
                                <Button
                                    onClick={() => {
                                        setRegistrationComplete(false);
                                        router.push('/');
                                    }}
                                    className='w-full bg-emerald-500 hover:bg-emerald-600'
                                >
                                    Return to Home
                                </Button>
                                
                                <p className='text-center text-sm text-gray-600'>
                                    Didn't receive the email? Check your spam folder or{' '}
                                    <a href="mailto:support@smartcare.com" className='text-blue-600 hover:underline'>
                                        contact support
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className='text-center text-sm text-gray-600 mt-6'>
                        Need help? Contact{' '}
                        <a href="mailto:support@smartcare.com" className='text-emerald-600 hover:underline'>
                            support@smartcare.com
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    // Registration Form
    return (
        <div className='min-h-screen w-screen grid grid-cols-1 md:grid-cols-2'>
            <CustomToaster />

            {/* Left Panel: Branding */}
            <div className='hidden md:flex relative flex-col justify-center items-start p-12 text-white overflow-hidden'>
                <div  
                    className='absolute inset-0 bg-cover bg-center z-0'
                    style={{ backgroundImage: "url('/doc2.jpg')" }}
                ></div>
                <div className='absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-950 opacity-70 z-0'></div>
                <div className='relative z-10 space-y-6'>
                    <div className="flex items-center justify-center text-center">
                        <FaHeartbeat className="text-blue-500 text-2xl mr-2" />
                        <h1 className="text-2xl text-emerald-400 font-bold">
                            SmartCare
                        </h1>
                    </div>

                    <p className='text-black mb-6 text-lg font-serif font-semibold'>An AI-Powered Remote Patient Monitoring System</p>
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
            <div className='flex flex-col items-center justify-center min-h-screen p-6 md:p-12 overflow-y-auto'>
                <div className='w-full max-w-md my-8'>
                    <div className='mb-4'>
                        <div className='flex flex-row items-center justify-center text-center md:hidden mb-4'>
                            <FaHeartbeat className='text-blue-500 mr-3'/>     
                            <h1 className='text-2xl text-emerald-400 font-bold'>
                                SmartCare
                            </h1>
                        </div>
                        <h1 className='text-2xl font-bold text-center text-blue-950'>Register</h1>
                        <p className='text-center text-gray-600 mt-2'>Create your Smartcare account</p>
                    </div>

                    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 border border-gray-200 shadow-md rounded-md p-6 bg-white'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <div className='relative'>
                                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={18} />
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
                                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={18} />  
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
                                    placeholder="Password"
                                    className='pl-10 pr-10'
                                    {...register("password", authValidationRules.password)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                                    className='pl-10 pr-10'
                                    {...register("confirmPassword", getConfirmPasswordRule(password))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formState.errors.confirmPassword &&
                                <p className='text-red-500 text-sm mt-1'>{formState.errors.confirmPassword.message}</p>
                            }
                        </div>

                        {/* Data Consent Checkbox */}
                        <div className='space-y-2 pt-2'>
                            <div className='flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                                <div className='flex-shrink-0 mt-0.5'>
                                    <Shield className='h-5 w-5 text-blue-600' />
                                </div>
                                <div className='flex-1'>
                                    <div className='flex items-start'>
                                        <input
                                            id="dataConsent"
                                            type="checkbox"
                                            className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer flex-shrink-0'
                                            {...register("dataConsent", {
                                                required: "You must consent to data collection to register"
                                            })}
                                        />
                                        <label htmlFor="dataConsent" className='ml-3 text-sm text-gray-700 cursor-pointer'>
                                            <span className='font-medium text-gray-900'>I consent to the collection and processing of my health data</span>
                                            <p className='text-xs text-gray-600 mt-1.5 leading-relaxed'>
                                                By checking this box, you agree to allow SmartCare to collect, store, and process your health information for the purpose of monitoring your health, providing personalized care recommendations, and enabling emergency response services. Your data will be securely stored and used in accordance with our{' '}
                                                <Link href="/privacy-policy" className='text-blue-600 hover:underline'>
                                                    Privacy Policy
                                                </Link>.
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {formState.errors.dataConsent &&
                                <p className='text-red-500 text-sm pl-1'>{formState.errors.dataConsent.message}</p>
                            }
                        </div>

                        <Button
                            type='submit'
                            className='w-full bg-emerald-400 hover:bg-blue-950 disabled:bg-blue-300 transition-colors'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </Button>

                        <div className='text-center text-sm pt-2'>
                            <span className='text-gray-600'>Already have an account? </span>
                            <Link href="/login" className='text-blue-600 hover:text-blue-700 font-medium underline'>
                                Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Registration