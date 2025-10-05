# 🤖 AI Integration Guide

Complete guide to integrate AI services into your WhiteApp.

## Table of Contents

1. [OpenAI (ChatGPT, DALL-E)](#openai-integration)
2. [Google AI (Gemini)](#google-ai-integration)
3. [Anthropic (Claude)](#anthropic-integration)
4. [Example Implementations](#example-implementations)
5. [Best Practices](#best-practices)

---

## OpenAI Integration

### Setup

1. **Get API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or login
   - Go to API Keys section
   - Create new secret key
   - Add to `.env.local`:
     ```env
     OPENAI_API_KEY=sk-...
     ```

2. **Install SDK**
   ```bash
   npm install openai
   ```

### Chat Completion Example

Create `app/api/chat/route.ts`:

```typescript
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({
      response: completion.choices[0].message.content,
    })
  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
```

### Image Generation Example

Create `app/api/generate-image/route.ts`:

```typescript
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    })

    return NextResponse.json({
      imageUrl: image.data[0].url,
    })
  } catch (error) {
    console.error('DALL-E error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
```

---

## Google AI Integration

### Setup

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create API key
   - Add to `.env.local`:
     ```env
     GOOGLE_AI_API_KEY=...
     ```

2. **Install SDK**
   ```bash
   npm install @google/generative-ai
   ```

### Gemini Chat Example

Create `app/api/gemini/route.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent(message)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Gemini error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
```

### Gemini Vision Example

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { prompt, imageBase64 } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Gemini Vision error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
```

---

## Anthropic Integration

### Setup

1. **Get API Key**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Sign up and get API key
   - Add to `.env.local`:
     ```env
     ANTHROPIC_API_KEY=sk-ant-...
     ```

2. **Install SDK**
   ```bash
   npm install @anthropic-ai/sdk
   ```

### Claude Chat Example

Create `app/api/claude/route.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    return NextResponse.json({
      response: response.content[0].text,
    })
  } catch (error) {
    console.error('Claude error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
```

---

## Example Implementations

### Frontend Chat Component

Create `components/ChatInterface.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function ChatInterface() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    const userMessage = message
    setMessage('')

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()

      // Add AI response to chat
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="space-y-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-primary-100 dark:bg-primary-900 ml-auto max-w-[80%]'
                : 'bg-gray-100 dark:bg-gray-700 max-w-[80%]'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="animate-spin" size={16} />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="btn-primary"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
```

### Streaming Responses

For better UX, implement streaming:

```typescript
// app/api/chat-stream/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { message } = await req.json()

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true,
  })

  const encoder = new TextEncoder()
  
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
```

---

## Best Practices

### Security

1. **Never expose API keys to client**
   - Always call AI APIs from server-side routes
   - Use environment variables

2. **Rate Limiting**
   ```typescript
   // lib/rate-limit.ts
   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'

   export const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   })
   ```

3. **Input Validation**
   ```typescript
   if (message.length > 1000) {
     return NextResponse.json(
       { error: 'Message too long' },
       { status: 400 }
     )
   }
   ```

### Cost Optimization

1. **Cache responses**
   ```typescript
   // Cache common queries
   const cache = new Map()
   const cacheKey = `chat:${message}`
   
   if (cache.has(cacheKey)) {
     return cache.get(cacheKey)
   }
   ```

2. **Use appropriate models**
   - GPT-3.5 Turbo for simple tasks
   - GPT-4 for complex reasoning
   - Adjust max_tokens based on needs

3. **Implement usage tracking**
   ```typescript
   // Track API usage per user
   await supabase
     .from('usage')
     .insert({
       user_id: userId,
       tokens: completion.usage.total_tokens,
       cost: calculateCost(completion.usage),
     })
   ```

### Error Handling

```typescript
try {
  // AI API call
} catch (error) {
  if (error.status === 429) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }
  
  if (error.status === 401) {
    console.error('Invalid API key')
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    )
  }
  
  // Generic error
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  )
}
```

### User Experience

1. **Loading states** - Show when AI is processing
2. **Streaming** - Display responses as they arrive
3. **Error messages** - Clear, user-friendly errors
4. **Usage limits** - Display remaining quota
5. **Retry logic** - Auto-retry failed requests

---

## Testing AI Features

```typescript
// __tests__/api/chat.test.ts
import { POST } from '@/app/api/chat/route'

describe('Chat API', () => {
  it('should return AI response', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello!' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toHaveProperty('response')
    expect(data.response).toBeTruthy()
  })
})
```

---

## Resources

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Anthropic Documentation](https://docs.anthropic.com)

---

**Start building AI-powered features! 🤖**

