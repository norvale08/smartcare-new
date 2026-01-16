//page.tsx
"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { ChevronLeft, ChevronRight, MessageSquare, Heart, Mic, Activity, Loader2, Clock, Users, Shield, Smartphone, MapPin, Bell, TrendingUp, Award, CheckCircle, Mail, Phone, AlertCircle } from 'lucide-react'
import Header from './components/ui/header'
import Link from 'next/link'
import Footer from './components/ui/Footer1'

const Home = () => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<number>(0);
  const [statsVisible, setStatsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    const handleScroll = () => {
      const statsSection = document.getElementById('stats-section')
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          setStatsVisible(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      clearInterval(interval)
      window.removeEventListener('scroll', handleScroll)
    }
  }, []);

  const features = [
    {
      title: "Easy Vital Tracking",
      icon: Activity,
      color: "emerald",
      description: "Utilize our user-friendly interface to effortlessly log your vital signs. Whether through manual input or voice commands, tracking your health has never been simpler.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Easy vital tracking demonstration"
    },
    {
      title: "Google Maps Integration",
      icon: MapPin,
      color: "red",
      description: "Quickly locate nearby healthcare providers with our integrated Google Maps feature. Find the support you need, right when you need it, ensuring you are never far from care.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Google Maps integration demonstration"
    },
    {
      title: "Voice Input System",
      icon: Mic,
      color: "purple",
      description: "Hands-free health data entry using advanced voice recognition technology. Simply speak your vitals and let the system do the rest.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Voice Input System demonstration"
    },
    {
      title: "Timely Alerts",
      icon: Bell,
      color: "red",
      description: "Receive immediate notifications for abnormal readings and risky health patterns. Stay informed and proactive about your health with our timely alerts.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Alert system demonstration"
    },
    {
      title: "Multilingual Support",
      icon: MessageSquare,
      color: "orange",
      description: "Access the platform in English and Kiswahili, ensuring healthcare accessibility for diverse communities.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Multilingual Support demonstration"
    },
    {
      title: "Secure & Private",
      icon: Shield,
      color: "blue",
      description: "Your health data is protected with enterprise-grade encryption and HIPAA-compliant security measures.",
      video: "/assets/doctorVideo2.mp4",
      alt: "Secure & Private demonstration"
    },
    {
      title: "AI-Powered Insights",
      icon: TrendingUp,
      color: "purple",
      description: "Get personalized health recommendations based on your data patterns. Our AI analyzes trends and provides actionable insights to improve your wellbeing.",
      video: "/assets/doctorVideo2.mp4",
      alt: "AI recommendations demonstration"
    }
  ]

  const testimonials = [
    {
      id: 1,
      title: "Life-Changing Support",
      content: "SmartCare has transformed how I manage my diabetes. The timely alerts and easy tracking have made a significant difference in my daily life.",
      name: "Sarah M.",
      condition: "Type 2 Diabetes"
    },
    {
      id: 2,
      title: "Accessibility Matters",
      content: "Being able to use the app in Kiswahili has made it so much easier for my family to engage with their health, especially in our rural area.",
      name: "James K.",
      condition: "Hypertension"
    },
    {
      id: 3,
      title: "User-Friendly and Effective",
      content: "The interface is so intuitive! Logging my vitals is easy, and I appreciate the insights it provides to help me improve my health.",
      name: "Mary W.",
      condition: "Both Conditions"
    }
  ]



  const steps = [
    { step: 1, title: "Input Vitals", desc: "Record blood pressure, glucose & heart rate manually or by voice.", icon: Activity },
    { step: 2, title: "AI Analysis", desc: "AI analyzes your health patterns and provides personalized insights.", icon: TrendingUp },
    { step: 3, title: "Get Alerts", desc: "Notifications for abnormal readings or medication reminders.", icon: Bell },
    { step: 4, title: "Connect Care", desc: "Access doctors, clinics, or emergency services when needed.", icon: Heart },
  ]

  const hasFeatures = features && features.length > 0;
  const feature = features[currentFeature]!;
  const IconComponent = feature.icon;

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length)
  }

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length)
  }


  //Contact form
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
      // Call API endpoint
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
    <div className='bg-emerald-200 min-h-screen'>
      <Header />

      {/* Hero Section with Video Background */}
      <div className="relative text-white p-4 sm:p-6 md:p-8 lg:p-10 h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/assets/doctorVideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Semi-transparent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-400 opacity-60 z-0"></div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="inline-block mb-2 sm:mb-3 md:mb-4 px-3 py-1 sm:px-4 sm:py-2 bg-emerald-400/20 rounded-full backdrop-blur-sm">
            <span className="text-emerald-300 font-semibold text-xs sm:text-sm md:text-base">Healthcare Innovation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 leading-snug sm:leading-tight">
            Welcome to the Future of <span className="text-emerald-400 block sm:inline">Chronic Disease Management</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            Empower yourself with our advanced health management system designed to help you track your vitals and receive timely alerts for chronic conditions like diabetes and hypertension
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-center">
            <Link href="/registration" className="w-full sm:w-auto">
              <button className="bg-emerald-400 text-black rounded-md px-4 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 hover:bg-emerald-300 transition-colors duration-200 text-sm sm:text-base font-medium w-full sm:w-auto">
                Get Started
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-white text-blue-600 rounded-md px-4 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 hover:bg-gray-200 hover:scale-105 hover:shadow-lg transition-all duration-300 transform text-sm sm:text-base font-medium w-full sm:w-auto">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-gray-900">Powerful Health Management Features</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            Comprehensive tools to help you manage your health effectively
          </p>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div
            className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
              }`}
          >
            {hasFeatures && (
              <>
                <Card className="h-full overflow-hidden">
                  <CardContent className="p-0 h-full">
                    <div className="flex flex-col lg:flex-row h-full bg-pink-100">
                      {/* Text Section */}
                      <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${feature.color}-100 mb-6`}>
                          <IconComponent className={`text-${feature.color}-600`} size={32} />
                        </div>
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-gray-800">
                          {feature.title}
                        </CardTitle>
                        <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
                          {feature.description}
                        </p>
                        <Link href='features'><button className="mt-6 text-blue-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                          Learn More <ChevronRight size={20} />
                        </button>
                        </Link>
                      </div>

                      {/* Video Section */}
                      <div className="w-full lg:w-1/2 relative min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]">
                        <video
                          src={feature.video}
                          className="w-full h-full object-cover rounded-b-md lg:rounded-r-md lg:rounded-bl-none"
                          autoPlay
                          muted
                          loop
                          playsInline
                          aria-label={feature.alt}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={prevFeature}
                    className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* Progress indicators */}
                  <div className="flex justify-center space-x-2 mt-4 lg:mt-6">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentFeature ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextFeature}
                    className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Understanding Section */}
      <div className='py-16 px-6 md:px-12 bg-gradient-to-r from-blue-950 to-emerald-700 text-white'>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">How SmartCare Works</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Simple Steps to better health management
          </p>
        </div>
        <div className='grid gap-8 md:grid-cols-4'>
          {steps.map((item) => (
            <div key={item.step} className="bg-white text-gray-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
              <div className="bg-emerald-500 w-12 h-12 flex items-center justify-center text-white font-bold text-xl rounded-full mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">What Our Users Say</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Real experiences from individuals who have transformed their chronic disease management with our system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full p-4 shadow-xl shadow-gray-500">
              <CardHeader>
                <CardTitle className="text-lg">{testimonial.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow flex flex-col">
                <p className="text-muted-foreground italic mb-4 flex-grow">"{testimonial.content}"</p>
                <p className="text-right text-gray-900 font-semibold">- {testimonial.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className='min-h-[70vh] bg-gray-50 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8'>
        <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl border border-gray-100">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-800 mb-3 sm:mb-4">Get In Touch</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2 sm:px-0">
              Have questions? We'd love to hear from you! Send us a message or find our contact information below.
            </p>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2 sm:space-x-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-green-800">{statusMessage}</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-red-800">{statusMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {/* Contact Form */}
            <div className="p-4 sm:p-6 md:p-8 bg-blue-50 rounded-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="Angel Aluma"
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
                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="angel@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                    className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 text-sm sm:text-base border border-transparent rounded-full shadow-md font-medium text-white bg-gradient-to-r from-blue-950 to-emerald-600 hover:shadow-xl transition-all transform hover:-translate-y-0.5 sm:hover:-translate-y-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-0">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Phone className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-0.5 sm:mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Phone</h3>
                  <p className="text-sm sm:text-base text-gray-600">Call us for immediate assistance.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <Mail className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-0.5 sm:mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Email</h3>
                  <p className="text-sm sm:text-base text-gray-600">Send us a detailed email query.</p>
                  <p className="text-sm sm:text-base font-medium text-blue-700 break-words">smartcarehealthsystem@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <MapPin className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-0.5 sm:mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Location</h3>
                  <p className="text-sm sm:text-base text-gray-600">SmartCare Technologies HQ</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-lg text-gray-700">
                <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900">Follow Us</h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6">Stay connected with us on social media</p>
                <div className="flex gap-3 sm:gap-4">
                  <a href="#" className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 rounded-full hover:bg-white/30 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 rounded-full hover:bg-white/30 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 rounded-full hover:bg-white/30 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </div >
  )
}

export default Home