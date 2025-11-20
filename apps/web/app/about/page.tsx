"use client"
import React from 'react'
import Header from '../components/ui/header'
import Footer from '../components/ui/Footer1'
import { HeartPulse, Target, Users, Lightbulb, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui"

const AboutUs = () => {
  const values = [
    {
      icon: <HeartPulse className="w-8 h-8 text-emerald-500" />,
      title: "Patient-Centered Care",
      description: "We put patients first, designing solutions that empower individuals to take control of their health journey."
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-emerald-500" />,
      title: "Innovation",
      description: "Leveraging cutting-edge technology and AI to provide smart, accessible healthcare solutions."
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      title: "Accessibility",
      description: "Making quality healthcare management available to everyone, regardless of location or technical expertise."
    },
    {
      icon: <Award className="w-8 h-8 text-emerald-500" />,
      title: "Excellence",
      description: "Committed to delivering the highest quality of care through continuous improvement and evidence-based practices."
    }
  ]

  const team = [
    {
      role: "Medical Experts",
      description: "Board-certified physicians specializing in chronic disease management"
    },
    {
      role: "AI Engineers",
      description: "Leading developers creating intelligent health monitoring algorithms"
    },
    {
      role: "Healthcare Designers",
      description: "UX specialists focused on creating intuitive, accessible interfaces"
    },
    {
      role: "Support Team",
      description: "Dedicated professionals providing 24/7 assistance to our users"
    }
  ]

  return (
    <div className='bg-slate-400 min-h-screen'>
      <Header />
      
      {/* Hero Section */}
      <div className="relative text-white p-10 py-20 overflow-hidden">
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
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-400 opacity-70 z-0"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About SmartCare</h1>
          <p className="text-xl md:text-2xl leading-relaxed">
            Revolutionizing chronic disease management through intelligent technology and compassionate care
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="p-8 md:p-12 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-emerald-500 mr-4" />
            <h2 className="text-3xl font-bold text-gray-800">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
            At SmartCare, we are dedicated to empowering individuals living with chronic conditions like diabetes and hypertension. 
            Our mission is to bridge the gap between patients and quality healthcare by providing an intelligent, user-friendly 
            platform that makes health monitoring accessible, accurate, and actionable. We believe that everyone deserves the 
            tools and support needed to live their healthiest life, regardless of their location or technical background.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 px-6 md:px-12 bg-gradient-to-r from-blue-950 to-emerald-700 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg leading-relaxed mb-4">
                SmartCare was born from a simple observation: managing chronic diseases shouldn't be complicated or 
                intimidating. Our founders, healthcare professionals and technologists, witnessed firsthand the challenges 
                patients face in monitoring their health conditions effectively.
              </p>
              <p className="text-lg leading-relaxed">
                We created SmartCare to transform this experience—combining artificial intelligence with intuitive design 
                to create a system that feels less like medical equipment and more like a trusted health companion. Today, 
                we're proud to serve thousands of patients, helping them take control of their health journey with confidence.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-emerald-500 rounded-full w-3 h-3 mt-2 mr-4"></div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">2023</h3>
                    <p>SmartCare platform launched with core monitoring features</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-emerald-500 rounded-full w-3 h-3 mt-2 mr-4"></div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">2024</h3>
                    <p>AI-powered analytics and multilingual support introduced</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-emerald-500 rounded-full w-3 h-3 mt-2 mr-4"></div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">2025</h3>
                    <p>Expanded to serve communities across multiple regions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Our Core Values</h2>
          <p className="text-lg text-center mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do at SmartCare
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      {value.icon}
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Our Team</h2>
          <p className="text-lg text-center mb-12 max-w-2xl mx-auto text-gray-700">
            A diverse group of passionate professionals committed to improving healthcare
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-emerald-50 p-6 rounded-xl hover:scale-105 transition-transform duration-300">
                <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">{member.role}</h3>
                <p className="text-gray-600 text-sm text-center">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-6 md:px-12 bg-gradient-to-r from-blue-950 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join Us on This Journey</h2>
          <p className="text-xl mb-8 leading-relaxed">
            Whether you're a patient looking to better manage your health, a healthcare provider seeking innovative 
            solutions, or a partner who shares our vision—we'd love to connect with you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/registration">
              <button className="bg-emerald-400 text-black rounded-md px-6 py-3 hover:bg-emerald-300 transition-colors duration-200 font-medium">
                Get Started Today
              </button>
            </a>
            <a href="/contact">
              <button className="bg-white text-blue-600 rounded-md px-6 py-3 hover:bg-gray-100 transition-colors duration-200 font-medium">
                Contact Us
              </button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default AboutUs