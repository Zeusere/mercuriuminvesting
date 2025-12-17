import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative bg-[#F5F5F5] min-h-screen flex items-center justify-center overflow-hidden">
        {/* Geometric Color Blocks */}
        {/* Large Green Block - Top Right (overlapping "ium") */}
        <div 
          className="absolute w-72 h-72 md:w-[500px] md:h-[500px] bg-[#00B050] top-0 right-0 md:top-10 md:right-10 z-10 float-1"
        />
        
        {/* Pink Block with Dots - Overlaying "Mer" - positioned relative to text */}
        <div 
          className="absolute w-56 h-40 md:w-80 md:h-56 bg-[#FF69B4] z-10 float-2"
          style={{ 
            top: '50%',
            left: '15%',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0'
          }}
        />
        
        {/* Yellow Block with Dots - Bottom Left */}
        <div 
          className="absolute w-48 h-48 md:w-72 md:h-72 bg-[#FFC000] bottom-10 left-10 md:bottom-20 md:left-20 z-0 float-3"
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0'
          }}
        />
        
        {/* Light Blue Block - Middle Right */}
        <div 
          className="absolute w-40 h-56 md:w-64 md:h-80 bg-[#00BFFF] z-0 opacity-85 float-4"
          style={{ 
            top: '35%',
            right: '25%'
          }}
        />
        
        {/* Small Pink Block - Top Left */}
        <div 
          className="absolute w-32 h-32 md:w-48 md:h-48 bg-[#FF69B4] top-40 left-20 md:top-52 md:left-32 z-0 opacity-90 float-5"
        />
        
        {/* Small Green Block - Bottom Right */}
        <div 
          className="absolute w-36 h-36 md:w-52 md:h-52 bg-[#00B050] bottom-40 right-40 md:bottom-52 md:right-64 z-0 opacity-75 float-6"
        />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Headline */}
          <div className="relative mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Meet
            </h1>
            <div className="relative inline-block">
              <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black text-gray-900 tracking-tight leading-none relative z-20">
                Mercurium
              </h1>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
            Build and analyze your investment strategies with <span className="font-bold text-gray-900">AI-powered intelligence</span>, then join a thriving <span className="font-bold text-gray-900">community of traders</span> to discover, share, and copy winning strategies—all in one platform.
          </p>

          {/* Tagline */}
          <p className="text-xl md:text-2xl font-semibold text-gray-900 mb-12">
            Where AI meets community. Where strategies become success.
          </p>

          {/* CTA Button - Centered */}
          <div className="flex justify-center mt-12">
            <Link 
              href="/signup" 
              className="bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all flex items-center gap-2 group shadow-lg"
            >
              Get started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

