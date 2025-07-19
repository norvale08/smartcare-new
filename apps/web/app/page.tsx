"use client"
import Image from "next/image"
import type React from "react"
import Link from "next/link"

import { HeartPulse, Stethoscope, MapPin, LineChartIcon as ChartLine, Video, Ambulance, Menu, X } from "lucide-react"
import { useState } from "react"

const page: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false) // Close mobile menu after navigation
  }

  return (
    <div className="min-w-screen">
    
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 mb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold flex flex-row items-center gap-2">
            <HeartPulse color="#1e3a8a" size={20} />
            <span className="hidden sm:inline">SmartCare</span>
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center">
            <div className="flex gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="hover:text-blue-400 transition-colors duration-200"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Contact
              </button>
            </div>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden sm:flex gap-2 lg:gap-4">
            <Link href="/login" className="text-blue-900 hover:text-emerald-500 transition-colors duration-200 font-semibold text-sm lg:text-base py-2">
              Login
            </Link>
            <Link href="/registration">
              <button className="bg-blue-900 text-white rounded-md px-3 lg:px-4 py-2 hover:bg-emerald-400 transition-colors duration-200 text-sm lg:text-base">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 mt-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left hover:text-blue-400 transition-colors duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left hover:text-blue-400 transition-colors duration-200"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-left hover:text-blue-400 transition-colors duration-200"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left hover:text-blue-400 transition-colors duration-200"
              >
                Contact
              </button>
              <div className="flex flex-col sm:hidden gap-2 pt-4 border-t border-gray-200">
                <Link href="/login" className="text-blue-900 hover:text-emerald-500 transition-colors duration-200 font-semibold">
                  Login
                </Link>
                <Link href="/registration">
                  <button className="bg-blue-900 text-white rounded-md px-4 py-2 hover:bg-emerald-400 transition-colors duration-200 w-full">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      
      <section className="p-2 sm:p-4">
        <div className="bg-gradient-to-r from-blue-800 to-white px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <p className="text-2xl sm:text-3xl lg:text-4xl mb-4 lg:mb-6 animate-fade-in-up text-white leading-tight">
              Monitor Your
              <br /> Health
              <span className="text-blue-400 font-bold">
                {" "}
                Anywhere,
                <br />
                Anytime
              </span>
            </p>
            <p className="mb-4 lg:mb-6 animate-fade-in-up animation-delay-200 text-white text-sm sm:text-base">
              Smart Care helps you track Chronic illnesses like diabetes
              with voice or text-input. Connect with doctors, Find nearby
              clinics, and access emergency services instantly
            </p>
            <button className="bg-blue-500 text-white rounded-md px-6 py-3 hover:bg-emerald-500 transition-all duration-200 hover:scale-105 animate-fade-in-up animation-delay-400 text-sm sm:text-base">
              Start Monitoring
            </button>
          </div>
          <div className="flex items-center justify-center shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] rounded-md p-4 bg-blue-900 w-full max-w-xs lg:w-1/3 lg:max-w-none h-48 sm:h-56 lg:h-64 animate-fade-in-right">
            <Image src="/assets/doctor.png" alt="A lady Nurse" width={120} height={120} className="sm:w-[140px] sm:h-[140px] lg:w-[150px] lg:h-[150px]" />
          </div>
        </div>
      </section>

    
      <section id="features" className="p-2 sm:p-4">
        <div className="flex flex-col items-center justify-center mt-6 lg:mt-8 px-4">
          <h2 className="font-bold text-xl sm:text-2xl mb-2 text-center">Comprehensive Health Monitoring</h2>
          <p className="text-gray-600 text-center text-sm sm:text-base">Everything you need to manage your chronic illnesses</p>
        </div>

        <div className="flex items-stretch justify-center flex-col sm:flex-row mt-6 lg:mt-8 gap-4 sm:gap-6 px-4">
          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-blue-800 rounded-md p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/3 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <HeartPulse color="#ffffff" size={40} className="sm:w-12 sm:h-12 mb-4" />
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center text-white">Vital Signs Tracking</h2>
            <p className="text-center text-xs sm:text-sm text-white">
              Monitor blood pressure, glucose levels, and heart rate with voice or text input
            </p>
          </div>

          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-blue-800 rounded-md p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/3 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animation-delay-200">
            <Stethoscope color="#ffffff" size={40} className="sm:w-12 sm:h-12 mb-4" />
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center text-white">Doctor Consultations</h2>
            <p className="text-center text-xs sm:text-sm text-white">
              Connect with healthcare professionals for virtual consultations and advice
            </p>
          </div>

          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-blue-800 rounded-md p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/3 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animation-delay-400">
            <MapPin color="#ffffff" size={40} className="sm:w-12 sm:h-12 mb-4" />
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center text-white">Emergency Services</h2>
            <p className="text-center text-xs sm:text-sm text-white">
              Quick access to nearby clinics and ambulance services based on your location
            </p>
          </div>
        </div>
      </section>

    
      <section id="how-it-works" className="p-2 sm:p-4">
        <div className="flex flex-col items-center justify-center mt-8 lg:mt-12 px-4">
          <h1 className="font-bold text-xl sm:text-2xl mb-2 text-center">How Smart Care Works</h1>
          <p className="text-gray-600 text-center text-sm sm:text-base">Simple Steps to better health management</p>
        </div>

        <div className="flex items-stretch justify-center flex-col sm:flex-row lg:flex-row mt-6 lg:mt-8 gap-4 sm:gap-6 px-4">
          <div className="step-card p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/2 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:scale-105 transition-all duration-300">
            <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg mb-4 animate-bounce-slow">
              1
            </span>
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center">Input Vitals</h2>
            <p className="text-center text-xs sm:text-sm">
              Record your blood pressure, glucose and heart rate using voice or typing
            </p>
          </div>

          <div className="step-card p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/2 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-200">
            <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg mb-4 animate-bounce-slow animation-delay-200">
              2
            </span>
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center">AI Analysis</h2>
            <p className="text-center text-xs sm:text-sm">Our AI analyzes your data and provides personalized insights</p>
          </div>

          <div className="step-card p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/2 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-400">
            <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg mb-4 animate-bounce-slow animation-delay-400">
              3
            </span>
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center">Get Alerts</h2>
            <p className="text-center text-xs sm:text-sm">Receive notifications for irregular readings or medication reminders</p>
          </div>

          <div className="step-card p-4 sm:p-6 flex items-center flex-col w-full sm:w-1/2 lg:w-1/4 min-h-[180px] sm:min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-600">
            <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg mb-4 animate-bounce-slow animation-delay-600">
              4
            </span>
            <h2 className="font-bold text-base sm:text-lg mb-3 text-center">Connect Care</h2>
            <p className="text-center text-xs sm:text-sm">Access doctors, clinics or emergency services when needed</p>
          </div>
        </div>
      </section>

      <section id="services" className="p-2 sm:p-4">
        <div className="flex flex-col items-center justify-center mt-8 lg:mt-12 px-4">
          <h1 className="font-bold text-xl sm:text-2xl mb-2 text-center">Our Services</h1>
          <p className="text-gray-600 text-center text-sm sm:text-base">Comprehensive health care solutions at your fingertips</p>
        </div>

        <div className="flex items-center justify-center flex-col lg:flex-row mt-6 lg:mt-8 gap-6 lg:gap-8 px-4 lg:px-8">
          <div className="flex-1 w-full">
            <div className="service-item flex items-start gap-4 mb-6 lg:mb-8 hover:translate-x-2 transition-transform duration-300">
              <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <ChartLine color="#ffffff" size={20} className="sm:w-6 sm:h-6" />
              </span>
              <div>
                <h2 className="font-bold text-base sm:text-lg mb-2">24/7 Health Monitoring</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Continuous tracking of your vital signs with real-time alerts and trend analysis.
                </p>
              </div>
            </div>

            <div className="service-item flex items-start gap-4 mb-6 lg:mb-8 hover:translate-x-2 transition-transform duration-300 animation-delay-200">
              <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <Video color="#ffffff" size={20} className="sm:w-6 sm:h-6" />
              </span>
              <div>
                <h2 className="font-bold text-base sm:text-lg mb-2">Telemedicine Consultations</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Video calls with certified doctors and specialists from the comfort of your home
                </p>
              </div>
            </div>

            <div className="service-item flex items-start gap-4 mb-6 lg:mb-8 hover:translate-x-2 transition-transform duration-300 animation-delay-400">
              <span className="bg-blue-800 w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <Ambulance color="#ffffff" size={20} className="sm:w-6 sm:h-6" />
              </span>
              <div>
                <h2 className="font-bold text-base sm:text-lg mb-2">Emergency Response</h2>
                <p className="text-gray-600 text-sm sm:text-base">Instant access to emergency services and nearest medical facilities</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 animate-fade-in-left order-first lg:order-last">
            <Image
              src="/assets/oldwoman.png"
              alt="An old woman"
              width={250}
              height={250}
              className="sm:w-[280px] sm:h-[280px] lg:w-[300px] lg:h-[300px] rounded-md shadow-lg"
            />
          </div>
        </div>
      </section>

      
      <section className="flex items-center justify-center flex-col mt-8 lg:mt-12 gap-4 lg:gap-6 bg-blue-800 p-6 lg:p-8 mx-2 rounded-lg">
        <h1 className="text-white text-xl sm:text-2xl font-bold text-center">Ready to take control of your health?</h1>
        <p className="text-white text-center max-w-2xl text-sm sm:text-base">
          Join thousands of patients who trust Smart Care for their chronic illness management
        </p>
        <button className="bg-white text-blue-800 rounded-md px-6 py-3 font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 text-sm sm:text-base">
          Start Monitoring
        </button>
      </section>

      
      <footer id="contact" className="flex items-center justify-center flex-col gap-6 lg:gap-8 bg-cyan-950 p-6 lg:p-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-6xl">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-lg sm:text-xl text-white font-bold flex flex-row items-center justify-center lg:justify-start gap-2 mb-4">
              <HeartPulse color="#ffffff" size={20} />
              SmartCare
            </h1>
            <p className="text-cyan-300 leading-relaxed text-sm sm:text-base">
              Empowering patients to manage chronic illnesses with smart technology and compassionate care
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 flex-1 lg:flex-none">
            <div className="text-center lg:text-left">
              <h1 className="text-white font-bold mb-4">Product</h1>
              <div className="space-y-2">
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Features</p>
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Pricing</p>
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Security</p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-white font-bold mb-4">Support</h1>
              <div className="space-y-2">
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Help Center</p>
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Contact Us</p>
                <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm">Privacy Policy</p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-white font-bold mb-4">Contact</h1>
              <div className="space-y-2">
                <p className="text-cyan-300 text-sm">1-800-SMART-CARE</p>
                <p className="text-cyan-300 text-sm">support@smartcare.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl">
          <hr className="border-cyan-800 mb-4" />
          <p className="text-cyan-300 text-center text-sm">© 2025 Smart Care. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default page