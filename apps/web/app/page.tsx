import React from 'react'
import Image from 'next/image';
import {HeartPulse, Stethoscope,MapPin  } from 'lucide-react';

const page = () => {
  return (
    <div className="p-2 min-h-screen min-w-screen">
      <header className="flex items-center justify-between px-8 py-2 mb-2">
        
            <h1 className="text-xl font-bold flex flex-row"> <HeartPulse color="#21a136" />SmartCare</h1>

            <div className="flex gap-6">
              <button>Features</button>
              <button>How it works</button>
              <button>Services</button>
              <button>Contact</button>
            </div>

            <div className="flex gap-4">
              <button className="text-emerald-400">Login</button>
              <button className="bg-emerald-400 text-white rounded-md px-4 py-1">Get Started</button>
            </div>
        </header>
        <section>
          <div className="bg-gradient-to-r from-emerald-200 to-white px-5 py-5 flex flex-row">
            <div className='w-1/2'>
          <p className="text-3xl mb-6">Monitor Your<br /> Health<span className="text-emerald-400 font-bold"> Anywhere,<br />Anytime</span></p>
          <p className="mb-6">Smart Care helps you track Chronic illnesses like
            diabetes<br /> with voice or text-input.Connect with doctors, Find
            nearby<br /> clinics, and access emergency services instantly
            </p>
            <button className="bg-emerald-400 text-white rounded-md px-4 py-2">Start Monitoring</button>
            </div>
            <div className="flex items-center justify-center shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] rounded-md p-4 bg-emerald-400 w-1/3 h-64">
                <Image 
                  src="/assets/doctor.png"
                  alt="A lady Nurse"
                  width={150}
                  height={150}
                />
            </div>

          </div>
          
        </section>
               <div className='flex flex-col items-center justify-center mt-6'>
                <h2 className='font-bold'>Comprehensive Health Monitoring</h2>
              <p>Everything you need to manage your chronic illnesses</p>
              </div>
            <section className="flex items-center justify-center flex-row mt-6 gap-6">
              
              
              <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-4 flex items-center flex-col w-1/4 h-full min-h-[150px]">
                <HeartPulse color="#21a136" />
                <h2 className='font-bold'>Vital Signs Tracking</h2>
                <p>Monitor blood pressure,glucose levels,
                  and heart rate with voice or text input
                </p>
              </div>
              <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-4 flex items-center flex-col w-1/4 h-full min-h-[150px]">
                <Stethoscope color="#21a136" />
                <h2 className='font-bold'>Doctor Consultations</h2>
                <p>Connect with healthcare professionals
                  for vitual consultations and advice

                </p>

              </div>
              <div className="shadow-[4px_0_4px_0_rgba(0,0,0,0.2)] bg-emerald-200 rounded-md p-4 flex items-center flex-col w-1/4 h-full min-h-[150px] ">
                <MapPin color="#21a136" />
                <h2 className='font-bold'>Emergency Services</h2>
                <p>Quick access to nearby clinics and
                  ambulance services based on your
                  location
                </p>
              </div>
              
            </section>

      
         
    </div>
  )
}

export default page 