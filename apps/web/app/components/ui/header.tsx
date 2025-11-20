import React, { useState } from 'react';
import Link from 'next/link';
import { HeartPulse, Menu, X } from 'lucide-react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-slate-400 text-black shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-2">
          <HeartPulse color="darkblue" size={30} />
          <h1 className="text-lg font-bold text-white">SmartCare</h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-16 font-medium">
          <Link href="/" className="hover:p-2 hover:bg-slate-300 rounded-sm transition duration-200">Home</Link>
          <Link href="/features" className="hover:p-2 hover:bg-slate-300 rounded-sm transition duration-200">Features</Link>
          <Link href="/resources" className="hover:p-2 hover:bg-slate-300 rounded-sm transition duration-200">Resources</Link>
          <Link href="/about" className="hover:p-2 hover:bg-slate-300 rounded-sm transition duration-200">About Us</Link>
          <Link href="/contact" className="hover:p-2 hover:bg-slate-300 rounded-sm transition duration-200">Contact</Link>
        </nav>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <nav className="flex flex-col md:hidden bg-slate-500 text-white px-4 py-2 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/features" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/resources" onClick={() => setMenuOpen(false)}>Resources</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
