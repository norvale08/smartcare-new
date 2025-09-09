"use client"
import React, { useState } from 'react'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { ChevronLeft, ChevronRight,} from 'lucide-react'
import Header from './components/ui/header'
import Link from 'next/link'

import Footer from './components/ui/footer'
const Home = () => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const features = [
    {
      id: 1,
      title: "Easy Vital Tracking",
      description: "Utilize our user-friendly interface to effortlessly log your vital signs. Whether through manual input or voice commands, tracking your health has never been simpler.",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    },
    {
      id: 2,
      title: "Google Maps Integration",
      description: "Quickly locate nearby healthcare providers with our integrated Google Maps feature. Find the support you need, right when you need it, ensuring you are never far from care.",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    },
    {
      id: 3,
      title: "Timely Alerts",
      description: "Receive immediate notifications for abnormal readings and risky health patterns. Stay informed and proactive about your health with our timely alerts.",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    }
  ]

  const testimonials = [
    {
      id: 1,
      title: "Life-Changing Support",
      content: "SmartCare has transformed how I manage my diabetes. The timely alerts and easy tracking have made a significant difference in my daily life."
    },
    {
      id: 2,
      title: "Accessibility Matters", 
      content: "Being able to use the app in Kiswahili has made it so much easier for my family to engage with their health, especially in our rural area."
    },
    {
      id: 3,
      title: "User-Friendly and Effective",
      content: "The interface is so intuitive! Logging my vitals is easy, and I appreciate the insights it provides to help me improve my health."
    }
  ]
  const steps =[
    { step: 1, title: "Input Vitals", desc: "Record blood pressure, glucose & heart rate manually or by voice." },
            { step: 2, title: "AI Analysis", desc: "AI analyzes your health patterns and provides personalized insights." },
            { step: 3, title: "Get Alerts", desc: "Notifications for abnormal readings or medication reminders." },
            { step: 4, title: "Connect Care", desc: "Access doctors, clinics, or emergency services when needed." },
  ]

  return (
    <div className='bg-slate-400 min-h-screen'>
      <Header></Header>
      {/* Hero Section */}
      <div className="relative bg-cover bg-center text-white p-10 h-[400px] bg-[url('/assets/laptop.png')]">
  {/* Semi-transparent gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-400 opacity-60 z-0"></div>

  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
    <p className="text-lg mb-4 max-w-xl">
      Empower yourself with our advanced health management system designed to help you track your vitals and receive timely alerts for chronic conditions like diabetes and hypertension
    </p>
    <h2 className="text-2xl font-bold mb-6">
      Welcome to the future of Chronic Disease Management
    </h2>
    <Link href="/registration">
      <button className="bg-emerald-400 text-black rounded-md px-3 lg:px-4 py-2 hover:bg-emerald-400 transition-colors duration-200 text-sm lg:text-base">
        Get Started
      </button>
    </Link>
  </div>
</div>


      {/* Features Section */}
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Health Management Features</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            Comprehensive tools to help you manage your health effectively
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto relative">
          {features[currentFeatureIndex] && (
            <Card className="h-full overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="flex flex-col md:flex-row h-full min-h-[300px] bg-pink-100">
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <CardTitle className="text-xl md:text-2xl mb-3">{features[currentFeatureIndex].title}</CardTitle>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{features[currentFeatureIndex].description}</p>
                  </div>
                  <div className="flex-1 relative min-h-[200px] md:min-h-[300px]">
                    <img 
                      src={features[currentFeatureIndex].image} 
                      alt={features[currentFeatureIndex].alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Navigation buttons - Outside the card */}
          {features.length > 1 && (
            <>
              <div className="absolute top-1/2 -translate-y-1/2 -left-16 hidden lg:block">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentFeatureIndex((prev) => prev === 0 ? features.length - 1 : prev - 1)}
                  className="rounded-full bg-white shadow-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 -right-16 hidden lg:block">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentFeatureIndex((prev) => prev === features.length - 1 ? 0 : prev + 1)}
                  className="rounded-full bg-white shadow-lg hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          {/* Mobile Navigation */}
          {features.length > 1 && (
            <div className="flex justify-center gap-4 mt-4 lg:hidden">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentFeatureIndex((prev) => prev === 0 ? features.length - 1 : prev - 1)}
                className="rounded-full bg-white shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentFeatureIndex((prev) => prev === features.length - 1 ? 0 : prev + 1)}
                className="rounded-full bg-white shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeatureIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentFeatureIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
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
        {steps.map((item)=>(
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
            Real experiences from individuals who have transformed their diabetes management with our system.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{testimonial.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{testimonial.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </div>
  )
}

export default Home