import React from 'react'
import { HeartPulse, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

const Footer = () => {
  return (
    <footer id="contact" className="flex items-center justify-center flex-col gap-6 lg:gap-8 bg-blue-950 p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-6xl">
        {/* Brand + Description */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-lg sm:text-xl text-white font-bold flex flex-row items-center justify-center lg:justify-start gap-2 mb-4">
            <HeartPulse color="#34d399" size={22} /> {/* Emerald green icon */}
            SmartCare
          </h1>
          <p className="text-emerald-400 leading-relaxed text-sm sm:text-base">
            Empowering patients to manage chronic illnesses with smart technology and compassionate care
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 flex-1 lg:flex-none">
          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-4">Product</h1>
            <div className="space-y-2">
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Features</p>
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Pricing</p>
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Security</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-4">Support</h1>
            <div className="space-y-2">
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Help Center</p>
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Contact Us</p>
              <p className="text-emerald-400 hover:text-white cursor-pointer transition-colors text-sm">Privacy Policy</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-white font-bold mb-4">Contact</h1>
            <div className="space-y-2">
              <p className="text-emerald-400 text-sm">1-800-SMART-CARE</p>
              <p className="text-emerald-400 text-sm">support@smartcare.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider + Bottom Row */}
      <div className="w-full max-w-6xl">
        <hr className="border-emerald-600 mb-4" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-emerald-400 text-center text-sm">
            © 2025 SmartCare. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-white transition">
              <Facebook size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-white transition">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-white transition">
              <Linkedin size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-white transition">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
