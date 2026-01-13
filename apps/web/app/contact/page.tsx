"use client"
import React, { useState } from 'react'
import {
    Clock,
    Zap,
    HeartPulse,
    Mail,
    Phone,
    MapPin,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

import Header from '../components/ui/header'
import Footer from '../components/ui/Footer1'
import Link from 'next/link'

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
    const [statusMessage, setStatusMessage] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async () => {
        // Validate form
        if (!formData.name || !formData.email || !formData.message) {
            setSubmitStatus('error')
            setStatusMessage('Please fill in all fields before submitting.')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setSubmitStatus('error')
            setStatusMessage('Please enter a valid email address.')
            return
        }

        setIsSubmitting(true)
        setSubmitStatus(null)

        try {
            // Call your API endpoint
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            console.log('Sending to:', `${API_URL}/api/send-email`)
            console.log('Data:', { name: formData.name, email: formData.email, message: formData.message })

            const response = await fetch(`${API_URL}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message
                })
            })

            console.log('Response status:', response.status)

            let data
            try {
                data = await response.json()
                console.log('Response data:', data)
            } catch (parseError) {
                console.error('Failed to parse response:', parseError)
                throw new Error('Invalid server response')
            }

            if (response.ok) {
                // Success
                setSubmitStatus('success')
                setStatusMessage(
                    `Thank you, ${formData.name}! Your message has been successfully sent to SmartCare. ` +
                    `We'll respond to ${formData.email} as soon as possible.`
                )

                // Clear form
                setFormData({
                    name: '',
                    email: '',
                    message: ''
                })
            } else {
                throw new Error(data.error || 'Failed to send message')
            }

        } catch (error) {
            // Error
            setSubmitStatus('error')
            let errorMessage = 'Oops! Something went wrong while sending your message. '

            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage += 'Unable to connect to the server. Please check if the API server is running.'
            } else if (error instanceof Error) {
                errorMessage += error.message
            } else {
                errorMessage += 'Please try again or contact us directly at smartcarehealthsystem@gmail.com.'
            }

            setStatusMessage(errorMessage)
            console.error('Error sending email:', error)
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className='min-h-screen bg-gradient-to-b from-slate-50 to-slate-100'>
            <Header />
            <div className='min-h-[70vh] bg-gray-50 py-16 px-4 sm:px-6 lg:px-8'>
                <div className="max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-2xl border border-gray-100">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Get In Touch</h1>
                        <p className="text-lg text-gray-600">
                            Have questions? We'd love to hear from you! Send us a message or find our contact information below.
                        </p>
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-green-800">{statusMessage}</p>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{statusMessage}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="p-6 bg-blue-50 rounded-lg">
                            <h2 className="text-2xl font-bold text-blue-800 mb-6">Send Us a Message</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-950 to-emerald-600 hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Message'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-8 p-6 lg:p-0">
                            <div className="flex items-start space-x-4">
                                <Phone className="flex-shrink-0 w-6 h-6 text-emerald-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                                    <p className="text-gray-600">Call us for immediate assistance.</p>
                                    {/* <p className="font-medium text-blue-700">1-800-SMART-CARE</p> */}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <Mail className="flex-shrink-0 w-6 h-6 text-emerald-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                                    <p className="text-gray-600">Send us a detailed email query.</p>
                                    <p className="font-medium text-blue-700">smartcarehealthsystem@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <MapPin className="flex-shrink-0 w-6 h-6 text-emerald-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                                    <p className="text-gray-600">SmartCare Technologies HQ</p>
                                    {/* <p className="font-medium text-blue-700">123 Health Ave, Wellness City, CA 90210</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ContactPage