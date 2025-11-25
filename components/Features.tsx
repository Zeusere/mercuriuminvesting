import Link from 'next/link'

export default function Features() {
  const features = [
    {
      title: "AI ASSISTANT",
      description: "NATURAL LANGUAGE IS LIKE A GAME CHANGER. IMPROVE YOUR PORTFOLIOS, MAXIMIZE RETURNS AND KNOW WHERE YOU'RE INVESTING WITH INTELLIGENT INSIGHTS.",
      number: "01"
    },
    {
      title: "CREATE STRATEGIES", 
      description: "CREATE PORTFOLIOS, SIMULATE RETURNS AND TRACK RECORDS. RUN STRATEGIES FAST WITH AI-POWERED OPTIMIZATION AND BACKTESTING.",
      number: "02"
    },
    {
      title: "TALK WITH INVESTORS",
      description: "JOIN TICKER ROOMS TO CHAT LIVE ABOUT EARNINGS, ASK QUESTIONS, AND DEBATE PRICE ACTION WITH THE COMMUNITY.",
      number: "03"
    }
  ]

  return (
    <section id="features" className="relative py-16 md:py-24 px-4 bg-white border-b-4 border-black">
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
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="mb-16 border-b-4 border-black pb-8">
          <h2 className="font-impact text-6xl md:text-8xl uppercase tracking-tighter text-black mb-4">
            FEATURES
          </h2>
          <p className="font-anton text-xl md:text-2xl text-black uppercase">
            EVERYTHING YOU NEED TO BUILD WINNING INVESTMENT STRATEGIES
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-0">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`grid md:grid-cols-3 gap-0 border-b-4 border-black last:border-b-0 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
              }`}
            >
              {/* Number */}
              <div className="border-r-4 border-black p-8 flex items-center justify-center">
                <div className="font-impact text-8xl md:text-9xl text-black opacity-20">
                  {feature.number}
                </div>
              </div>
              
              {/* Content */}
              <div className="md:col-span-2 p-8 space-y-6">
                <h3 className="font-impact text-4xl md:text-5xl uppercase tracking-tighter text-black">
                  {feature.title}
                </h3>
                <p className="font-anton text-lg md:text-xl text-black leading-relaxed">
                  {feature.description}
                </p>
                <Link 
                  href="/signup" 
                  className="inline-block brutalist-button text-lg"
                >
                  TRY NOW
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 border-4 border-black bg-black text-white p-12">
          <div className="text-center space-y-6">
            <h3 className="font-impact text-4xl md:text-5xl uppercase tracking-tighter">READY TO GET STARTED?</h3>
            <p className="font-anton text-xl uppercase max-w-2xl mx-auto">
              JOIN THOUSANDS OF INVESTORS BUILDING WINNING STRATEGIES WITH AI AND COMMUNITY INTELLIGENCE.
            </p>
            <Link href="/signup" className="inline-block brutalist-button-outline text-xl bg-white text-black hover:bg-gray-200">
              START FREE TRIAL
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}