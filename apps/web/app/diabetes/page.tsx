"use client"
import React, { useState } from 'react'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Home = () => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const features = [
    {
      id: 1,
      title: "Receive Real-Time Alerts",
      description: "Stay informed with instant alerts from Llama, ensuring you never miss a critical update regarding your health status.",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    },
    {
      id: 2,
      title: "Track Your Vitals",
      description: "Easily log your blood sugar levels, medication intake, and other vital statistics to maintain a comprehensive health record. Learn More",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    },
    {
      id: 3,
      title: "User-Friendly Interface",
      description: "Navigate through our intuitive design that makes logging and managing your diabetes data effortless and efficient.",
      image: "/assets/laptop.png",
      alt: "Diabetes management system"
    }
  ]

  const testimonials = [
    {
      id: 1,
      title: "Empowering Experience",
      content: "Using this system has completely changed how I manage my diabetes. The alerts keep me on track, and I feel more in control than ever before."
    },
    {
      id: 2,
      title: "Life-Changing Alerts", 
      content: "The real-time alerts from Llama have been a game changer for me. I never have to worry about forgetting to check my levels again."
    },
    {
      id: 3,
      title: "User-Friendly and Effective",
      content: "The interface is so intuitive! Logging my vitals is easy, and I appreciate the insights it provides to help me improve my health."
    }
  ]
  const systems =[
    {
      id:1,
      description:"Smart Alerts  for Better Management ",
      image:"/assets/laptop.png",
      alt:"understanding system"
    },
     {
      id:2,
      description:"Personalized Insights",
      image:"/assets/laptop.png",
      alt:"understanding system"
    },
     {
      id:3,
      description:"Seasless Data Enty",
      image:"/assets/laptop.png",
      alt:"understanding system"
    },


  ]

  return (
    <div className='bg-slate-400 min-h-screen'>
      {/* Hero Section */}
      <div className="relative bg-cover bg-center text-white p-10 h-[400px] bg-[url('/assets/laptop.png')]">
        <div className="absolute inset-0 bg-blue-950 bg-opacity-60 z-0"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg mb-4 max-w-xl">
            Empower yourself with our advanced diabetes management system designed to help you track your vitals and receive timely alerts
          </p>
          <h2 className="text-2xl font-bold mb-6">
            Welcome to the future of Diabetes Management
          </h2>
          <Button className="bg-blue-800">Track Vitals</Button>
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
      <div className='p-8'>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Understanding Our System</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Learn how our diabetes management system simplifies the way you monitor your health.
        </p>
      </div>
      <div>
        {systems.map((system)=>(
          <Card key={system.id} className='h-full'>
            <CardContent>
             <div className='flex flex-row' >

              </div> 
            </CardContent>

          </Card>
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
    </div>
  )
}

export default Home