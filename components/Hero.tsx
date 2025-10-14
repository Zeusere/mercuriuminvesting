import Link from 'next/link'
import { Bot, ArrowRight, Brain, Users, TrendingUp, Shield, Zap, Target } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative pt-20 pb-32 px-4 overflow-hidden bg-gray-900">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-emerald-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
      
      <div className="container mx-auto max-w-7xl relative">
        <div className="text-center space-y-12 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-purple-500/20 text-purple-400 px-6 py-3 rounded-full text-sm font-medium">
            <Brain size={16} />
            <span>AI-Powered Investment Strategies</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold leading-tight">
              <span className="text-white">MERCURIUM</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Winning Strategies
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-gray-300">with AI & Community</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Mercurium combines <span className="text-purple-400 font-semibold">artificial intelligence</span> with 
              <span className="text-blue-400 font-semibold"> social trading</span> to create the most powerful 
              investment platform. Discover, copy, and create strategies that actually work.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link href="/signup" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25 flex items-center space-x-3">
              <span>Start Building Strategies</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#features" className="px-8 py-4 border-2 border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm">
              Explore Platform
            </Link>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-5xl mx-auto">
            <div className="group">
              <div className="p-6 bg-gradient-to-br from-purple-600/10 to-purple-800/10 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm">
                <Bot className="mx-auto mb-3 text-purple-400" size={32} />
                <p className="text-2xl font-bold text-white">AI Assistant</p>
                <p className="text-sm text-gray-400 mt-1">24/7 Strategy Creation</p>
              </div>
            </div>
            <div className="group">
              <div className="p-6 bg-gradient-to-br from-blue-600/10 to-blue-800/10 rounded-2xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 backdrop-blur-sm">
                <Users className="mx-auto mb-3 text-blue-400" size={32} />
                <p className="text-2xl font-bold text-white">Social Trading</p>
                <p className="text-sm text-gray-400 mt-1">Copy Top Performers</p>
              </div>
            </div>
            <div className="group">
              <div className="p-6 bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 backdrop-blur-sm">
                <TrendingUp className="mx-auto mb-3 text-emerald-400" size={32} />
                <p className="text-2xl font-bold text-white">Real Performance</p>
                <p className="text-sm text-gray-400 mt-1">Track Live Results</p>
              </div>
            </div>
            <div className="group">
              <div className="p-6 bg-gradient-to-br from-orange-600/10 to-orange-800/10 rounded-2xl border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 backdrop-blur-sm">
                <Zap className="mx-auto mb-3 text-orange-400" size={32} />
                <p className="text-2xl font-bold text-white">Instant Execution</p>
                <p className="text-sm text-gray-400 mt-1">No Delays, No Friction</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-gray-800/50">
            <p className="text-gray-500 text-sm mb-6">Trusted by thousands of investors worldwide</p>
            <div className="flex items-center justify-center space-x-12 opacity-60">
              <div className="text-gray-400 font-semibold">$2.3B+</div>
              <div className="text-gray-400 font-semibold">50K+ Users</div>
              <div className="text-gray-400 font-semibold">98% Success Rate</div>
              <div className="text-gray-400 font-semibold">24/7 AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

