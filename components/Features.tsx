import Link from 'next/link'
import { Sparkles, Zap, Users, TrendingUp, BarChart3, MessageSquare } from 'lucide-react'

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-32 px-4 bg-white">
      <div className="container mx-auto max-w-7xl">
        
        {/* AI-Powered Strategy Creation */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              AI-powered<br />strategy creation
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explain your goals, strategy, and risk concerns in natural language — our AI-assisted editor will create the strategy for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Explanation */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Create with AI</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Simply describe what you want in natural language. Our AI understands your investment goals and creates a complete trading strategy with technical indicators, entry/exit rules, and risk management.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <p className="text-sm text-gray-500 mb-2">Example prompt:</p>
                    <p className="text-gray-900 font-medium">"I want a strategy for SPY using moving averages and RSI to maximize returns"</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    The AI will calculate indicators, backtest the strategy, and show you the complete track record with all entries, exits, and adjustments—all automatically generated.
                  </p>
                  <Link 
                    href="/signup" 
                    className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all mt-6"
                  >
                    Try AI Strategy Builder
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Image */}
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-white font-semibold text-lg">Simulación de Rendimiento</h4>
                  <div className="flex gap-2">
                    {['1M', '3M', 'YTD', '1Y', '3Y', '5Y'].map((period, i) => (
                      <button
                        key={i}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          period === '3M'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">Inversión Inicial</p>
                    <p className="text-white font-bold text-lg">$100,000</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">Valor Final</p>
                    <p className="text-white font-bold text-lg">$113,719</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">Retorno Total</p>
                    <p className="text-green-400 font-bold text-lg">+13.72%</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">Retorno Anualizado</p>
                    <p className="text-green-400 font-bold text-lg">+65.90%</p>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6 h-48 flex items-end justify-between gap-1">
                  {[65, 72, 58, 68, 75, 70, 78, 65, 72, 80, 75, 82].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Performance Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 gap-2 p-3 text-xs">
                    <div className="text-gray-400 font-medium">Acción</div>
                    <div className="text-gray-400 font-medium">Peso</div>
                    <div className="text-gray-400 font-medium">Precio Inicial</div>
                    <div className="text-gray-400 font-medium">Precio Final</div>
                    <div className="text-gray-400 font-medium">Rendimiento</div>
                    <div className="text-gray-400 font-medium">Contribución</div>
                    <div className="text-white">WW</div>
                    <div className="text-white">30.0%</div>
                    <div className="text-white">$28.12</div>
                    <div className="text-white">$25.50</div>
                    <div className="text-red-400">-9.32%</div>
                    <div className="text-red-400">-2.80%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Automation */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              More automation
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mercurium executes your trading strategy, making trades and rebalancing automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Automated Execution", desc: "Trades execute automatically based on your strategy rules" },
              { icon: TrendingUp, title: "Smart Rebalancing", desc: "Portfolio rebalances automatically when conditions are met" },
              { icon: BarChart3, title: "Real-time Monitoring", desc: "Track performance and get alerts on strategy changes" }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Discover Pre-built Strategies */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Discover pre-built strategies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find strategies you can invest in right away, across a variety of purpose-driven categories.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Long Term", desc: "Buy and hold strategies for steady growth" },
              { name: "Copy the Greats", desc: "Follow top-performing traders and investors" },
              { name: "Technology Focus", desc: "Tech-heavy portfolios for growth" },
              { name: "Ride the Momentum", desc: "Capture trends and market movements" },
              { name: "Diversification", desc: "Balanced portfolios across sectors" },
              { name: "AI Optimized", desc: "Strategies enhanced with machine learning" }
            ].map((strategy, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{strategy.name}</h3>
                <p className="text-gray-600 text-sm">{strategy.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Community
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what others are creating. Invest directly or make changes. Share your own strategies.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-16 border border-gray-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Social Trading</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Join ticker rooms to chat live about earnings, ask questions, and debate price action with the community. Copy successful strategies from top traders.
                </p>
                <Link 
                  href="/social" 
                  className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Explore Community
                </Link>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Live Discussions</p>
                      <p className="text-sm text-gray-600">Real-time chat about stocks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Copy Trading</p>
                      <p className="text-sm text-gray-600">Follow top performers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Strategy Sharing</p>
                      <p className="text-sm text-gray-600">Publish and remix strategies</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customize and Create */}
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Customize and Create
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Every strategy on Mercurium is fully editable. Swap out assets, adjust programmatic logic, and tweak parameters.
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all"
          >
            Start Building
          </Link>
        </div>

      </div>
    </section>
  )
}