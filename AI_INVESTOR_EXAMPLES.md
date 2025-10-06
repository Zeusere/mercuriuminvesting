# AI Investor - Usage Examples

## 📝 Create Portfolio Mode

### Example Prompts

#### 1. **Growth-Focused Tech Portfolio**
```
I want to invest in AI companies with the highest revenue growth in the last year
```
**What the AI does:**
- Extracts: sectors=[Technology, AI], metric=revenue_growth, timeframe=1Y
- Searches Alpaca for tech stocks
- Calculates 1-year performance
- Selects top 8-10 high-growth companies
- Assigns weights based on performance and risk

**Expected Result:**
- Portfolio of 8-10 tech/AI stocks
- Higher weights to top performers
- Risk assessment: Moderate to High

---

#### 2. **Diversified Large-Cap Portfolio**
```
Create a balanced portfolio with large-cap stocks across different sectors
```
**What the AI does:**
- Extracts: focus=diversified, risk_level=moderate
- Searches for established companies
- Selects stocks from various sectors
- Balances weights evenly

**Expected Result:**
- Portfolio of 10-12 stocks
- Multiple sectors (Tech, Healthcare, Finance, Consumer, etc.)
- Even weight distribution
- Risk assessment: Moderate

---

#### 3. **High-Performance Tech**
```
Top 5 technology stocks with best 6-month performance
```
**What the AI does:**
- Extracts: sectors=[Technology], metric=performance, timeframe=6M, max_stocks=5
- Searches tech stocks
- Calculates 6-month returns
- Selects top 5 performers

**Expected Result:**
- Exactly 5 tech stocks
- Weighted by recent performance
- Risk assessment: Moderate to High

---

#### 4. **Conservative Mix**
```
I want a low-risk portfolio with stable companies, maximum 8 stocks
```
**What the AI does:**
- Extracts: risk_level=low, max_stocks=8
- Searches for established, stable companies
- Prioritizes lower volatility
- Balances across sectors

**Expected Result:**
- 8 stable stocks
- Lower volatility companies
- More even distribution
- Risk assessment: Low to Moderate

---

#### 5. **Sector-Specific**
```
Give me the best healthcare stocks with strong growth
```
**What the AI does:**
- Extracts: sectors=[Healthcare], focus=growth, metric=performance
- Searches healthcare sector
- Selects growth-oriented companies

**Expected Result:**
- 8-10 healthcare stocks
- Growth-focused selection
- Risk assessment: Moderate

---

## 💡 Tips for Better Results

### Be Specific
✅ **Good:** "I want tech stocks with high growth in AI sector"
❌ **Bad:** "Give me some stocks"

### Mention Criteria
Include any of these in your prompt:
- **Sectors**: Technology, Healthcare, Finance, Energy, Consumer, etc.
- **Focus**: Growth, value, dividend, stability, innovation
- **Timeframe**: Last month, 6 months, 1 year, 3 years
- **Risk**: Low risk, moderate, aggressive, high growth
- **Number**: "Top 5", "around 10", "maximum 12"

### Examples of Criteria Combinations
```
"10 technology stocks with highest 1-year growth and moderate risk"

"Conservative portfolio with dividend-paying stocks from different sectors"

"Aggressive growth portfolio focused on AI and cloud computing companies"

"5 best-performing healthcare stocks in the last 3 months"

"Balanced portfolio with 50% tech, 30% healthcare, 20% finance"
```

---

## ⚙️ How It Works

### Step 1: AI Extracts Criteria
The AI analyzes your prompt and extracts structured criteria:
```json
{
  "sectors": ["Technology", "Artificial Intelligence"],
  "focus": "high growth",
  "metric": "performance",
  "risk_level": "moderate",
  "timeframe": "1Y",
  "max_stocks": 10
}
```

### Step 2: Search Stocks
- Queries Alpaca API for active US stocks
- Filters by criteria (sector, price, etc.)
- Retrieves up to 50-100 candidates

### Step 3: Calculate Metrics
For each candidate, calculates:
- **Current Price**: Latest trade price
- **Performance**: % change over specified timeframe
- **Volatility**: Price movement volatility
- **Volume**: Trading volume
- **Market Cap**: Company size (when available)

### Step 4: AI Selection
The AI analyzes all candidates and:
- Selects the best matches (typically 8-10 stocks)
- Assigns optimal weights (totaling 100%)
- Provides reasoning for each selection
- Assesses overall portfolio risk

### Step 5: Results
You receive:
- **Stocks List**: Symbol, name, weight, metrics
- **Reasoning**: Why each stock was selected
- **Summary**: Overall portfolio strategy
- **Risk Assessment**: Risk level description

---

## ✏️ Editing Results

After receiving AI recommendations:

1. **Adjust Weights**
   - Click the edit icon next to any weight
   - Enter new percentage (0-100)
   - Ensure total equals 100%

2. **Remove Stocks**
   - Click the × button to remove
   - Weights will need rebalancing

3. **Save Portfolio**
   - Enter a portfolio name
   - Click "Save Portfolio"
   - Redirects to your portfolios page

4. **Ask for Adjustments**
   - Click "Ask AI to Adjust"
   - Describe desired changes in chat
   - AI will generate new suggestions

---

## 🎯 Best Practices

### Start Broad, Then Refine
1. First request: "I want tech growth stocks"
2. Review results
3. Second request: "Focus more on AI companies and increase weights for top performers"

### Combine Multiple Criteria
```
"I want a portfolio of 10 stocks:
- 60% technology (high growth)
- 30% healthcare (stable)
- 10% finance (dividend-paying)
Focus on companies with strong 1-year performance"
```

### Ask Follow-Up Questions
After getting results:
- "Why did you choose NVDA over AMD?"
- "Is this portfolio too risky?"
- "Add more diversification"
- "Replace low performers with stable stocks"

---

## 🚫 Current Limitations

### Data Constraints
- **Fundamentals**: Limited access to P/E ratios, revenue, earnings (Alpaca free tier)
- **Workaround**: Uses historical performance as proxy for growth
- **News**: Used for context but not for selection

### Performance Metrics
- **Historical Only**: Based on past price movements
- **Simplified**: Basic calculations (actual returns, volatility estimates)
- **Timeframe**: Limited to available historical data

### Stock Universe
- **US Markets**: Currently only US equities
- **Active Only**: Only actively traded stocks
- **Simple Tickers**: Avoids complex/leveraged instruments

---

## 🔄 Iterating on Results

### Example Conversation

**User:** "I want AI stocks with high growth"

**AI:** *Suggests portfolio with 10 tech/AI stocks*

**User:** "This looks too risky, add more stable companies"

**AI:** *New suggestion with mix of growth + established companies*

**User:** "Perfect! But increase MSFT to 15% and reduce NVDA to 10%"

**AI:** *(User adjusts manually)* → Saves portfolio

---

## 📊 Understanding AI Reasoning

The AI explains each selection. Example reasons:

- **"Leader in GPU technology for AI workloads with 265% YoY growth"**
  → Strong performance + sector relevance

- **"Established cloud provider with diversified AI services"**
  → Stability + sector exposure

- **"Emerging player in AI software with high growth potential"**
  → Growth opportunity + risk

- **"Provides balance and reduces portfolio volatility"**
  → Risk management

---

## 🎓 Learning from Results

### Analyzing Your Portfolio
After creation, use **Analyze Mode** to:
- Understand diversification
- Identify concentration risks
- Get rebalancing recommendations
- Learn about correlations

### Example Analysis Flow
1. Create Portfolio: "Top 10 tech growth stocks"
2. Save it
3. Switch to Analyze Mode
4. Ask: "Is my Tech Growth Portfolio properly balanced?"
5. Review strengths, weaknesses, recommendations

---

## 🚀 Advanced Usage

### Combining with Manual Adjustments
1. Get AI suggestions
2. Manually adjust weights
3. Ask AI: "Review my adjusted weights"
4. AI provides feedback on your changes

### Building Multiple Strategies
- **Growth Portfolio**: Aggressive, tech-focused
- **Income Portfolio**: Dividend-paying, stable
- **Balanced Portfolio**: Mix of both
- Compare performance over time

### Using Context
The AI remembers your conversation:
```
User: "Create a tech portfolio"
AI: *Suggests 10 tech stocks*
User: "Now do the same but for healthcare"
AI: *Understands you want similar strategy but different sector*
```

---

## 📈 Success Metrics

### Good Portfolio Indicators
✅ Total weights = 100%
✅ Diversification across 8-12 stocks
✅ Clear strategy (growth/value/balanced)
✅ Risk level matches your goals
✅ Each stock has clear reasoning

### Red Flags
❌ Too concentrated (1-2 stocks > 30%)
❌ All stocks from same subsector
❌ Unclear reasoning
❌ Weights don't sum to 100%
❌ Too many low-volume stocks

---

## 🎉 Next Steps

After mastering Create Portfolio:
1. **Analyze Mode**: Deep dive into your portfolios
2. **Backtesting**: See historical performance
3. **Rebalancing**: Get optimization suggestions
4. **Execution**: (Future) Execute via broker integration
