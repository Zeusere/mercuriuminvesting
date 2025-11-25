import Link from 'next/link'

const plans = [
  {
    name: 'STARTER',
    price: '0',
    description: 'PERFECT FOR TRYING OUT THE PLATFORM',
    features: [
      'FULL AUTHENTICATION SYSTEM',
      'BASIC DASHBOARD',
      'COMMUNITY SUPPORT',
      '1 AI INTEGRATION',
    ],
    cta: 'START FREE',
    popular: false,
  },
  {
    name: 'PRO',
    price: '29',
    description: 'BEST FOR PROFESSIONAL DEVELOPERS',
    features: [
      'EVERYTHING IN STARTER',
      'ADVANCED DASHBOARD',
      'PRIORITY SUPPORT',
      'UNLIMITED AI INTEGRATIONS',
      'ANALYTICS DASHBOARD',
      'API ACCESS',
    ],
    cta: 'GET STARTED',
    popular: true,
  },
  {
    name: 'ENTERPRISE',
    price: '99',
    description: 'FOR TEAMS AND ORGANIZATIONS',
    features: [
      'EVERYTHING IN PRO',
      'DEDICATED SUPPORT',
      'CUSTOM DEVELOPMENT',
      'SLA GUARANTEE',
      'ADVANCED SECURITY',
      'TEAM MANAGEMENT',
    ],
    cta: 'CONTACT SALES',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 px-4 bg-white border-b-4 border-black">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 border-b-4 border-black pb-8">
          <h2 className="font-impact text-6xl md:text-8xl uppercase tracking-tighter text-black mb-4">
            PRICING
          </h2>
          <p className="font-anton text-xl md:text-2xl text-black uppercase">
            CHOOSE THE PLAN THAT FITS YOUR NEEDS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-black">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`border-r-4 border-black last:border-r-0 ${
                plan.popular ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              {plan.popular && (
                <div className="bg-white text-black border-b-4 border-black p-2 text-center">
                  <span className="font-impact text-sm uppercase tracking-tighter">MOST POPULAR</span>
                </div>
              )}

              <div className="p-8 space-y-6">
                <div>
                  <h3 className="font-impact text-3xl uppercase tracking-tighter mb-2">{plan.name}</h3>
                  <p className="font-anton text-sm uppercase mb-6 opacity-80">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="font-impact text-6xl">${plan.price}</span>
                    <span className="font-anton text-lg ml-2 opacity-80">/MONTH</span>
                  </div>
                </div>

                <ul className="space-y-3 border-t-4 border-black pt-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <span className="font-impact text-xl mr-2">+</span>
                      <span className="font-anton text-sm uppercase">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block text-center w-full py-4 border-4 border-black font-impact text-lg uppercase tracking-tighter transition-all ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

