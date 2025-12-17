import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out the platform',
    features: [
      'Basic portfolio creation',
      'Community access',
      'Limited AI suggestions',
      'Paper trading',
    ],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'Best for active traders',
    features: [
      'Everything in Free',
      'Unlimited AI strategies',
      'Advanced backtesting',
      'Real-time execution',
      'Priority support',
      'API access',
    ],
    cta: 'Get started',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '99',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'Team management',
    ],
    cta: 'Contact sales',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple fixed monthly subscription. Test for free.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            * No commissions on trades. Zero management fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-8 border-2 transition-all ${
                plan.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-center py-2 px-4 rounded-lg mb-6 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 border-t border-gray-200 pt-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block text-center w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing? <Link href="#" className="text-blue-600 hover:underline font-semibold">Contact us</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

