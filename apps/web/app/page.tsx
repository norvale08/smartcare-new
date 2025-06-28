"use client"
import Image from "next/image"
import type React from "react"

import { HeartPulse, Stethoscope, MapPin, LineChartIcon as ChartLine, Video, Ambulance } from "lucide-react"

const page: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-w-screen">
    
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 py-4 mb-2">
        <h1 className="text-xl font-bold flex flex-row items-center gap-2">
          <HeartPulse color="#21a136" />
          SmartCare
        </h1>

        
        <nav className="flex-1 flex justify-center">
          <div className="flex gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-emerald-400 transition-colors duration-200"
            >
              Contact
            </button>
          </div>
        </nav>

        <div className="flex gap-4">
          <button className="text-emerald-400 hover:text-emerald-500 transition-colors duration-200">Login</button>
          <button className="bg-emerald-400 text-white rounded-md px-4 py-2 hover:bg-emerald-500 transition-colors duration-200">
            Get Started
          </button>
        </div>
      </header>

      
      <section className="p-2">
        <div className="bg-gradient-to-r from-emerald-200 to-white px-5 py-5 flex flex-row">
          <div className="w-1/2">
            <p className="text-3xl mb-6 animate-fade-in-up">
              Monitor Your
              <br /> Health
              <span className="text-emerald-400 font-bold">
                {" "}
                Anywhere,
                <br />
                Anytime
              </span>
            </p>
            <p className="mb-6 animate-fade-in-up animation-delay-200">
              Smart Care helps you track Chronic illnesses like diabetes
              <br /> with voice or text-input. Connect with doctors, Find nearby
              <br /> clinics, and access emergency services instantly
            </p>
            <button className="bg-emerald-400 text-white rounded-md px-4 py-2 hover:bg-emerald-500 transition-all duration-200 hover:scale-105 animate-fade-in-up animation-delay-400">
              Start Monitoring
            </button>
          </div>
          <div className="flex items-center justify-center shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] rounded-md p-4 bg-emerald-400 w-1/3 h-64 animate-fade-in-right">
            <Image src="/assets/doctor.png" alt="A lady Nurse" width={150} height={150} />
          </div>
        </div>
      </section>

    
      <section id="features" className="p-2">
        <div className="flex flex-col items-center justify-center mt-6">
          <h2 className="font-bold text-2xl mb-2">Comprehensive Health Monitoring</h2>
          <p className="text-gray-600">Everything you need to manage your chronic illnesses</p>
        </div>

        <div className="flex items-center justify-center flex-row mt-6 gap-6 px-4">
          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <HeartPulse color="#21a136" size={48} className="mb-4" />
            <h2 className="font-bold text-lg mb-3 text-center">Vital Signs Tracking</h2>
            <p className="text-center text-sm">
              Monitor blood pressure, glucose levels, and heart rate with voice or text input
            </p>
          </div>

          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animation-delay-200">
            <Stethoscope color="#21a136" size={48} className="mb-4" />
            <h2 className="font-bold text-lg mb-3 text-center">Doctor Consultations</h2>
            <p className="text-center text-sm">
              Connect with healthcare professionals for virtual consultations and advice
            </p>
          </div>

          <div className="feature-card shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animation-delay-400">
            <MapPin color="#21a136" size={48} className="mb-4" />
            <h2 className="font-bold text-lg mb-3 text-center">Emergency Services</h2>
            <p className="text-center text-sm">
              Quick access to nearby clinics and ambulance services based on your location
            </p>
          </div>
        </div>
      </section>

    
      <section id="how-it-works" className="p-2">
        <div className="flex flex-col items-center justify-center mt-12">
          <h1 className="font-bold text-2xl mb-2">How Smart Care Works</h1>
          <p className="text-gray-600">Simple Steps to better health management</p>
        </div>

        <div className="flex items-center justify-center flex-row mt-6 gap-6 px-4">
          <div className="step-card p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:scale-105 transition-all duration-300">
            <span className="bg-emerald-400 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 animate-bounce-slow">
              1
            </span>
            <h2 className="font-bold text-lg mb-3 text-center">Input Vitals</h2>
            <p className="text-center text-sm">
              Record your blood pressure, glucose and heart rate using voice or typing
            </p>
          </div>

          <div className="step-card p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-200">
            <span className="bg-emerald-400 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 animate-bounce-slow animation-delay-200">
              2
            </span>
            <h2 className="font-bold text-lg mb-3 text-center">AI Analysis</h2>
            <p className="text-center text-sm">Our AI analyzes your data and provides personalized insights</p>
          </div>

          <div className="step-card p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-400">
            <span className="bg-emerald-400 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 animate-bounce-slow animation-delay-400">
              3
            </span>
            <h2 className="font-bold text-lg mb-3 text-center">Get Alerts</h2>
            <p className="text-center text-sm">Receive notifications for irregular readings or medication reminders</p>
          </div>

          <div className="step-card p-6 flex items-center flex-col w-1/4 h-full min-h-[200px] hover:scale-105 transition-all duration-300 animation-delay-600">
            <span className="bg-emerald-400 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 animate-bounce-slow animation-delay-600">
              4
            </span>
            <h2 className="font-bold text-lg mb-3 text-center">Connect Care</h2>
            <p className="text-center text-sm">Access doctors, clinics or emergency services when needed</p>
          </div>
        </div>
      </section>

      <section id="services" className="p-2">
        <div className="flex flex-col items-center justify-center mt-12">
          <h1 className="font-bold text-2xl mb-2">Our Services</h1>
          <p className="text-gray-600">Comprehensive health care solutions at your fingertips</p>
        </div>

        <div className="flex items-center justify-center flex-row mt-6 gap-8 px-8">
          <div className="flex-1">
            <div className="service-item flex items-start gap-4 mb-8 hover:translate-x-2 transition-transform duration-300">
              <span className="bg-emerald-400 w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <ChartLine color="#ffffff" />
              </span>
              <div>
                <h2 className="font-bold text-lg mb-2">24/7 Health Monitoring</h2>
                <p className="text-gray-600">
                  Continuous tracking of your vital signs with real-time alerts and trend analysis.
                </p>
              </div>
            </div>

            <div className="service-item flex items-start gap-4 mb-8 hover:translate-x-2 transition-transform duration-300 animation-delay-200">
              <span className="bg-emerald-400 w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <Video color="#ffffff" />
              </span>
              <div>
                <h2 className="font-bold text-lg mb-2">Telemedicine Consultations</h2>
                <p className="text-gray-600">
                  Video calls with certified doctors and specialists from the comfort of your home
                </p>
              </div>
            </div>

            <div className="service-item flex items-start gap-4 mb-8 hover:translate-x-2 transition-transform duration-300 animation-delay-400">
              <span className="bg-emerald-400 w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0">
                <Ambulance color="#ffffff" />
              </span>
              <div>
                <h2 className="font-bold text-lg mb-2">Emergency Response</h2>
                <p className="text-gray-600">Instant access to emergency services and nearest medical facilities</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 animate-fade-in-left">
            <Image
              src="/assets/oldwoman.png"
              alt="An old woman"
              width={300}
              height={300}
              className="rounded-md shadow-lg"
            />
          </div>
        </div>
      </section>

      
      <section className="flex items-center justify-center flex-col mt-12 gap-6 bg-emerald-400 p-8 mx-2 rounded-lg">
        <h1 className="text-white text-2xl font-bold text-center">Ready to take control of your health?</h1>
        <p className="text-white text-center max-w-2xl">
          Join thousands of patients who trust Smart Care for their chronic illness management
        </p>
        <button className="bg-white text-emerald-400 rounded-md px-6 py-3 font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105">
          Start Monitoring
        </button>
      </section>

      
      <footer id="contact" className="flex items-center justify-center flex-col gap-8 bg-cyan-950 p-8 mt-8">
        <div className="flex flex-row gap-12 w-full max-w-6xl">
          <div className="flex-1">
            <h1 className="text-xl text-white font-bold flex flex-row items-center gap-2 mb-4">
              <HeartPulse color="#ffffff" />
              SmartCare
            </h1>
            <p className="text-cyan-300 leading-relaxed">
              Empowering patients to manage chronic illnesses with smart technology and compassionate care
            </p>
          </div>

          <div className="flex-1">
            <h1 className="text-white font-bold mb-4">Product</h1>
            <div className="space-y-2">
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Features</p>
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Pricing</p>
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Security</p>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-white font-bold mb-4">Support</h1>
            <div className="space-y-2">
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Help Center</p>
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Contact Us</p>
              <p className="text-cyan-300 hover:text-white cursor-pointer transition-colors">Privacy Policy</p>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-white font-bold mb-4">Contact</h1>
            <div className="space-y-2">
              <p className="text-cyan-300">1-800-SMART-CARE</p>
              <p className="text-cyan-300">support@smartcare.com</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl">
          <hr className="border-cyan-800 mb-4" />
          <p className="text-cyan-300 text-center">© 2025 Smart Care. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default page
