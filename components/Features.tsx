import { Brain, MessageSquare, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default function Features() {
  const features = [
    {
      title: "AI ASSISTANT",
      description: "Natural language is like a game changer. Improve your portfolios, maximize returns and know where you're investing with intelligent insights.",
      icon: Brain,
      image: "/features/ai-assistant.png"
    },
    {
      title: "CREATE STRATEGIES", 
      description: "Create portfolios, simulate returns and track records. Run strategies fast with AI-powered optimization and backtesting.",
      icon: TrendingUp,
      image: "/features/create-strategies.png"
    },
    {
      title: "TALK WITH INVESTORS",
      description: "Join ticker rooms to chat live about earnings, ask questions, and debate price action with the community.",
      icon: Users,
      image: "/features/community-chat.png"
    }
  ]

  return (
    <section id="features" className="py-24 px-4 bg-gray-900">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Powerful
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to build winning investment strategies with AI and community intelligence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isEven = index % 2 === 0
            
            return (
              <div key={index} className={`grid md:grid-cols-2 gap-12 items-center ${!isEven ? 'md:grid-flow-col-dense' : ''}`}>
                {/* Text Content */}
                <div className={`space-y-6 ${!isEven ? 'md:col-start-2' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                      <Icon className="text-white" size={32} />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Try Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Image/Visual */}
                <div className={`${!isEven ? 'md:col-start-1 md:row-start-1' : ''}`}>
                  <div className="relative">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-gray-700">
                      <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Icon className="text-purple-400" size={48} />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                            <div className="h-2 bg-gray-600 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="p-12 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-emerald-600/10 rounded-3xl border border-purple-500/20 backdrop-blur-sm">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of investors building winning strategies with AI and community intelligence.
            </p>
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}