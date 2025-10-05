import { Mic, Brain, Shield, TrendingUp, Clock, Zap } from 'lucide-react'

const features = [
  {
    icon: Mic,
    title: 'Voz y Texto',
    description: 'Crea órdenes usando tu voz o texto. El sistema interpreta lenguaje natural para máxima comodidad.',
  },
  {
    icon: Brain,
    title: 'Inteligencia Artificial',
    description: 'OpenAI GPT-4 procesa tus instrucciones y las convierte en órdenes estructuradas con alta precisión.',
  },
  {
    icon: Shield,
    title: 'Stop Loss & Take Profit',
    description: 'Protege tus inversiones con stop loss automático y asegura ganancias con take profit.',
  },
  {
    icon: TrendingUp,
    title: 'Múltiples Tipos de Órdenes',
    description: 'Soporta órdenes de mercado, límite, stop loss y take profit para estrategias avanzadas.',
  },
  {
    icon: Clock,
    title: 'Historial Completo',
    description: 'Visualiza todas tus órdenes activas, ejecutadas y pendientes en tiempo real.',
  },
  {
    icon: Zap,
    title: 'Ejecución Rápida',
    description: 'Las órdenes se procesan instantáneamente y se envían a tu broker para ejecución inmediata.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Trading Inteligente
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Todo lo que necesitas para operar en los mercados con inteligencia artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card group hover:scale-105"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors duration-300">
                <feature.icon className="text-primary-600 group-hover:text-white transition-colors duration-300" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

