export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Portfolio Manager",
      company: "TechVentures Capital",
      content: "Mercurium's AI has revolutionized how we approach portfolio construction. The strategy suggestions are incredibly sophisticated and the social features help us stay ahead of market trends.",
      performance: "+47.3%",
      period: "6 months"
    },
    {
      name: "Marcus Rodriguez",
      role: "Individual Investor",
      company: "Independent Trader",
      content: "I went from losing money to consistent profits in just 3 months. The copy trading feature let me learn from the best, and now I'm building my own successful strategies.",
      performance: "+89.2%",
      period: "1 year"
    },
    {
      name: "Emily Watson",
      role: "Financial Advisor",
      company: "WealthBuild Partners",
      content: "The natural language trading is a game-changer. I can adjust client portfolios instantly with simple commands. My clients love the transparency and performance.",
      performance: "+34.7%",
      period: "8 months"
    },
    {
      name: "David Kim",
      role: "Day Trader",
      company: "Quantum Trading",
      content: "The AI's real-time analysis gives me an edge I never had before. Combined with the social insights, I'm making better decisions faster than ever.",
      performance: "+156.8%",
      period: "1 year"
    }
  ]

  return (
    <section id="testimonials" className="py-20 md:py-32 px-4 bg-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            What people are saying
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => {
            const isPositive = parseFloat(testimonial.performance) >= 0
            
            return (
              <div 
                key={index} 
                className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    <p className="text-gray-500 text-xs">{testimonial.company}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {testimonial.performance}
                    </p>
                    <p className="text-gray-600 text-xs">over {testimonial.period}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 text-center border border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Join these successful investors
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your journey to better investment returns with AI-powered strategies and community insights.
          </p>
          <a 
            href="/signup" 
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all"
          >
            Get started
          </a>
        </div>
      </div>
    </section>
  )
}