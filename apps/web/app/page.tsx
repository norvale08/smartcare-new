import React from 'react'

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

      <div className="flex items-center justify-center min-h-screen min-w-screen">
         
      </div>
    </div>
  )
}

export default page 