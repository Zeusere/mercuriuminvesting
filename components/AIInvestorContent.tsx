'use client'

import { User } from '@supabase/supabase-js'
import AIInvestorLayout from './ai-investor/AIInvestorLayout'

interface AIInvestorContentProps {
  user: User
}

export default function AIInvestorContent({ user }: AIInvestorContentProps) {
  return <AIInvestorLayout user={user} />
}