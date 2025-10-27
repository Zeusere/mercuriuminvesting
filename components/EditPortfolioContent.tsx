'use client'

import { User } from '@supabase/supabase-js'
import PortfolioForm from './PortfolioForm'
import Navigation from './Navigation'
import ChatInterface from './ai-investor/ChatInterface'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ChatMessage } from '@/types/ai-investor'
import { Bot, ChevronDown, MessageSquare } from 'lucide-react'
import { PortfolioStock } from '@/types/stocks'
import { buildConversationPayload } from '@/lib/ai/conversation'

interface EditPortfolioContentProps {
  user: User
  portfolio: {
    id: string
    name: string
    stocks: PortfolioStock[]
    total_amount: number
  }
}

export default function EditPortfolioContent({ user, portfolio }: EditPortfolioContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: uuidv4(),
    role: 'assistant',
    content: '👋 Hi! I\'m your AI Portfolio Assistant. I can help you edit this portfolio by suggesting changes, equalizing weights, adding or removing stocks. For example:\n• "Equalize all weights"\n• "Add NVDA with 5% and remove 5% from PLTR"\n• "Show me tech stocks to add"\n\nWhat would you like to do? 🚀',
    timestamp: new Date()
  }])
  const [isLoading, setIsLoading] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleSendMessage = async (messageContent: string) => {
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const conversationPayload = buildConversationPayload(messages, {
        includeMessage: userMessage,
      })

      const chatResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, context: conversationPayload })
      })
      const chatData = await chatResponse.json()

      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: chatData.message, timestamp: new Date() }])

      if (Array.isArray(chatData.stocks) && chatData.stocks.length > 0) {
        const event = new CustomEvent('ai-add-stocks', { detail: { stocks: chatData.stocks } })
        window.dispatchEvent(event)
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: 'Ha ocurrido un error procesando tu petición.', timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Navigation user={user} currentPage="portfolios" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* AI Chat Section - Only visible when open */}
        {isChatOpen && (
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
                placeholder="Ask me to edit your portfolio: equalize weights, add/remove stocks, etc."
              />
            </div>
          </div>
        )}

        <PortfolioForm 
          initialPortfolio={portfolio} 
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
        />
      </main>
    </div>
  )
}