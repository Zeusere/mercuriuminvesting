import { Star, TrendingUp, Users, DollarSign, Quote } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Portfolio Manager",
      company: "TechVentures Capital",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "Mercurium's AI has revolutionized how we approach portfolio construction. The strategy suggestions are incredibly sophisticated and the social features help us stay ahead of market trends.",
      performance: "+47.3%",
      period: "6 months"
    },
    {
      name: "Marcus Rodriguez",
      role: "Individual Investor",
      company: "Independent Trader",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "I went from losing money to consistent profits in just 3 months. The copy trading feature let me learn from the best, and now I'm building my own successful strategies.",
      performance: "+89.2%",
      period: "1 year"
    },
    {
      name: "Emily Watson",
      role: "Financial Advisor",
      company: "WealthBuild Partners",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "The natural language trading is a game-changer. I can adjust client portfolios instantly with simple commands. My clients love the transparency and performance.",
      performance: "+34.7%",
      period: "8 months"
    },
    {
      name: "David Kim",
      role: "Day Trader",
      company: "Quantum Trading",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "The AI's real-time analysis gives me an edge I never had before. Combined with the social insights, I'm making better decisions faster than ever.",
      performance: "+156.8%",
      period: "1 year"
    },
    {
      name: "Lisa Thompson",
      role: "Retirement Planner",
      company: "Secure Future Advisors",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      content: "Mercurium helps me create diversified, risk-managed portfolios for my clients. The AI handles the complexity while I focus on relationship building.",
      performance: "+28.4%",
      period: "10 months"
    },
    {
      name: "Alex Johnson",
      role: "Hedge Fund Manager",
      company: "Alpha Capital",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
      content: "The platform's sophistication rivals our proprietary systems. The social component provides unique market intelligence that's impossible to find elsewhere.",
      performance: "+72.1%",
      period: "1 year"
    }
  ]

  const stats = [
    { label: "Average Return", value: "+54.2%", icon: TrendingUp },
    { label: "Active Users", value: "50,000+", icon: Users },
    { label: "Assets Under Management", value: "$2.3B", icon: DollarSign },
    { label: "Success Rate", value: "98.4%", icon: Star }
  ]

  return (
    <section id="testimonials" className="py-24 px-4 bg-gray-800">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Success Stories
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              From Real Users
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            See how investors are achieving remarkable results with Mercurium's AI-powered 
            strategies and social trading features.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center group">
                <div className="p-6 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm">
                  <Icon className="mx-auto mb-4 text-purple-500" size={32} />
                  <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-gray-400">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group">
              <div className="p-8 bg-gray-900 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 h-full">
                {/* Quote Icon */}
                <div className="flex items-start mb-6">
                  <Quote className="text-purple-500 mr-3 mt-1" size={24} />
                  <p className="text-gray-300 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Performance Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                      <TrendingUp className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{testimonial.performance}</p>
                      <p className="text-xs text-gray-500">over {testimonial.period}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-current" size={16} />
                    ))}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="p-12 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-emerald-600/10 rounded-3xl border border-purple-500/20 backdrop-blur-sm">
            <h3 className="text-3xl font-bold mb-4">Join These Successful Investors</h3>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Start your journey to better investment returns with AI-powered strategies and community insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25">
                Start Your Success Story
              </a>
              <a href="#pricing" className="px-8 py-4 border-2 border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white rounded-xl font-semibold text-lg transition-all duration-300">
                View Pricing Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}