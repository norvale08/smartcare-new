import React from 'react'
import { Button } from '@repo/ui'

const Home = () => {
  return (
    <div className=' bg-slate-400'>
       <div className="relative bg-cover bg-center text-white p-10 h-[400px] bg-[url('/assets/laptop.png')]">
  <div className="absolute inset-0 bg-blue-950 bg-opacity-60 z-0"></div>

  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
    <p className="text-lg mb-4 max-w-xl">
      Empower yourself with our advanced diabetes management system designed to help you track your vitals and receive timely alerts
    </p>
    <h2 className="text-2xl font-bold mb-6">
      Welcome to the future of Diabetes Management
    </h2>
    <Button className="bg-blue-800">Contact Us</Button>
  </div>




</div>

        <div>
            <div>
                <h2>Receive Real-Time Alerts</h2>
                <p>Stay informed with instant alerts from Llama, ensuring you never miss a critical update regarding your health status.</p>
            </div>
            <div>
                <h3>Track Your Vitals</h3>
                <p>Easily log your blood sugar levels, medication intake, and other vital statistics to maintain a comprehensive health record.
Learn More</p>
            </div>
            <div>
                <h3>User-Friendly Interface</h3>
                <p>Navigate through our intuitive design that makes logging and managing your diabetes data effortless and efficient.</p>
            </div>
        </div>
        <div>
            <h2>
                Understanding Our System
            </h2>
            <p>Learn how our diabetes management system simplifies the way you monitor your health.</p>
            
        </div>
        <div>
            <h1>What Our Users Say</h1>

            <p>Real experiences from individuals who have transformed their diabetes management with our system.</p>
            <div>
                <h3>Empowering Experience</h3>
                <p>Using this system has completely changed how I manage my diabetes. The alerts keep me on track, and I feel more in control than ever before.</p>
            </div>
            <div>
                <h3>Life-Changing Alerts</h3>
                <p>The real-time alerts from Llama have been a game changer for me. I never have to worry about forgetting to check my levels again.</p>
            </div>
            <div>
                <h3>User-Friendly and Effective</h3>
                <p>The interface is so intuitive! Logging my vitals is easy, and I appreciate the insights it provides to help me improve my health.</p>
            </div>
        </div>
    </div>
  )
}

export default Home