// app/resources/page.tsx
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { BookOpen, FileText, Video, Download, ExternalLink, Play, CheckCircle } from 'lucide-react'
import Header from '../components/ui/header'
import Footer from '../components/ui/Footer1'
import Link from 'next/link'

const ResourcesPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null)
  const [downloadedFiles, setDownloadedFiles] = useState<number[]>([])

  const educationalResources = [
    {
      id: 1,
      title: "Understanding Hypertension",
      description: "Comprehensive guide on managing high blood pressure, including lifestyle modifications and monitoring techniques.",
      type: "PDF Guide",
      icon: <FileText className="w-6 h-6" />,
      link: "https://www.who.int/publications/i/item/9789240081062"
    },
    {
      id: 2,
      title: "Diabetes Management 101",
      description: "Essential information about blood glucose monitoring, medication adherence, and dietary guidelines.",
      type: "PDF Guide",
      icon: <FileText className="w-6 h-6" />,
      link: "https://www.cdc.gov/diabetes/basics/diabetes.html"
    },
    {
      id: 3,
      title: "Healthy Living with Chronic Conditions",
      description: "Tips and strategies for maintaining quality of life while managing chronic diseases.",
      type: "Article",
      icon: <BookOpen className="w-6 h-6" />,
      link: "https://www.cdc.gov/chronicdisease/index.htm"
    }
  ]

  const videoTutorials = [
    {
      id: 1,
      title: "How to Use SmartCare App",
      description: "Step-by-step video tutorial on navigating the SmartCare platform and logging your vitals.",
      duration: "5 min",
      videoUrl: "https://youtu.be/-B-RVybvffU?si=hGWXszDqD4ychA-v"
    },
    {
      id: 2,
      title: "Voice Command Features",
      description: "Learn how to use voice commands to quickly input your health data hands-free.",
      duration: "3 min",
      videoUrl: "https://youtu.be/-B-RVybvffU?si=hGWXszDqD4ychA-v"
    },
    {
      id: 3,
      title: "Understanding Your Health Alerts",
      description: "What different alert types mean and when to seek medical attention.",
      duration: "19 min",
      videoUrl: "https://www.youtube.com/embed/-B-RVybvffU"
    }
  ]

  const downloadableResources = [
    {
      id: 1,
      title: "Medication Tracker Template",
      description: "Printable template to track your medications and dosage schedules.",
      size: "PDF - 2MB",
      fileName: "medication-tracker.pdf"
    },
    {
      id: 2,
      title: "Blood Pressure Log Sheet",
      description: "Weekly blood pressure tracking sheet for manual record keeping.",
      size: "PDF - 1.5MB",
      fileName: "blood-pressure-log.pdf"
    },
    {
      id: 3,
      title: "Emergency Contact Card",
      description: "Wallet-sized card to keep important medical information and contacts.",
      size: "PDF - 500KB",
      fileName: "emergency-contact-card.pdf"
    }
  ]

  // Function to handle file download simulation
  const handleDownload = (id: number, fileName: string) => {
    // Create a sample PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(SmartCare ${fileName}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    // Mark as downloaded
    setDownloadedFiles(prev => [...prev, id])

    // Show success message
    setTimeout(() => {
      setDownloadedFiles(prev => prev.filter(item => item !== id))
    }, 3000)
  }

  const externalLinks = [
    {
      id: 1,
      title: "World Health Organization - Hypertension",
      url: "https://www.who.int/health-topics/hypertension",
      description: "Official WHO resources on hypertension prevention and management"
    },
    {
      id: 2,
      title: "International Diabetes Federation",
      url: "https://idf.org/",
      description: "Global diabetes resources and research findings"
    },
    {
      id: 3,
      title: "Kenya Ministry of Health",
      url: "https://www.health.go.ke/",
      description: "Local health guidelines and services information"
    }
  ]

  return (
    <div className='bg-emerald-200 min-h-screen'>
      <Header />

      {/* Hero Section */}
      <div className="relative text-white p-10 md:p-16">

        {/* Video Background */}
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-emerald-700 opacity-70 z-0"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Health Resources</h1>
          <p className="text-lg md:text-xl">
            Access educational materials, tutorials, and tools to help you manage your health effectively
          </p>
        </div>
      </div>


      {/* Educational Resources Section */}
      <div className="p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Educational Materials</h2>
            <p className="text-lg text-gray-700">
              Learn more about managing chronic conditions with our comprehensive guides
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {educationalResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      {resource.icon}
                    </div>
                    <span className="text-sm font-medium text-emerald-600">{resource.type}</span>
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Read More <ExternalLink className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Video Tutorials Section */}
      <div className="p-8 md:p-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Video Tutorials</h2>
            <p className="text-lg text-gray-700">
              Watch step-by-step guides to get the most out of SmartCare
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {videoTutorials.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {selectedVideo === video.id ? (
                  <div className="relative bg-black h-48">
                    <iframe
                      width="100%"
                      height="100%"
                      src={video.videoUrl}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div
                    className="relative bg-gradient-to-br from-blue-500 to-emerald-500 h-48 flex items-center justify-center cursor-pointer group"
                    onClick={() => setSelectedVideo(video.id)}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform">
                        <Play className="w-12 h-12 text-blue-600" fill="currentColor" />
                      </div>
                      <p className="text-white font-medium mt-2">Click to Watch</p>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {video.duration}
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                  {selectedVideo === video.id ? (
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Close Video
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedVideo(video.id)}
                      className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" fill="currentColor" />
                      Watch Now
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Downloadable Resources Section */}
      <div className="p-8 md:p-12 bg-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Downloadable Tools</h2>
            <p className="text-lg text-gray-700">
              Printable templates and resources to support your health journey
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {downloadableResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                      <Download className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                      <span className="text-xs text-gray-500">{resource.size}</span>
                      <button
                        onClick={() => handleDownload(resource.id, resource.fileName)}
                        disabled={downloadedFiles.includes(resource.id)}
                        className={`mt-3 w-full py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${downloadedFiles.includes(resource.id)
                          ? 'bg-green-500 text-white cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        {downloadedFiles.includes(resource.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Downloaded
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* External Links Section */}
      <div className="p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Helpful External Resources</h2>
            <p className="text-lg text-gray-700">
              Trusted organizations providing additional health information
            </p>
          </div>

          <div className="space-y-4">
            {externalLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{link.title}</h3>
                      <p className="text-gray-600 text-sm">{link.description}</p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-4"
                    >
                      Visit <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-8 md:p-12 bg-gradient-to-r from-blue-950 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Support?</h2>
          <p className="text-lg mb-6">
            Our support team is here to help you navigate SmartCare and answer any questions
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-md hover:bg-gray-100 transition-colors font-medium">
                Contact Support
              </button>
            </Link>
            <Link href="/features">
              <button className="bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors font-medium">
                Explore Features
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ResourcesPage