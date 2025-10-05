import Link from 'next/link'
import { Bot, ArrowRight, Mic } from 'lucide-react'

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            <Bot size={16} />
            <span>Trading impulsado por Inteligencia Artificial</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Crea Órdenes con
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Texto o Voz
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Dashboard de trading con IA. Di &quot;Comprar Palantir con stop loss de 1000 euros&quot; 
            y la inteligencia artificial creará y ejecutará tu orden automáticamente.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="btn-primary flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <span>Comenzar Gratis</span>
              <ArrowRight size={20} />
            </Link>
            <Link href="#features" className="btn-outline">
              Ver Características
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                <Mic className="inline mb-1" size={32} />
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Voz & Texto</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">AI</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inteligencia Artificial</p>
            </div>
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">24/7</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Siempre Activo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

