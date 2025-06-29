import React from 'react'
import {HeartPulse, Globe, TriangleAlert, MicVocal } from 'lucide-react';
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
                            <div className='flex  bg-emerald-400 rounded-lg items-center justify-center px-2 py-1'>
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
                        <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] bg-white flex flex-row w-3/4 rounded-md mt-4 px-8 py-4 gap-4'>
                             <div className='flex flex-col'>
                               <h1 >Enter Your Vitals</h1>
                             </div>
                            
                            <div></div>
                            <div className='flex flex-col'>
                                <p>Blood Pressure(mmHg)</p>
                                <input type='number' placeholder='80' className='border-2 border-gray-400 rounded-md mb-2 mt-2'/>
                                <button className='bg-emerald-400 text-white rounded-md px-3 py-1 flex items-center justify-center'><MicVocal color="#3ca716" /> Voice Input</button>
                            </div>
                            <div className='flex flex-col'>
                                <p>Blood Glucose(mg/dl)</p>
                                <input type='text' placeholder='80/90' className='border-2 border-gray-400 rounded-md mb-2 mt-2'/>
                                <button className='bg-emerald-400 text-white rounded-md px-3 py-1 flex items-center justify-center'><MicVocal color="#3ca716" /> Voice Input</button>
                            </div>
                            <div className='flex flex-col'>
                                <p>Heart Rate(BPM)</p>
                                <input type='number' placeholder='72' className='border-2 border-gray-400 rounded-md mb-2 mt-2'/>
                                <button className='bg-emerald-400 text-white rounded-md px-3 py-1 flex items-center justify-center'><MicVocal color="#3ca716" /> Voice Input</button>
                            </div>
                            <button className='bg-emerald-400 text-white px-2 py-1 rounded-md'>Save Vitals</button>

                        </div>
                         <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] bg-white flex flex-row w-3/4 rounded-md mt-4 px-8 py-4 gap-4'>
                            <div>
                                <Image 
                                src="/assets/graph.png"
                                alt="graph for blood pressure"
                                height={250}
                                width={250}
                                />

                            </div>
                            <div>
                              <Image 
                                src="/assets/graph.png"
                                alt="graph for blood pressure"
                                height={250}
                                width={250}
                                />
                            </div>
                            <div>
                                <Image 
                                src="/assets/graph.png"
                                alt="graph for blood pressure"
                                height={250}
                                width={250}
                                />

                            </div>
                         </div>
                         <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] bg-white flex flex-row w-3/4 rounded-md mt-4 px-8 py-4 gap-4'>
                            <div className='w-1/2'>
                                <div>
                                    <input type='text' placeholder='Search for doctors or specialties' className='border-2 border-gray-400 rounded-md mb-2 mt-2' />
                                </div>
                                <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] rounded-md border-2 border-gray-300  '>
                                    <h1>Dr Michael</h1>
                                    <p>Cardiologist. 2.3 Miles away</p>
                                    <button className='bg-emerald-400 text-white rounded-md px-3 py-1 flex place-items-end'>Book</button>
                                </div>
                             
                            </div>
                            <div className='shadow-[4px 0 4px 0 rgba(0,0,0,0.2)] flex flex-col rounded-md items-center justify-center bg-gray-400 w-1/2'>
                                <p>Interactive Image of a Map will load here</p>
                                <p>Showing Healthcare providers</p>
                            </div>
                         </div>

                    </div>

    </div>
  )
}

export default page
