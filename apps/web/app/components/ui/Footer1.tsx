'use client';

import React from 'react';
import Link from 'next/link';
import { HeartPulse, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-blue-950 to-emerald-700 p-4 sm:p-6 md:p-8 lg:p-10 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <HeartPulse className="font-bold" color="#34d399" size={20} />
                            <h3 className="text-lg sm:text-xl font-bold">SmartCare</h3>
                        </div>
                        <p className="text-emerald-300 text-sm sm:text-base leading-relaxed">
                            Empowering patients with advanced health management tools for chronic disease monitoring.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div className="text-center sm:text-left">
                        <h2 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Product</h2>
                        <div className="space-y-2 sm:space-y-3">
                            <p>
                                <Link 
                                    href="/features" 
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Features
                                </Link>
                            </p>
                            <p>
                                <Link 
                                    href="/pricing" 
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Pricing
                                </Link>
                            </p>
                            <p>
                                <Link 
                                    href="/security"  
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Security
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Support Links */}
                    <div className="text-center sm:text-left">
                        <h2 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Support</h2>
                        <div className="space-y-2 sm:space-y-3">
                            <p>
                                <Link 
                                    href="/help" 
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Help Center
                                </Link>
                            </p>
                            <p>
                                <Link 
                                    href="/contact" 
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Contact Us
                                </Link>
                            </p>
                            <p>
                                <Link 
                                    href="/privacy" 
                                    className="text-emerald-300 hover:text-white cursor-pointer transition-colors text-sm sm:text-base block"
                                >
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="text-center sm:text-left">
                        <h2 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Quick Links</h2>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link 
                                    href="/features" 
                                    className="text-sm sm:text-base text-emerald-300 hover:text-white transition block"
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/resources" 
                                    className="text-sm sm:text-base text-emerald-300 hover:text-white transition block"
                                >
                                    Resources
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/about" 
                                    className="text-sm sm:text-base text-emerald-300 hover:text-white transition block"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href="/contact" 
                                    className="text-sm sm:text-base text-emerald-300 hover:text-white transition block"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Social */}
                    <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
                        <h2 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">Contact Us</h2>
                        <ul className="space-y-3 sm:space-y-4">
                            <li className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                                <Mail size={18} className="flex-shrink-0" />
                                <span className="text-sm sm:text-base text-emerald-300 break-words">
                                    smartcarehealthsystem@gmail.com
                                </span>
                            </li>
                            <li className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                                <Phone size={18} className="flex-shrink-0" />
                                {/* <span className="text-sm sm:text-base text-emerald-300">+254 700 000 000</span> */}
                            </li>
                            <li className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                                <MapPin size={18} className="flex-shrink-0" />
                                {/* <span className="text-sm sm:text-base text-emerald-300">Nairobi, Kenya</span> */}
                            </li>
                        </ul>

                        <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start gap-3 sm:gap-4">
                            <a 
                                href="#" 
                                className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition"
                                aria-label="Twitter"
                            >
                                <svg 
                                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a 
                                href="#" 
                                className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition"
                                aria-label="LinkedIn"
                            >
                                <svg 
                                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                                </svg>
                            </a>
                            <a 
                                href="#" 
                                className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white/30 transition"
                                aria-label="Instagram"
                            >
                                <svg 
                                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t border-gray-700 text-center">
                    <p className="text-xs sm:text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} SmartCare. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;