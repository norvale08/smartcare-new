import React from 'react'
import {HeartPulse, Globe, TriangleAlert } from 'lucide-react';
import Image from 'next/image';
function page() {
  return (
    <div  className='min-h-screen bg-gray-100'>
                        <header className="flex justify-between items-center px-8 py-4 bg-white border-black">
                    
                    <div className="flex flex-row items-center gap-2">
                        <HeartPulse color="#21a136" />
                        <h1>SmartCare Dashboard</h1>
                    </div>

                    
                    <div className="flex flex-row items-center gap-6">
                        <button className="flex flex-row bg-neutral-200 items-center justify-center gap-1 px-3 py-1 rounded-lg">
                        <Globe color="#27b049" />
                        <span>Eng</span>
                        </button>
                        <Image
                        src="/assets/avatar1.jpg"
                        alt="picture of a woman"
                        width={100}
                        height={50}
                        className="rounded-full"
                        />
                        <h1>Sarah Johnson</h1>
                    </div>
                    </header>
                    <div className='flex flex-col items-center justify-center '>
                        <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] bg-white flex flex-row gap-12 w-3/4 rouded-md px-8 py-4 mt-4'>
                            {/* left side */}
                            <div className='flex flex-row gap-2'> 
                                 <Image
                                src="/assets/avatar1.jpg"
                                alt="picture of a woman"
                                width={100}
                                height={50}
                                className="rounded-full flex items-start"
                                  /> 
                                  <div className='flex flex-col'>
                                    <h1>Sarah Johnson</h1>
                                <p>Age:24 | Patient ID:#12345<br />
                                Last Check-in:Today,2:30PM</p>
                                  </div>

                                
                            </div>
                            {/* right side */}
                            <div className='flex  bg-emerald-400 rounded-lg items-center justify-center px-3 py-1'>
                                <p>Stable</p>
                            </div>
                            
                        </div>
                        <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] bg-red-100 border-red-700 border-2 flex flex-col gap-4 w-3/4 rounded-md px-8 py-4 mt-4'>
                        <h1 className='text-red-600 font-bold'> <TriangleAlert color="#a72416" />AI Health Alert</h1>
                        <p className='text-red-600 '>Your blood pressure readings have been consistently high for the
                            past three days.Consider consulting with your doctor
                        </p>
                        <button className='bg-red-700 text-white px-3 py-2 rounded-md w-1/4'>Find Doctor Nearby</button>

                        </div>

                    </div>

    </div>
  )
}

export default page
