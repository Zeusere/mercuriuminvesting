'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-dark.png" 
              alt="Mercurium" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white">MERCURIUM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="hover:text-purple-400 transition-colors font-medium text-gray-300">
              Features
            </Link>
            <Link href="#testimonials" className="hover:text-purple-400 transition-colors font-medium text-gray-300">
              Success Stories
            </Link>
            <Link href="/social" className="hover:text-purple-400 transition-colors font-medium text-gray-300">
              Community
            </Link>
            <Link href="/login" className="hover:text-purple-400 transition-colors font-medium text-gray-300">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25">
              Start Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 animate-fade-in">
            <Link
              href="#features"
              className="block hover:text-purple-400 transition-colors text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="block hover:text-purple-400 transition-colors text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Success Stories
            </Link>
            <Link
              href="/login"
              className="block hover:text-purple-400 transition-colors text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="block px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-center transition-all duration-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

