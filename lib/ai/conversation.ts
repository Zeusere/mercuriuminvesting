import type { ChatMessage } from '@/types/ai-investor'

export interface ConversationMessage {
  role: ChatMessage['role']
  content: string
}

interface ConversationOptions {
  includeMessage?: ChatMessage
  limit?: number
}

export function buildConversationPayload(
  messages: ChatMessage[],
  options: ConversationOptions = {}
): ConversationMessage[] {
  const { includeMessage, limit = 12 } = options
  const conversation = includeMessage ? [...messages, includeMessage] : [...messages]
  const trimmed = conversation.slice(-limit)

  return trimmed.map(({ role, content }) => ({
    role,
    content,
  }))
}
