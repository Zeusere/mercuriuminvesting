# AI Investor - Setup and Architecture

## 🎯 Overview

The AI Investor is an intelligent investment assistant that helps users:
- **Create Portfolios**: AI-powered portfolio builder based on natural language criteria
- **Analyze Investments**: Deep analysis of existing portfolios with actionable recommendations
- **Broker Orders**: Natural language trading orders (existing functionality integrated)

## 📁 Project Structure

```
components/
├── ai-investor/
│   ├── AIInvestorLayout.tsx         # Main layout with tabs and coordination
│   ├── ChatInterface.tsx            # Chat UI component (ChatGPT-style)
│   ├── CreatePortfolioMode.tsx      # Portfolio creation mode
│   ├── AnalyzeMode.tsx             # Portfolio analysis mode
│   └── BrokerOrdersMode.tsx        # Trading orders mode
├── AIInvestorContent.tsx            # Wrapper component
types/
└── ai-investor.ts                   # TypeScript types for AI Investor
```

## 🏗️ Phase 1: Base Structure ✅ COMPLETED

### Components Created

#### 1. **AIInvestorLayout.tsx**
Main container that manages:
- Tab navigation between 3 modes
- Chat interface integration
- State management for messages and AI responses
- Coordination between chat and results panel

**Key Features:**
- Responsive 2-column layout (chat left, results right)
- Sticky chat interface
- Tab switching with visual feedback
- Mode-specific placeholders

#### 2. **ChatInterface.tsx**
ChatGPT-style chat interface with:
- Message history display
- User/AI message differentiation
- Avatar icons (User/Bot)
- Timestamp formatting
- Auto-scroll to latest message
- Loading indicator
- Input field with send button

**Props:**
```typescript
{
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  placeholder?: string
}
```

#### 3. **CreatePortfolioMode.tsx**
Portfolio creation results panel with:
- AI summary card (risk, amount, stocks count)
- Portfolio name input
- Editable stock recommendations
- Weight adjustments (inline editing)
- Remove stock capability
- Weight validation (must sum to 100%)
- Save to database
- Regenerate button

**Features:**
- Real-time weight total calculation
- Visual validation feedback
- Stock metrics display (1Y performance, price, volatility)
- AI reasoning for each stock selection

#### 4. **AnalyzeMode.tsx**
Portfolio analysis results panel with:
- Overall score display (X/10)
- Analysis summary
- Risk level and diversification score
- Strengths list
- Weaknesses/Areas for improvement
- Actionable recommendations with:
  - Action type (increase/decrease/hold/remove/add)
  - Priority levels (high/medium/low)
  - Current vs suggested weights
  - Reasoning

**Empty State:**
- Displays user's portfolios as cards
- Instructions on how to analyze

#### 5. **BrokerOrdersMode.tsx**
Wraps existing order functionality:
- Stats cards (active, executed, value)
- OrderInput component
- OrdersList component
- Usage tips

### Types Created

**File: `types/ai-investor.ts`**

```typescript
export type AIMode = 'create-portfolio' | 'analyze' | 'broker-orders'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    stocks?: StockRecommendation[]
    analysis?: PortfolioAnalysis
    order?: any
  }
}

export interface StockRecommendation {
  symbol: string
  name: string
  weight: number
  reason: string
  metrics: {
    performance_1y?: number
    performance_ytd?: number
    volatility?: string
    market_cap?: number
    price?: number
    volume?: number
  }
}

export interface PortfolioSuggestion {
  stocks: StockRecommendation[]
  summary: string
  risk_assessment: string
  total_amount: number
  expected_return?: string
  diversification_score?: number
}

export interface PortfolioAnalysis {
  portfolio_id: string
  portfolio_name: string
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: AnalysisRecommendation[]
  overall_score: number
  risk_level: string
  diversification_score: number
}

export interface AnalysisRecommendation {
  action: 'increase' | 'decrease' | 'hold' | 'remove' | 'add'
  symbol: string
  current_weight?: number
  suggested_weight?: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}
```

## 🎨 UI/UX Features

### Design Highlights
- **Tab Pills**: Active tab has gradient background and scale animation
- **Chat Messages**: Alternating left/right layout for user/AI
- **Stock Cards**: Gradient backgrounds with hover effects
- **Editable Weights**: Inline editing with check/cancel
- **Priority Badges**: Color-coded (red/yellow/green)
- **Loading States**: Skeleton loaders and spinners
- **Empty States**: Helpful illustrations and CTAs

### Responsive Design
- Desktop: 2-column layout (chat | results)
- Mobile: Single column stack
- Sticky chat on desktop (70vh height)

## 🚀 Next Steps

### Phase 2: Create Portfolio Mode API (TODO)

**API Endpoint: `/api/ai/create-portfolio`**

**Request:**
```typescript
{
  prompt: string
  total_amount: number
  context: ChatMessage[]
}
```

**Flow:**
1. Extract investment criteria from prompt using OpenAI
2. Search for matching stocks in Alpaca
3. Calculate historical performance metrics
4. Use OpenAI to select best candidates
5. Generate weights and reasoning
6. Return structured portfolio suggestion

**Implementation Plan:**
- Create OpenAI system prompt for portfolio creation
- Build stock search and filtering logic
- Integrate Alpaca data APIs
- Calculate performance metrics
- Generate AI recommendations
- Return formatted response

### Phase 3: Analyze Portfolio Mode API (TODO)

**API Endpoint: `/api/ai/analyze-portfolio`**

**Request:**
```typescript
{
  portfolio_id: string
  question?: string
}
```

**Flow:**
1. Fetch portfolio from database
2. Get current data for all stocks
3. Calculate performance since creation
4. Fetch recent news
5. Use OpenAI to analyze:
   - Diversification
   - Risk exposure
   - Correlation
   - Rebalancing needs
6. Generate recommendations

### Phase 4: Testing & Refinement (TODO)

- Error handling for API failures
- Rate limiting and caching
- Loading states polish
- Mobile optimization
- Accessibility improvements
- Performance optimization

## 🔧 Configuration Needed

### Environment Variables
```env
OPENAI_API_KEY=your_openai_key
ALPACA_API_KEY=your_alpaca_key
ALPACA_API_SECRET=your_alpaca_secret
```

### Dependencies
Already installed:
- `uuid` (for message IDs)
- `lucide-react` (icons)

## 📊 Current State

✅ **Phase 1: COMPLETED**
- Layout structure
- Tab navigation
- Chat interface
- All 3 mode components
- Type definitions
- Integration with existing pages

🔄 **Phase 2: IN PROGRESS** (next)
- API implementation for portfolio creation
- OpenAI integration
- Alpaca data integration

⏳ **Phase 3: PENDING**
- Portfolio analysis API
- Deep analysis features

⏳ **Phase 4: PENDING**
- Testing and refinement

## 💡 Usage

### Current Functionality
1. Navigate to `/ai-investor`
2. Switch between tabs
3. UI is fully functional but AI responses are placeholders
4. Broker Orders mode is fully functional (existing feature)

### After Phase 2 Completion
1. Users can describe investment strategy in chat
2. AI analyzes request and suggests portfolio
3. Users can edit weights and save portfolio
4. Portfolios saved to existing database

## 🎯 Success Criteria

- [ ] Users can create portfolios via natural language
- [ ] AI provides relevant stock recommendations
- [ ] Portfolios can be edited before saving
- [ ] Analysis provides actionable insights
- [ ] All modes work seamlessly together
- [ ] Mobile responsive
- [ ] Error handling is robust

## 📝 Notes

- The Broker Orders mode reuses existing `OrderInput` and `OrdersList` components
- All portfolio data uses existing database tables
- Chat history is session-based (not persisted yet)
- OpenAI API calls will need cost monitoring
- Alpaca free tier limitations should be considered
