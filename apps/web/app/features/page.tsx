"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import {
  Activity,
  Bell,
  MapPin,
  MessageSquare,
  Smartphone,
  BarChart3,
  Heart,
  Shield,
  Clock,
  Users,
  FileText,
  Globe,
  Mic
} from 'lucide-react'
import Header from '../components/ui/header'
import Footer from '../components/ui/Footer1'
import Link from 'next/link'

const FeaturesPage = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const mainFeatures = [
    {
      id: 1,
      icon: <Activity className="w-12 h-12 text-emerald-500" />,
      title: "Easy Vital Tracking",
      description: "Log blood pressure, glucose levels, and heart rate with our intuitive interface. Support for both manual entry and voice commands makes tracking effortless.",
      details: [
        "Manual data entry with smart validation",
        "Voice-activated logging for hands-free operation",
        "Historical data visualization",
        "Export reports for healthcare providers"
      ],
      image: "/assets/doctorVideo2.mp4",
      isVideo: true
    },
    {
      id: 2,
      icon: <Bell className="w-12 h-12 text-blue-500" />,
      title: "Intelligent Alerts",
      description: "Receive real-time notifications for abnormal readings, medication reminders, and health pattern changes.",
      details: [
        "Instant alerts for critical readings",
        "Customizable notification preferences",
        "Medication reminder system",
        "Pattern recognition for early warning"
      ],
      image: "/assets/doctorVideo2.mp4",
      isVideo: true
    },
    {
      id: 3,
      icon: <MapPin className="w-12 h-12 text-red-500" />,
      title: "Healthcare Locator",
      description: "Find nearby clinics, pharmacies, and healthcare providers with integrated Google Maps functionality.",
      details: [
        "Real-time location-based search",
        "Provider ratings and reviews",
        "Direct navigation to facilities",
        "Emergency services quick access"
      ],
      image: "/assets/doctorVideo2.mp4",
      isVideo: true
    },
    {
      id: 4,
      icon: <BarChart3 className="w-12 h-12 text-purple-500" />,
      title: "AI-Powered Analytics",
      description: "Advanced artificial intelligence analyzes your health data to provide personalized insights and predictions.",
      details: [
        "Trend analysis and predictions",
        "Personalized health recommendations",
        "Risk assessment algorithms",
        "Progress tracking dashboards"
      ],
      image: "/assets/doctorVideo2.mp4",
      isVideo: true
    },
    {
      id: 5,
      icon: <MessageSquare className="w-12 h-12 text-orange-500" />,
      title: "Multilingual Support",
      description: "Access the platform in English and Kiswahili, ensuring healthcare accessibility for diverse communities.",
      details: [
        "Full English interface",
        "Complete Kiswahili translation",
        "Voice commands in both languages",
        "Cultural sensitivity in health advice"
      ],
      image: "/assets/multilingual.png",
      isVideo: false
    },
    {
      id: 6,
      icon: <Mic className="w-12 h-12 text-pink-500" />,
      title: "Voice Input System",
      description: "Hands-free health data entry using advanced voice recognition technology. Simply speak your vitals and let the system do the rest.",
      details: [
        "Voice-activated vital signs entry",
        "Support for English and Kiswahili",
        "Natural language processing",
        "Hands-free operation for accessibility"
      ],
      image: "/assets/voice-input-screenshot.png",
      isVideo: false
    },
    {
      id: 7,
      icon: <Shield className="w-12 h-12 text-indigo-500" />,
      title: "Secure & Private",
      description: "Your health data is protected with enterprise-grade encryption and HIPAA-compliant security measures.",
      details: [
        "End-to-end encryption",
        "HIPAA compliance",
        "Secure cloud storage",
        "Privacy-first architecture"
      ],
      image: "/assets/doctorVideo2.mp4",
      isVideo: true
    }
  ]

  const additionalFeatures = [
    {
      icon: <Clock className="w-8 h-8 text-emerald-500" />,
      title: "24/7 Monitoring",
      description: "Round-the-clock health tracking with continuous data synchronization"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Family Sharing",
      description: "Share health data with family members and caregivers securely"
    },
    {
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      title: "Health Reports",
      description: "Generate comprehensive reports for doctor visits"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Lifestyle Tips",
      description: "Personalized diet, exercise, and lifestyle recommendations"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-orange-500" />,
      title: "Device Integration",
      description: "Connect with popular health devices and wearables"
    },
    {
      icon: <Globe className="w-8 h-8 text-indigo-500" />,
      title: "Telemedicine Ready",
      description: "Seamlessly connect with healthcare providers remotely"
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-blue-100'>
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-950 to-emerald-700 text-white py-20 px-6">
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

        <div className="relative z-10 container mx-auto px-4 py-5 lg:py-5">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for Better Health
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto">
              Discover how SmartCare empowers you to take control of your chronic disease management with cutting-edge technology and compassionate care.
            </p>
            <Link href="/registration">
              <button className="bg-emerald-400 text-black rounded-md px-8 py-3 hover:bg-emerald-300 transition-colors duration-200 text-lg font-medium">
                Start Your Journey
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Core Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage hypertension and diabetes effectively
          </p>
        </div>

        <div className="space-y-12">
          {mainFeatures.map((feature, index) => {
            const isEven = index % 2 === 0;
            return (
              <Card
                key={feature.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-2xl ${hoveredCard === feature.id ? 'scale-[1.02]' : ''
                  }`}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Content Section */}
                  <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-base lg:text-lg mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-3">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start text-sm lg:text-base text-gray-700">
                          <span className="text-emerald-500 mr-3 text-xl">✓</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Media Section */}
                  <div className="flex-1 relative min-h-[300px] lg:min-h-[400px]">
                    {feature.isVideo ? (
                      <video
                        src={feature.image}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Additional Benefits
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              More features designed to support your health journey
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-950 to-emerald-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Health Management?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join thousands of users who are taking control of their chronic conditions with SmartCare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registration">
              <button className="bg-emerald-400 text-black rounded-md px-8 py-3 hover:bg-emerald-300 transition-colors duration-200 text-lg font-medium">
                Get Started Free
              </button>
            </Link>
            <Link href="/contact">
              <button className="bg-white text-blue-950 rounded-md px-8 py-3 hover:bg-gray-100 transition-colors duration-200 text-lg font-medium">
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default FeaturesPage