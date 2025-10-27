'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Bot, Sparkles } from 'lucide-react'
import Navigation from '../Navigation'
import ChatInterface from './ChatInterface'
import PortfolioBuilder from '../PortfolioBuilder'
import { ChatMessage, StockRecommendation } from '@/types/ai-investor'
import { PortfolioStock } from '@/types/stocks'
import { v4 as uuidv4 } from 'uuid'
import { buildConversationPayload } from '@/lib/ai/conversation'

interface CreateStrategyContentProps {
  user: User
}

export default function CreateStrategyContent({ user }: CreateStrategyContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Portfolio Assistant. I can help you build investment strategies in two ways:\n\n💬 **Chat with me** to get stock recommendations based on your criteria\n🔧 **Build manually** using the portfolio builder below\n\nTell me what you\'re looking for! For example:\n• "Create a tech-focused growth portfolio"\n• "I want dividend stocks for stable income"\n• "Show me the best semiconductor companies"\n• "Add NVDA to my portfolio"\n\nWhat would you like to do? 🚀',
      timestamp: new Date(),
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

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

      // Handle different intents
      if (chatData.intent === 'create_portfolio' && chatData.needs_data) {
        await handleCreatePortfolio(messageContent, [...messages, userMessage, aiMessage])
      } else if (chatData.intent === 'stock_info' && chatData.action?.details?.symbol) {
        await handleStockInfo(chatData.action.details.symbol)
      }

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

  const handleCreatePortfolio = async (
    prompt: string,
    conversation: ChatMessage[] = messages
  ) => {
    try {
      const response = await fetch('/api/ai/create-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: buildConversationPayload(conversation),
        })
      })

      const data = await response.json()

      if (response.ok && data.stocks && data.stocks.length > 0) {
        // Convert AI stocks to PortfolioStock format and add them to the builder
        const portfolioStocks: PortfolioStock[] = data.stocks.map((stock: StockRecommendation) => ({
          symbol: stock.symbol,
          weight: stock.weight,
        }))

        // Trigger an event or use a callback to add stocks to PortfolioBuilder
        // For now, we'll dispatch a custom event
        const event = new CustomEvent('ai-add-stocks', { 
          detail: { stocks: portfolioStocks } 
        })
        window.dispatchEvent(event)

        const successMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `✅ Great! I've added ${data.stocks.length} stocks to your portfolio below:\n\n${data.stocks.map((s: StockRecommendation) => `• **${s.symbol}** (${s.weight}%) - ${s.reason}`).join('\n')}\n\nYou can now:\n• Adjust the weights manually\n• Add or remove stocks\n• Calculate performance\n• Save your portfolio\n\nWant me to make any changes?`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, successMessage])
      }
    } catch (error) {
      console.error('Error creating portfolio:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I had trouble creating that portfolio. Please try again or build it manually below.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleStockInfo = async (symbol: string) => {
    try {
      const response = await fetch(`/api/stocks/info?symbol=${symbol}`)
      if (response.ok) {
        const data = await response.json()
        const infoMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `📊 **${symbol}** - ${data.name}\n\n💰 **Price:** $${data.price?.toFixed(2) || 'N/A'}\n📈 **3M Performance:** ${data.performance_3m ? (data.performance_3m >= 0 ? '+' : '') + data.performance_3m.toFixed(2) + '%' : 'N/A'}\n📊 **Volatility:** ${data.volatility ? data.volatility.toFixed(2) + '%' : 'N/A'}\n\nWould you like me to add this to your portfolio? Just say "add ${symbol}" or use the search below to add it manually.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, infoMessage])
      }
    } catch (error) {
      console.error('Error fetching stock info:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="ai-investor" />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="text-primary-600" size={32} />
              Create Investment Strategy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build your portfolio with AI assistance or manually - all in one place
            </p>
          </div>

          {/* AI Chat Section */}
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Bot className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold">AI Portfolio Assistant</h2>
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                Online
              </span>
            </div>
            <div className="h-96">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask me to build a portfolio, analyze stocks, or get recommendations..."
              />
            </div>
          </div>

          {/* Portfolio Builder Section */}
          <div id="portfolio-form">
            <PortfolioBuilder showSavedPortfolios={false} />
          </div>
        </div>
      </main>
    </div>
  )
}
