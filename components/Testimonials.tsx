export default function Testimonials() {
  const testimonials = [
    {
      name: "SARAH CHEN",
      role: "PORTFOLIO MANAGER",
      company: "TECHVENTURES CAPITAL",
      content: "MERCURIUM'S AI HAS REVOLUTIONIZED HOW WE APPROACH PORTFOLIO CONSTRUCTION. THE STRATEGY SUGGESTIONS ARE INCREDIBLY SOPHISTICATED AND THE SOCIAL FEATURES HELP US STAY AHEAD OF MARKET TRENDS.",
      performance: "+47.3%",
      period: "6 MONTHS"
    },
    {
      name: "MARCUS RODRIGUEZ",
      role: "INDIVIDUAL INVESTOR",
      company: "INDEPENDENT TRADER",
      content: "I WENT FROM LOSING MONEY TO CONSISTENT PROFITS IN JUST 3 MONTHS. THE COPY TRADING FEATURE LET ME LEARN FROM THE BEST, AND NOW I'M BUILDING MY OWN SUCCESSFUL STRATEGIES.",
      performance: "+89.2%",
      period: "1 YEAR"
    },
    {
      name: "EMILY WATSON",
      role: "FINANCIAL ADVISOR",
      company: "WEALTHBUILD PARTNERS",
      content: "THE NATURAL LANGUAGE TRADING IS A GAME-CHANGER. I CAN ADJUST CLIENT PORTFOLIOS INSTANTLY WITH SIMPLE COMMANDS. MY CLIENTS LOVE THE TRANSPARENCY AND PERFORMANCE.",
      performance: "+34.7%",
      period: "8 MONTHS"
    },
    {
      name: "DAVID KIM",
      role: "DAY TRADER",
      company: "QUANTUM TRADING",
      content: "THE AI'S REAL-TIME ANALYSIS GIVES ME AN EDGE I NEVER HAD BEFORE. COMBINED WITH THE SOCIAL INSIGHTS, I'M MAKING BETTER DECISIONS FASTER THAN EVER.",
      performance: "+156.8%",
      period: "1 YEAR"
    },
    {
      name: "LISA THOMPSON",
      role: "RETIREMENT PLANNER",
      company: "SECURE FUTURE ADVISORS",
      content: "MERCURIUM HELPS ME CREATE DIVERSIFIED, RISK-MANAGED PORTFOLIOS FOR MY CLIENTS. THE AI HANDLES THE COMPLEXITY WHILE I FOCUS ON RELATIONSHIP BUILDING.",
      performance: "+28.4%",
      period: "10 MONTHS"
    },
    {
      name: "ALEX JOHNSON",
      role: "HEDGE FUND MANAGER",
      company: "ALPHA CAPITAL",
      content: "THE PLATFORM'S SOPHISTICATION RIVALS OUR PROPRIETARY SYSTEMS. THE SOCIAL COMPONENT PROVIDES UNIQUE MARKET INTELLIGENCE THAT'S IMPOSSIBLE TO FIND ELSEWHERE.",
      performance: "+72.1%",
      period: "1 YEAR"
    }
  ]

  const stats = [
    { label: "AVERAGE RETURN", value: "+54.2%" },
    { label: "ACTIVE USERS", value: "50,000+" },
    { label: "ASSETS UNDER MANAGEMENT", value: "$2.3B" },
    { label: "SUCCESS RATE", value: "98.4%" }
  ]

  return (
    <section id="testimonials" className="py-16 md:py-24 px-4 bg-white border-b-4 border-black">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 border-b-4 border-black pb-8">
          <h2 className="font-impact text-6xl md:text-8xl uppercase tracking-tighter text-black mb-4">
            SUCCESS STORIES
          </h2>
          <p className="font-anton text-xl md:text-2xl text-black uppercase">
            SEE HOW INVESTORS ARE ACHIEVING REMARKABLE RESULTS
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-4 border-black mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`p-8 border-r-4 border-black last:border-r-0 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
              }`}
            >
              <p className="font-impact text-4xl md:text-5xl text-black mb-2">{stat.value}</p>
              <p className="font-anton text-xs uppercase text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-4 border-black">
          {testimonials.map((testimonial, index) => {
            const isPositive = parseFloat(testimonial.performance) >= 0
            const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
            
            return (
              <div 
                key={index} 
                className={`p-8 border-r-4 border-b-4 border-black last:border-r-0 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                }`}
              >
                {/* Quote */}
                <div className="mb-6">
                  <p className="font-anton text-sm uppercase text-black leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Performance */}
                <div className="mb-6 border-t-4 border-black pt-4">
                  <div className="flex items-baseline gap-2">
                    <p className={`font-impact text-4xl ${colorClass}`}>{testimonial.performance}</p>
                    <p className="font-anton text-xs uppercase text-gray-600">OVER {testimonial.period}</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="border-t-4 border-black pt-4">
                  <p className="font-impact text-lg uppercase text-black mb-1">{testimonial.name}</p>
                  <p className="font-anton text-xs uppercase text-gray-600">{testimonial.role}</p>
                  <p className="font-anton text-xs uppercase text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 border-4 border-black bg-black text-white p-12">
          <div className="text-center space-y-6">
            <h3 className="font-impact text-4xl md:text-5xl uppercase tracking-tighter">JOIN THESE SUCCESSFUL INVESTORS</h3>
            <p className="font-anton text-xl uppercase max-w-2xl mx-auto">
              START YOUR JOURNEY TO BETTER INVESTMENT RETURNS WITH AI-POWERED STRATEGIES AND COMMUNITY INSIGHTS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/signup" className="brutalist-button-outline text-xl bg-white text-black hover:bg-gray-200">
                START YOUR SUCCESS STORY
              </a>
              <a href="#pricing" className="brutalist-button text-xl">
                VIEW PRICING
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}