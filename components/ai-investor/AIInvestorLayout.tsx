'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { TrendingUp, BarChart3, ShoppingCart, Bot } from 'lucide-react'
import Navigation from '../Navigation'
import ChatInterface from './ChatInterface'
import CreatePortfolioMode from './CreatePortfolioMode'
import AnalyzeMode from './AnalyzeMode'
import BrokerOrdersMode from './BrokerOrdersMode'
import { AIMode, ChatMessage, PortfolioSuggestion, PortfolioAnalysis } from '@/types/ai-investor'
import { MultiPeriodBacktest } from '@/types/stocks'
import { v4 as uuidv4 } from 'uuid'
import { buildConversationPayload } from '@/lib/ai/conversation'

interface AIInvestorLayoutProps {
  user: User
}

export default function AIInvestorLayout({ user }: AIInvestorLayoutProps) {
  const [activeMode, setActiveMode] = useState<AIMode>('create-portfolio')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Investment Advisor. I\'m here to help you build and optimize your investment portfolio.\n\nTell me what kind of investments you\'re interested in! For example:\n• "I want tech stocks with high growth"\n• "Build a balanced portfolio for long-term"\n• "Tell me about NVIDIA"\n• "Show me the best performing stocks from last quarter"\n\nWhat would you like to do today? 🚀',
      timestamp: new Date(),
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [portfolioSuggestion, setPortfolioSuggestion] = useState<PortfolioSuggestion | null>(null)
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null)
  const [portfolioPerformance, setPortfolioPerformance] = useState<MultiPeriodBacktest | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleSendMessage = async (messageContent: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const conversationWithUser = [...messages, userMessage]
      const conversationPayload = buildConversationPayload(conversationWithUser)

      // For broker orders mode, use existing system
      if (activeMode === 'broker-orders') {
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Please use the order input below to create trading orders with natural language or voice.',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, aiMessage])
        setIsLoading(false)
        return
      }

      // For create-portfolio and analyze modes, use conversational AI
      const chatResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context: conversationPayload,
          currentPortfolio: portfolioSuggestion
        })
      })

      const chatData = await chatResponse.json()

      console.log('Chat response:', chatData)

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: chatData.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])

      const conversationWithAI = [...conversationWithUser, aiMessage]

      // Handle different intents
      if (chatData.intent === 'create_portfolio' && chatData.needs_data) {
        // User wants to create a portfolio, call the create portfolio API
        await handleCreatePortfolio(messageContent, conversationWithAI)
      } else if (chatData.intent === 'modify_portfolio' && chatData.action) {
        // User wants to modify the current portfolio
        await handleModifyPortfolio(chatData.action)
      } else if (chatData.intent === 'stock_info' && chatData.action?.details?.symbol) {
        // User wants info about a specific stock
        await handleStockInfo(chatData.action.details.symbol)
      } else if (chatData.intent === 'analyze' && activeMode === 'analyze') {
        // User wants to analyze a portfolio
        await handleAnalyzePortfolio(messageContent)
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
          total_amount: 10000,
          context: buildConversationPayload(conversation)
        })
      })

      const data = await response.json()

      console.log('Frontend received data:', data)
      console.log('Frontend received stocks:', data.stocks?.length)

      if (!response.ok) {
        throw new Error(data.message || 'Error creating portfolio')
      }

      // Add AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.ai_message || data.summary || 'Portfolio created successfully!',
        timestamp: new Date(),
        metadata: {
          stocks: data.stocks
        }
      }
      setMessages(prev => [...prev, aiMessage])

      // Set portfolio suggestion for the results panel
      if (data.stocks && data.stocks.length > 0) {
        setPortfolioSuggestion({
          stocks: data.stocks,
          summary: data.summary,
          risk_assessment: data.risk_assessment,
          total_amount: data.total_amount
        })
        
        // Add a follow-up message asking for feedback
        setTimeout(() => {
          const followUpMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '✨ There you go! I\'ve created your portfolio on the right. Take a look at the suggestions.\n\nWhat do you think? 🤔\n\n• Happy with it? → Save it!\n• Want changes? → Just tell me! (e.g., "Replace TSLA with MSFT")\n• Want info? → Ask me about any stock!',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, followUpMessage])
        }, 1000)
      } else {
        // No stocks found
        const noResultsMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: data.message || 'I couldn\'t find suitable stocks matching your criteria. Try adjusting your requirements or being more specific. 🔍',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noResultsMessage])
      }

    } catch (error: any) {
      console.error('Error creating portfolio:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleAnalyzePortfolio = async (prompt: string) => {
    try {
      // First, fetch user's portfolios to find which one to analyze
      const portfoliosResponse = await fetch('/api/portfolios')
      if (!portfoliosResponse.ok) {
        throw new Error('Failed to fetch portfolios')
      }

      const portfoliosData = await portfoliosResponse.json()
      const portfolios = portfoliosData.portfolios || []

      if (portfolios.length === 0) {
        const noPortfoliosMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: 'You don\'t have any portfolios to analyze yet. Would you like me to help you create one first? 🎯',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noPortfoliosMsg])
        return
      }

      // Simple portfolio selection logic:
      // 1. If prompt mentions a specific portfolio name, use that
      // 2. Otherwise, use the most recent one
      const promptLower = prompt.toLowerCase()
      let selectedPortfolio = portfolios.find((p: any) => 
        promptLower.includes(p.name.toLowerCase())
      )

      // If no specific portfolio found, use the first one (most recent)
      if (!selectedPortfolio) {
        selectedPortfolio = portfolios[0]
        
        // Inform user which portfolio we're analyzing
        const clarificationMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `I'll analyze your "${selectedPortfolio.name}" portfolio. One moment while I crunch the numbers... 📊`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, clarificationMsg])
      }

      // Call the analyze API
      const analyzeResponse = await fetch('/api/ai/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: selectedPortfolio.id,
          portfolio_name: selectedPortfolio.name,
          stocks: selectedPortfolio.stocks,
          total_amount: selectedPortfolio.total_amount
        })
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze portfolio')
      }

      const analysisData = await analyzeResponse.json()

      console.log('Analysis received:', analysisData)

      // Set the analysis to display in the results panel
      setPortfolioAnalysis(analysisData)

      // Add a message summarizing the analysis
      const summaryMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `✅ Analysis complete! I've evaluated your **${analysisData.portfolio_name}** portfolio and found some interesting insights.\n\n` +
                 `**Overall Score:** ${analysisData.overall_score}/10\n` +
                 `**Risk Level:** ${analysisData.risk_level}\n` +
                 `**Diversification:** ${analysisData.diversification_score}/10\n\n` +
                 `Check out the detailed analysis on the right. I've identified ${analysisData.strengths.length} strengths, ` +
                 `${analysisData.weaknesses.length} areas for improvement, and ` +
                 `${analysisData.recommendations.length} specific recommendations. 📈\n\n` +
                 `Would you like me to explain any specific recommendation or help you implement the changes?`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, summaryMsg])

    } catch (error: any) {
      console.error('Error analyzing portfolio:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error analyzing your portfolio. Please try again or select a specific portfolio from the list below.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleModifyPortfolio = async (action: any) => {
    if (!portfolioSuggestion) return

    try {
      if (action.type === 'swap' && action.details.remove && action.details.add) {
        // Swap one stock for another
        const { remove, add } = action.details
        
        // Find the stock to remove
        const oldStock = portfolioSuggestion.stocks.find(s => 
          s.symbol.toUpperCase() === remove.toUpperCase()
        )
        
        if (!oldStock) {
          const msg: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `I couldn't find ${remove} in your current portfolio.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, msg])
          return
        }

        // Get info about the new stock
        const stockInfo = await fetch(`/api/stocks/info?symbol=${add}`)
        if (!stockInfo.ok) {
          const msg: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `I couldn't find information about ${add}. Please check the symbol.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, msg])
          return
        }

        const newStockData = await stockInfo.json()
        
        // Replace the stock
        const updatedStocks = portfolioSuggestion.stocks.map(s => {
          if (s.symbol.toUpperCase() === remove.toUpperCase()) {
            return {
              symbol: add.toUpperCase(),
              name: newStockData.name,
              weight: s.weight,
              reason: action.details.reason || `Replaced ${remove} as requested`,
              metrics: {
                performance_3m: newStockData.performance_3m,
                price: newStockData.price,
                volatility: newStockData.volatility
              }
            }
          }
          return s
        })

        setPortfolioSuggestion({
          ...portfolioSuggestion,
          stocks: updatedStocks
        })

        const confirmMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `✅ Done! I've replaced ${remove} with ${add} (${newStockData.name}). The weight remains at ${oldStock.weight}%. What do you think?`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, confirmMsg])
      }
    } catch (error) {
      console.error('Error modifying portfolio:', error)
    }
  }

  const handleStockInfo = async (symbol: string) => {
    try {
      const stockInfo = await fetch(`/api/stocks/info?symbol=${symbol}`)
      if (!stockInfo.ok) {
        return
      }

      const data = await stockInfo.json()
      
      const infoMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `📊 **${data.symbol} - ${data.name}**\n\n` +
                 `💵 Price: $${data.price.toFixed(2)}\n` +
                 `📈 3M Performance: ${data.performance_3m >= 0 ? '+' : ''}${data.performance_3m.toFixed(2)}%\n` +
                 `📉 Volatility: ${data.volatility.toFixed(2)}%\n` +
                 `📊 Volume: ${(data.volume / 1000000).toFixed(2)}M\n\n` +
                 `Would you like to add this to your portfolio or get more information?`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, infoMessage])
    } catch (error) {
      console.error('Error fetching stock info:', error)
    }
  }

  const handleRegenerate = () => {
    // Clear current suggestion and show message to adjust via chat
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: 'I can help you adjust this portfolio! Please tell me what changes you\'d like. For example:\n\n• "Replace TSLA with MSFT"\n• "Focus more on growth stocks"\n• "Reduce risk by adding more stable companies"\n• "Tell me about NVDA"',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const handleSelectPortfolioForAnalysis = async (portfolio: any) => {
    // Clear previous analysis first
    setPortfolioPerformance(null)
    setPortfolioAnalysis(null)
    setIsAnalyzing(true)
    
    try {
      // Add message to chat
      const initMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Perfect! I'm analyzing your **${portfolio.name}** portfolio. Let me calculate its performance and evaluate its composition... 📊`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, initMessage])

      // 1. Fetch performance/backtest data
      const backtestResponse = await fetch('/api/portfolios/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: portfolio.stocks,
          total_amount: portfolio.total_amount
        })
      })

      if (!backtestResponse.ok) {
        throw new Error('Failed to calculate performance')
      }

      const backtestData = await backtestResponse.json()
      
      // Validate backtest data
      if (!backtestData || !backtestData['1Y']) {
        console.error('Invalid backtest data - missing 1Y:', backtestData)
        throw new Error('Invalid backtest data received')
      }
      
      setPortfolioPerformance(backtestData)

      // 2. Call AI analysis
      const analysisResponse = await fetch('/api/ai/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: portfolio.id,
          portfolio_name: portfolio.name,
          stocks: portfolio.stocks,
          total_amount: portfolio.total_amount
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze portfolio')
      }

      const analysisData = await analysisResponse.json()
      setPortfolioAnalysis(analysisData)

      // Add comprehensive summary message
      const yearData = backtestData['1Y'] || {}
      const totalReturn = yearData.total_return || 0
      const finalValue = yearData.final_value || portfolio.total_amount
      const volatility = yearData.volatility || 0
      
      const summaryMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `✅ Analysis complete for **${portfolio.name}**!\n\n` +
                 `📈 **Performance Overview:**\n` +
                 `• 1-Year Return: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%\n` +
                 `• Current Value: $${finalValue.toLocaleString()}\n` +
                 `• Volatility: ${volatility.toFixed(2)}%\n\n` +
                 `🎯 **AI Assessment:**\n` +
                 `• Overall Score: ${analysisData.overall_score}/10\n` +
                 `• Risk Level: ${analysisData.risk_level}\n` +
                 `• Diversification: ${analysisData.diversification_score}/10\n\n` +
                 `I've identified ${analysisData.strengths?.length || 0} strengths, ${analysisData.weaknesses?.length || 0} areas for improvement, ` +
                 `and ${analysisData.recommendations?.length || 0} specific recommendations to optimize your portfolio.\n\n` +
                 `💬 **What would you like to know?**\n` +
                 `• "Why is my diversification score ${analysisData.diversification_score}?"\n` +
                 `• "Tell me more about ${analysisData.recommendations?.[0]?.symbol || 'the recommendations'}"\n` +
                 `• "How can I reduce risk?"\n` +
                 `• "Should I rebalance based on these recommendations?"`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, summaryMsg])

    } catch (error: any) {
      console.error('Error analyzing portfolio:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Sorry, I encountered an error analyzing your portfolio: ${error.message}. Please try again or select a different portfolio.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const tabs = [
    {
      id: 'create-portfolio' as AIMode,
      name: 'Create Portfolio',
      icon: TrendingUp,
      description: 'AI-powered portfolio builder',
    },
    {
      id: 'analyze' as AIMode,
      name: 'Analyze Investments',
      icon: BarChart3,
      description: 'Deep dive into your portfolios',
    },
    {
      id: 'broker-orders' as AIMode,
      name: 'Broker Orders',
      icon: ShoppingCart,
      description: 'Natural language trading',
    },
  ]

  const getPlaceholder = () => {
    switch (activeMode) {
      case 'create-portfolio':
        return 'E.g., "I want to invest in AI companies with highest revenue growth"'
      case 'analyze':
        return 'E.g., "Analyze my Tech Portfolio and suggest improvements"'
      case 'broker-orders':
        return 'Use the order input below for creating orders'
      default:
        return 'How can I help you today?'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} currentPage="ai-investor" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Investor</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your intelligent investment assistant
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeMode === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <div className="text-left">
                    <div className="font-semibold">{tab.name}</div>
                    <div className={`text-xs ${isActive ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Interface - Left Side (narrower) */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: '75vh' }}>
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder={getPlaceholder()}
                />
              </div>
            </div>
          </div>

          {/* Results Panel - Right Side (wider) */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {activeMode === 'create-portfolio' && (
                <CreatePortfolioMode
                  suggestion={portfolioSuggestion}
                  onRegenerate={handleRegenerate}
                  onPortfolioUpdate={(updated) => setPortfolioSuggestion(updated)}
                />
              )}
              {activeMode === 'analyze' && (
                <AnalyzeMode 
                  analysis={portfolioAnalysis} 
                  performance={portfolioPerformance}
                  onSelectPortfolio={handleSelectPortfolioForAnalysis}
                  isAnalyzing={isAnalyzing}
                />
              )}
              {activeMode === 'broker-orders' && (
                <BrokerOrdersMode />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
