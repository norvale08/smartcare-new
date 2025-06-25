import React from 'react'
import Image from 'next/image';

const page = () => {
  return (
    <div>
      <header className="flex items-center justify-between px-8 py-2 mb-2">
            <h1 className="text-xl font-bold">SmartCare</h1>

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

      
         
    </div>
  )
}

export default page 