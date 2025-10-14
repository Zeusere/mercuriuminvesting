import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Testimonials from '@/components/Testimonials'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Mercurium Investments - AI-Powered Investment Strategies & Social Trading',
  description: 'Build winning investment strategies with artificial intelligence and copy top-performing traders. Join the most advanced social trading platform with AI assistance, real-time analysis, and automated portfolio management.',
  keywords: 'investment strategies, AI trading, social trading, portfolio management, copy trading, artificial intelligence, financial technology, investment platform, trading community, automated investing',
}

export default function Home() {
  return (
    <div className="dark">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />
    </div>
  )
}