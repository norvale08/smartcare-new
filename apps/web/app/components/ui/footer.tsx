import React from 'react'
import { HeartPulse, Twitter, Linkedin, Instagram } from "lucide-react"

const Footer = () => {
  return (
    <footer id="contact" className="flex items-center justify-center flex-col gap-4 lg:gap-6 bg-gradient-to-r from-blue-950 to-emerald-700 p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-6xl">
        {/* Brand + Description */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-md sm:text-lg text-white font-bold flex flex-row items-center justify-center lg:justify-start gap-2 mb-2">
            <HeartPulse color="#34d399" size={18} /> {/* Smaller icon */}
            SmartCare
          </h1>
          <p className="text-emerald-300 leading-relaxed text-xs sm:text-sm">
            Empowering patients to manage chronic illnesses with smart technology and compassionate care
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 flex-1 lg:flex-none">
          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-2 text-sm">Product</h1>
            <div className="space-y-1">
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Features</p>
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Pricing</p>
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Security</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-2 text-sm">Support</h1>
            <div className="space-y-1">
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Help Center</p>
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Contact Us</p>
              <p className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-xs">Privacy Policy</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-2 text-sm">Contact</h1>
            <div className="space-y-1">
              <p className="text-emerald-300 text-xs">1-800-SMART-CARE</p>
              <p className="text-emerald-300 text-xs">support@smartcare.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider + Bottom Row */}
      <div className="w-full max-w-6xl">
        <hr className="border-emerald-500 mb-3" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Copyright */}
          {/* <p className="text-emerald-300 text-center text-xs">
            © 2025 SmartCare. All rights reserved.
          </p> */}

          {/* Social Icons */}
          <div className="flex gap-3">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-white transition">
              <Twitter size={16} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-white transition">
              <Linkedin size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-white transition">
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer