# 🤖 AI Real Portfolio Integration Guide

## Overview

Mercurium now features a powerful AI Investment Advisor that analyzes your **real brokerage portfolios** connected via Plaid. This guide explains how to use the AI to get professional-grade portfolio analysis and recommendations.

---

## 🚀 Features

### 1. **Portfolio Analysis**
The AI can provide comprehensive analysis of your real portfolio:
- Risk assessment
- Diversification analysis
- Sector allocation
- Concentration risk
- Overall portfolio health

### 2. **Rebalancing Recommendations**
Get smart suggestions to optimize your portfolio:
- Equal weight rebalancing
- Conservative/Moderate/Aggressive allocations
- Specific buy/sell recommendations
- Dollar amounts to adjust

### 3. **Tax Optimization**
Identify opportunities to save on taxes:
- Tax loss harvesting candidates
- Estimated tax savings
- Wash sale rule guidance
- Long-term vs short-term capital gains

### 4. **Stock Deep Dives**
Detailed analysis of individual holdings:
- Performance metrics
- Gain/Loss analysis
- Position sizing recommendations
- Entry/Exit strategies

### 5. **Benchmark Comparisons**
Compare your portfolio vs market indices:
- S&P 500 (SPY)
- NASDAQ (QQQ)
- Dow Jones (DIA)
- Russell 2000 (IWM)

---

## 📋 How to Use

### Step 1: Connect Your Brokerage Account
1. Go to **Portfolios** → **Real Portfolio** tab
2. Click **"Connect Account"**
3. Select your broker (Robinhood, Fidelity, etc.)
4. Authenticate with your credentials
5. Click **"Sync Now"** to load your holdings

### Step 2: Open AI Assistant
1. In the **Real Portfolio** tab, click the **"AI Assistant"** button (top right)
2. The AI chat interface will open
3. You'll see a welcome message with available capabilities

### Step 3: Ask Questions
The AI can understand natural language. Try asking:

#### General Analysis
```
"Analyze my portfolio"
"How diversified is my portfolio?"
"What's my risk level?"
"Give me an overall assessment"
```

#### Diversification & Concentration
```
"Check my concentration risk"
"Analyze my top holdings"
"Am I too concentrated?"
"Show me sector allocation"
```

#### Rebalancing
```
"Should I rebalance?"
"Suggest rebalancing for moderate risk"
"How can I optimize my allocation?"
"Give me equal weight recommendations"
```

#### Tax Optimization
```
"Find tax loss harvesting opportunities"
"What losses can I harvest?"
"Show me tax-efficient strategies"
"Help me reduce my tax bill"
```

#### Individual Stocks
```
"Analyze my AAPL position"
"Should I buy more TSLA?"
"What do you think about my NVDA holding?"
"Is my MSFT position too large?"
```

#### Performance
```
"How am I performing vs S&P 500?"
"Compare my returns to NASDAQ"
"Am I beating the market?"
"Show me my best and worst performers"
```

---

## 🎯 Example Conversations

### Example 1: Initial Portfolio Analysis

**You:** "Analyze my portfolio"

**AI:** 
```
📊 Portfolio Analysis for Your Real Portfolio

**Overview:**
- Total Value: $50,234.56
- Total Gain/Loss: +$5,234.56 (+11.64%)
- Number of Holdings: 12
- Diversification: ⚡ Good

**Strengths:**
✅ Strong overall performance (+11.64%)
✅ Good number of holdings (12)
✅ Positive returns across most positions

**Areas for Improvement:**
⚠️ Top 3 holdings represent 45% of portfolio (concentration risk)
⚠️ Limited sector diversification
⚠️ Consider adding international exposure

**Top Performers:**
1. NVDA: +45.2% ($8,234)
2. AAPL: +23.1% ($4,567)
3. MSFT: +18.9% ($3,890)

Would you like me to dive deeper into any specific area?
```

---

### Example 2: Tax Loss Harvesting

**You:** "Find tax loss harvesting opportunities"

**AI:**
```
💰 Tax Loss Harvesting Opportunities:

**Potential Tax Savings:** ~$487.50 (assuming 25% tax rate)

**Positions to Consider:**

- **PLTR**: -12.5% loss ($-1,250)
  - Current Value: $8,750
  - Cost Basis: $10,000
  - Recommendation: Consider harvesting before year-end

- **COIN**: -8.3% loss ($-600)
  - Current Value: $6,600
  - Cost Basis: $7,200
  - Recommendation: Monitor for wash sale rules

**Strategy:**
1. Sell losing positions before December 31st
2. Harvest losses to offset capital gains
3. Wait 30 days to avoid wash sale (or buy similar ETF)
4. Reinvest in similar but not identical securities

⚠️ **Important:** Consult with a tax professional before executing.

Would you like specific recommendations on what to buy instead?
```

---

### Example 3: Rebalancing

**You:** "Suggest rebalancing for moderate risk"

**AI:**
```
⚖️ Rebalancing Recommendations (MODERATE):

**Target:** Equal weight (~8.33% per position)

**Positions Needing Adjustment:**

- **NVDA**: Currently 16.4% → Target 8.33%
  - Action: REDUCE by $4,067.89 (8.07%)
  - Sell ~12.5 shares

- **AAPL**: Currently 14.2% → Target 8.33%
  - Action: REDUCE by $2,950.12 (5.87%)
  - Sell ~16.2 shares

- **PLTR**: Currently 3.1% → Target 8.33%
  - Action: INCREASE by $2,625.45 (5.23%)
  - Buy ~125.3 shares

**Benefits of Rebalancing:**
- Maintain target risk level
- Take profits from winners (NVDA, AAPL)
- Buy dips in underperformers (PLTR)
- Reduce concentration risk

💡 **Tip:** Rebalance quarterly or when positions drift >5% from target.

Would you like me to create a detailed action plan?
```

---

## 🧠 AI Capabilities (Technical)

### Function Calling
The AI uses OpenAI's function calling to execute specialized analysis:

1. **`analyze_portfolio_diversification`**
   - Types: sector, concentration, overall
   - Provides detailed diversification metrics

2. **`identify_tax_opportunities`**
   - Finds tax loss harvesting candidates
   - Calculates potential tax savings

3. **`suggest_rebalancing`**
   - Profiles: conservative, moderate, aggressive
   - Generates specific buy/sell recommendations

4. **`compare_vs_benchmark`**
   - Benchmarks: SPY, QQQ, DIA, IWM
   - Performance comparison analysis

5. **`analyze_stock_fundamentals`**
   - Deep dive into individual stocks
   - Position-specific recommendations

### Context Awareness
The AI receives full portfolio context:
- All holdings with symbols, names, quantities
- Current values and cost basis
- Gain/Loss for each position
- Portfolio weights and allocation
- Total portfolio metrics

---

## 🔒 Privacy & Security

- **No Data Storage**: Portfolio data is sent to OpenAI only during active chat sessions
- **Encrypted Tokens**: Plaid access tokens are encrypted with AES-256-GCM
- **User Isolation**: Each user can only access their own portfolios (RLS policies)
- **Secure API**: All API calls require authentication
- **HTTPS Only**: All communication is encrypted in transit

---

## 💡 Pro Tips

### 1. **Be Specific**
Instead of: "What should I do?"
Try: "Should I rebalance my portfolio to reduce concentration risk?"

### 2. **Ask Follow-ups**
The AI remembers context within a conversation:
```
You: "Analyze my portfolio"
AI: [provides analysis]
You: "Now suggest rebalancing"
AI: [uses previous analysis for recommendations]
```

### 3. **Request Detailed Analysis**
```
"Give me a detailed analysis of my AAPL position including:
- Current performance
- Recommended action
- Price targets"
```

### 4. **Combine Requests**
```
"Analyze my portfolio, find tax opportunities, and suggest rebalancing"
```

### 5. **Regular Check-ins**
Use the AI for:
- Weekly portfolio reviews
- Monthly rebalancing checks
- Quarterly tax planning
- Annual performance analysis

---

## 🎓 Best Practices

### Portfolio Management
1. **Diversify**: Aim for 10-20 holdings across sectors
2. **Rebalance**: Review quarterly or when drift >5%
3. **Tax Optimize**: Harvest losses before year-end
4. **Monitor**: Check performance vs benchmarks monthly
5. **Stay Informed**: Use AI for ongoing education

### Using the AI
1. **Start Broad**: Begin with general analysis
2. **Drill Down**: Ask specific follow-up questions
3. **Take Notes**: Save important recommendations
4. **Verify**: Always verify AI suggestions with research
5. **Consult Professionals**: For tax/legal matters, consult experts

---

## 🚧 Limitations

### Current Limitations
- **No Real-Time Execution**: AI provides recommendations but doesn't execute trades
- **Limited Historical Data**: Analysis based on current holdings only
- **No Sector Classification**: Sector analysis is manual/estimated
- **Benchmark Data**: Requires manual comparison for now

### Coming Soon
- [ ] Automated trade execution
- [ ] Historical performance tracking
- [ ] Sector classification API integration
- [ ] Real-time benchmark comparisons
- [ ] Portfolio alerts and notifications
- [ ] PDF report generation

---

## 📊 Sample Use Cases

### Use Case 1: New Investor
**Goal**: Understand portfolio health
**Questions**:
1. "Analyze my portfolio"
2. "Am I diversified enough?"
3. "What should I do next?"

### Use Case 2: Tax Season
**Goal**: Minimize tax liability
**Questions**:
1. "Find tax loss harvesting opportunities"
2. "Which losses should I harvest first?"
3. "How much can I save on taxes?"

### Use Case 3: Market Volatility
**Goal**: Manage risk during downturn
**Questions**:
1. "Check my concentration risk"
2. "Should I rebalance to conservative?"
3. "Which positions should I reduce?"

### Use Case 4: Performance Review
**Goal**: Evaluate investment strategy
**Questions**:
1. "How am I performing vs S&P 500?"
2. "What are my best and worst performers?"
3. "Should I adjust my strategy?"

---

## 🆘 Troubleshooting

### AI Not Responding
- Check internet connection
- Verify OpenAI API key is configured
- Refresh the page and try again

### Incorrect Analysis
- Ensure holdings are synced (click "Sync Now")
- Verify portfolio data is up to date
- Try rephrasing your question

### Missing Holdings
- Click "Sync Now" in Real Portfolio tab
- Check Plaid connection status
- Reconnect brokerage account if needed

---

## 📚 Additional Resources

- [Plaid Setup Guide](./PLAID_SETUP_GUIDE.md)
- [Plaid Testing Guide](./PLAID_TESTING_GUIDE.md)
- [AI Integration Overview](./AI_INTEGRATION.md)
- [General Setup Guide](./SETUP.md)

---

## 🎉 Getting Started

Ready to try it? Here's your first conversation:

1. **Connect** your brokerage account
2. **Sync** your holdings
3. **Click** "AI Assistant"
4. **Type**: "Analyze my portfolio and give me your top 3 recommendations"

**Welcome to the future of AI-powered investing! 🚀**

