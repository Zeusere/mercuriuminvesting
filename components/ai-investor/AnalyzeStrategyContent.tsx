'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { BarChart3, TrendingUp } from 'lucide-react'
import Navigation from '../Navigation'
import ChatInterface from './ChatInterface'
import AnalyzeMode from './AnalyzeMode'
import { ChatMessage, PortfolioAnalysis } from '@/types/ai-investor'
import { MultiPeriodBacktest } from '@/types/stocks'
import { v4 as uuidv4 } from 'uuid'
import { buildConversationPayload } from '@/lib/ai/conversation'

interface AnalyzeStrategyContentProps {
  user: User
}

export default function AnalyzeStrategyContent({ user }: AnalyzeStrategyContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Portfolio Analyst. Select a portfolio from the right panel and I\'ll provide you with:\n\n📊 Detailed performance analysis\n💡 Strengths and weaknesses\n🎯 Actionable recommendations\n📈 Risk assessment\n\nWhich portfolio would you like me to analyze? You can also ask me questions about your investments! 💼',
      timestamp: new Date(),
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null)
  const [portfolioPerformance, setPortfolioPerformance] = useState<MultiPeriodBacktest | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)

  const handleSendMessage = async (messageContent: string) => {
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const conversationPayload = buildConversationPayload(messages, {
        includeMessage: userMessage,
      })

      // Call conversational AI
      const chatResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context: conversationPayload,
          currentAnalysis: portfolioAnalysis
        })
      })

      const chatData = await chatResponse.json()

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: chatData.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPortfolioForAnalysis = async (portfolio: any) => {
    setSelectedPortfolioId(portfolio.id)
    setIsAnalyzing(true)
    
    // Clear previous analysis
    setPortfolioPerformance(null)
    setPortfolioAnalysis(null)

    try {
      // 1. Get backtest data
      const backtestResponse = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: portfolio.stocks,
          total_amount: portfolio.total_amount || 10000,
        }),
      })

      if (!backtestResponse.ok) {
        const errorData = await backtestResponse.json()
        throw new Error(`Failed to calculate backtest: ${errorData.error || 'Unknown error'}`)
      }

      const backtestData: MultiPeriodBacktest = await backtestResponse.json()
      setPortfolioPerformance(backtestData)

      // 2. Get AI analysis
      const analysisResponse = await fetch('/api/ai/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: portfolio.id,
          portfolio_name: portfolio.name,
          stocks: portfolio.stocks,
          total_amount: portfolio.total_amount || 10000,
        }),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(`Failed to get AI analysis: ${errorData.error || 'Unknown error'}`)
      }

      const analysisData: PortfolioAnalysis = await analysisResponse.json()
      setPortfolioAnalysis(analysisData)

      // Add analysis message to chat
      const analysisMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `✅ Analysis complete for **${portfolio.name}**!\n\n${analysisData.analysis}\n\nYou can see the detailed analysis, strengths, and recommendations on the right. Feel free to ask me any questions about this portfolio! 📊`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, analysisMessage])

    } catch (error: any) {
      console.error('Error analyzing portfolio:', error)
      
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Sorry, I encountered an error analyzing this portfolio: ${error.message || 'Please try again.'}\n\nPlease check the console for more details.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="ai-investor" />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="text-primary-600" size={32} />
              Analyze Investment Strategy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get AI-powered insights and recommendations for your portfolios
            </p>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Panel - Chat */}
            <div className="lg:col-span-5">
              <div className="card">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <BarChart3 className="text-primary-600" size={24} />
                  <h2 className="text-xl font-bold">AI Analyst</h2>
                </div>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Ask about your portfolio..."
                />
              </div>
            </div>

            {/* Right Panel - Analysis Results */}
            <div className="lg:col-span-7">
              <AnalyzeMode
                onSelectPortfolio={handleSelectPortfolioForAnalysis}
                analysis={portfolioAnalysis}
                performance={portfolioPerformance}
                isAnalyzing={isAnalyzing}
                selectedPortfolioId={selectedPortfolioId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

