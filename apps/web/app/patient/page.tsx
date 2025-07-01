import React from 'react'
import {HeartPulse, Globe, TriangleAlert, MicVocal, MapPin, Star, Search } from 'lucide-react';
import Image from 'next/image';
function page() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex flex-row items-center gap-2">
          <HeartPulse color="#21a136" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">SmartCare Dashboard</h1>
        </div>

        <div className="flex flex-row items-center gap-6">
          <button className="flex flex-row bg-neutral-200 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors">
            <Globe color="#27b049" size={16} />
            <span className="text-sm font-medium">EN</span>
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/assets/avatar1.jpg"
              alt="Sarah Johnson"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">Sarah Johnson</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center px-4 py-6">
        {/* Patient Info Card */}
        <div className="shadow-lg bg-white flex flex-row justify-between items-center w-full max-w-4xl rounded-lg px-6 py-4 mb-6">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src="/assets/avatar1.jpg"
              alt="Sarah Johnson"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800">Sarah Johnson</h2>
              <p className="text-sm text-gray-600">
                Age: 34 | Patient ID: #12345
                <br />
                Last check-in: Today, 2:30 PM
              </p>
            </div>
          </div>

          <div className="flex bg-emerald-400 rounded-full items-center justify-center px-4 py-2">
            <span className="text-white font-medium text-sm">● Stable</span>
          </div>
        </div>

        {/* AI Health Alert */}
        <div className="shadow-lg bg-red-50 border-l-4 border-red-500 flex flex-col gap-4 w-full max-w-4xl rounded-lg px-6 py-4 mb-6">
          <div className="flex items-center gap-2">
            <TriangleAlert color="#dc2626" size={20} />
            <h3 className="text-red-600 font-bold text-lg">AI Health Alert</h3>
          </div>
          <p className="text-red-700 text-sm leading-relaxed">
            Your blood pressure readings have been consistently high for the past 3 days. Consider consulting with your
            doctor.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg w-fit text-sm font-medium transition-colors">
            Find Doctor Nearby
          </button>
        </div>

        {/* Enter Your Vitals */}
        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Enter Your Vitals</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Blood Pressure (mmHg)</label>
              <input
                type="text"
                placeholder="120 / 80"
                className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors">
                <MicVocal size={16} />
                Voice Input
              </button>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Blood Glucose (mg/dL)</label>
              <input
                type="text"
                placeholder="80 - 95"
                className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors">
                <MicVocal size={16} />
                Voice Input
              </button>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Heart Rate (BPM)</label>
              <input
                type="number"
                placeholder="72"
                className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors">
                <MicVocal size={16} />
                Voice Input
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Save Vitals
            </button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Blood Pressure (3 Weeks)</h4>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center border">
                <div className="text-center">
                  <div className="w-40 h-24 bg-gradient-to-r from-red-200 via-red-300 to-red-400 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-red-700 text-xs font-medium">
                      <div className="flex items-center justify-between w-32 text-xs">
                        <span>120/80</span>
                        <span>125/85</span>
                        <span>130/90</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Trending upward</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Blood Glucose (3 Weeks)</h4>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center border">
                <div className="text-center">
                  <div className="w-40 h-24 bg-gradient-to-r from-green-200 via-green-300 to-green-400 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-green-700 text-xs font-medium">
                      <div className="flex items-center justify-between w-32 text-xs">
                        <span>95</span>
                        <span>102</span>
                        <span>98</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Within normal range</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Heart Rate (3 Weeks)</h4>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center border">
                <div className="text-center">
                  <div className="w-40 h-24 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-orange-700 text-xs font-medium">
                      <div className="flex items-center justify-between w-32 text-xs">
                        <span>72</span>
                        <span>75</span>
                        <span>78</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Slightly elevated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Find Healthcare Providers */}
        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Find Healthcare Providers</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for doctors or specialties..."
                  className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">Dr. Michael Chen</h4>
                      <p className="text-sm text-gray-600">Cardiologist • 2.3 miles away</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1 text-sm font-medium transition-colors">
                      Book
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">4.8 (127 reviews)</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">St. Mary's Medical Center</h4>
                      <p className="text-sm text-gray-600">Emergency Care • 1.8 miles away</p>
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-1 text-sm font-medium transition-colors">
                      Directions
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">4.2 (89 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <MapPin size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">Interactive map will load here</p>
              <p className="text-gray-500 text-sm">Showing nearby healthcare providers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
