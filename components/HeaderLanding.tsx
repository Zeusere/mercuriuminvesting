'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HeaderLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">
              Mercurium
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Features
            </Link>
            <Link href="/social" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Community
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Login
            </Link>
            <Link href="/signup" className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all">
              Get started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-0 mt-4">
              <Link
                href="#features"
                className="text-gray-700 hover:text-gray-900 px-4 py-3 font-medium transition-colors border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/social"
                className="text-gray-700 hover:text-gray-900 px-4 py-3 font-medium transition-colors border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="#pricing"
                className="text-gray-700 hover:text-gray-900 px-4 py-3 font-medium transition-colors border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-4 py-3 font-medium transition-colors border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 text-white px-4 py-3 font-semibold rounded-lg mt-2 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

