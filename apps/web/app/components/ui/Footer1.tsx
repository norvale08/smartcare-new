'use client';

import React from 'react';
import Link from 'next/link';
import { HeartPulse, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-blue-950 to-emerald-700 p-4 lg:p-6 text-white py-8 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <HeartPulse color="white" size={30} />
                        <h3 className="text-xl font-bold">SmartCare</h3>
                    </div>
                    <p className="text-gray-300">
                        Empowering patients with advanced health management tools for chronic disease monitoring.
                    </p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link href="/features" className="text-gray-300 hover:text-white transition">Features</Link></li>
                        <li><Link href="/resources" className="text-gray-300 hover:text-white transition">Resources</Link></li>
                        <li><Link href="/about" className="text-gray-300 hover:text-white transition">About Us</Link></li>
                        <li><Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                            <Mail size={18} />
                            <span className="text-gray-300">support@smartcare.com</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone size={18} />
                            <span className="text-gray-300">+254 700 000 000</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MapPin size={18} />
                            <span className="text-gray-300">Nairobi, Kenya</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} SmartCare. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
