import Link from 'next/link'
import StockMarketDashboard from './StockMarketDashboard'

export default function Hero() {
  return (
    <section className="relative bg-white border-b-4 border-black">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 2px, transparent 2px),
            linear-gradient(to bottom, black 2px, transparent 2px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="font-impact text-6xl md:text-8xl uppercase tracking-tighter leading-none text-black">
              WINNING STRATEGIES
              </h1>
              <h2 className="font-impact text-4xl md:text-5xl uppercase tracking-tighter text-black">
              WITH AI & COMMUNITY
              </h2>
              <h3 className="font-impact text-2xl md:text-3xl uppercase tracking-tighter text-gray-600">
                
              </h3>
            </div>
            
            <p className="font-anton text-lg md:text-xl text-black leading-relaxed max-w-xl">
             Mercurium combines artificial intelligence with social trading to create the most powerful investment platform. Discover, copy, and create strategies that actually work.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
              <Link href="/signup" className="brutalist-button text-xl">
                START BUILDING
              </Link>
              <Link href="#features" className="brutalist-button-outline text-xl">
                EXPLORE
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t-4 border-black">
              <div>
                <div className="font-impact text-3xl text-black">$2.3B+</div>
                <div className="font-anton text-xs uppercase text-gray-600 mt-1">AUM</div>
              </div>
              <div>
                <div className="font-impact text-3xl text-black">50K+</div>
                <div className="font-anton text-xs uppercase text-gray-600 mt-1">USERS</div>
              </div>
              <div>
                <div className="font-impact text-3xl text-black">98%</div>
                <div className="font-anton text-xs uppercase text-gray-600 mt-1">SUCCESS</div>
              </div>
              <div>
                <div className="font-impact text-3xl text-black">24/7</div>
                <div className="font-anton text-xs uppercase text-gray-600 mt-1">AI SUPPORT</div>
              </div>
            </div>
          </div>

          {/* Right: Stock Dashboard */}
          <div className="relative">
            <StockMarketDashboard />
          </div>
        </div>
      </div>
    </section>
  )
}

