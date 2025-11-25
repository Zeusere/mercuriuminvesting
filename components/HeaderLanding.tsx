'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HeaderLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-impact uppercase tracking-tighter text-black">
              MERCURIUM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="font-impact text-lg uppercase tracking-tighter text-black hover:bg-black hover:text-white px-4 py-2 border-2 border-transparent hover:border-black transition-all">
              FEATURES
            </Link>
            <Link href="#testimonials" className="font-impact text-lg uppercase tracking-tighter text-black hover:bg-black hover:text-white px-4 py-2 border-2 border-transparent hover:border-black transition-all">
              STORIES
            </Link>
            <Link href="/social" className="font-impact text-lg uppercase tracking-tighter text-black hover:bg-black hover:text-white px-4 py-2 border-2 border-transparent hover:border-black transition-all">
              COMMUNITY
            </Link>
            <Link href="/login" className="font-impact text-lg uppercase tracking-tighter text-black hover:bg-black hover:text-white px-4 py-2 border-2 border-transparent hover:border-black transition-all">
              LOGIN
            </Link>
            <Link href="/signup" className="brutalist-button text-lg">
              START
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="brutalist-button text-sm"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? 'CLOSE' : 'MENU'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t-4 border-black">
            <div className="flex flex-col gap-0 mt-4">
              <Link
                href="#features"
                className="font-impact text-lg uppercase tracking-tighter text-black bg-white hover:bg-black hover:text-white px-4 py-3 border-b-2 border-black transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                FEATURES
              </Link>
              <Link
                href="#testimonials"
                className="font-impact text-lg uppercase tracking-tighter text-black bg-white hover:bg-black hover:text-white px-4 py-3 border-b-2 border-black transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                STORIES
              </Link>
              <Link
                href="/social"
                className="font-impact text-lg uppercase tracking-tighter text-black bg-white hover:bg-black hover:text-white px-4 py-3 border-b-2 border-black transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                COMMUNITY
              </Link>
              <Link
                href="/login"
                className="font-impact text-lg uppercase tracking-tighter text-black bg-white hover:bg-black hover:text-white px-4 py-3 border-b-2 border-black transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                LOGIN
              </Link>
              <Link
                href="/signup"
                className="brutalist-button text-lg mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                START
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

