# 🚀 MERCURIUM - AI-Powered Investment Platform

**Build Winning Investment Strategies with AI & Community**

Mercurium is a next-generation investment platform that combines artificial intelligence with social trading. Create, analyze, and optimize investment portfolios using natural language, connect your real brokerage accounts, and learn from a community of investors.

## ✨ Core Features

### 🤖 AI Investment Assistant
- **Natural Language Interface**: Create and analyze portfolios using conversational AI
- **Portfolio Analysis**: Get AI-powered insights on your investment strategies
- **Stock Research**: Deep analysis of companies, sectors, and market trends
- **Rebalancing Suggestions**: Optimize your portfolio allocation with AI recommendations
- **Real Portfolio Integration**: 🆕 Connect real brokerage accounts via Plaid and get professional AI analysis
- **Tax Optimization**: 🆕 Identify tax loss harvesting opportunities and save on taxes
- **Diversification Analysis**: 🆕 Assess concentration risk and sector allocation
- **Benchmark Comparison**: 🆕 Compare your portfolio vs S&P 500, NASDAQ, and more

### 📊 Portfolio Management
- **Strategy Builder**: Create and simulate investment strategies
- **Performance Tracking**: Monitor returns, risk metrics, and historical performance
- **Backtesting**: Test strategies against historical data
- **Real-Time Data**: Live stock prices and market information
- **Multiple Portfolios**: Manage unlimited investment strategies

### 🔗 Real Brokerage Integration (Plaid)
- **Connect Real Accounts**: Link your brokerage accounts securely via Plaid
- **View Holdings**: See your real portfolio positions in real-time
- **AI Analysis**: Get AI-powered insights on your actual investments
- **Multi-Account Support**: Connect multiple brokerage accounts
- **Secure & Encrypted**: Bank-level security for your financial data

### 👥 Social Trading Network
- **Community Portfolios**: Discover and copy successful strategies
- **User Profiles**: Follow top investors and track their performance
- **Social Feed**: Share insights, strategies, and market commentary
- **Ticker Rooms**: Join live discussions about specific stocks
- **Leaderboards**: See top-performing strategies and investors

### 🎯 Advanced Features
- **Favorites System**: Save and track your favorite stocks
- **News Integration**: Real-time market news and analysis
- **Dark/Light Mode**: Beautiful UI with theme support
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Export & Share**: Share your strategies with the community

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router and Server Components
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Modern, utility-first styling
- **Lucide Icons**: Beautiful, consistent iconography
- **Recharts**: Interactive charts and visualizations

### Backend & Infrastructure
- **Supabase**: PostgreSQL database, authentication, and storage
- **OpenAI GPT-4**: AI-powered investment assistant
- **Plaid API**: Real brokerage account integration
- **Financial Modeling Prep API**: Real-time stock data and news
- **Row Level Security**: Secure data isolation per user

### Security
- **AES-256-GCM Encryption**: Secure storage of sensitive tokens
- **Supabase Auth**: Industry-standard authentication
- **RLS Policies**: Database-level security
- **HTTPS Only**: Secure communication

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Plaid Integration](#-plaid-integration)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [License](#-license)

## ⚡ Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
# Copy .env.example to .env.local and fill in your credentials

# 3. Set up Supabase database
# Run the SQL scripts in the Supabase SQL Editor:
# - Database schema for portfolios, strategies, social features
# - RLS policies for security
# - Storage buckets for avatars

# 4. Configure Plaid (for real portfolio integration)
# See PLAID_SETUP_GUIDE.md for detailed instructions

# 5. Run development server
pnpm dev

# 6. Open http://localhost:3000
```

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 📥 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm/yarn
- **Supabase Account** (free tier available)
- **OpenAI API Key** (for AI features)
- **Financial Modeling Prep API Key** (for stock data)
- **Plaid Account** (for real brokerage integration)

### Step-by-Step Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd mercurium
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI Provider
OPENAI_API_KEY=your_openai_api_key

# Financial Data
FMP_API_KEY=your_fmp_api_key

# Plaid (Real Brokerage Integration)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or development/production
PLAID_COUNTRY_CODES=US  # or ES,GB,FR,DE for Europe

# Encryption (generate a secure 32-byte key)
ENCRYPTION_KEY=your_32_byte_encryption_key
```

4. **Set up Supabase database**

Run the SQL scripts in your Supabase project:
- Create tables for portfolios, strategies, holdings, social features
- Set up RLS policies
- Create storage buckets for user avatars

5. **Set up Plaid (Optional)**

Follow the [PLAID_SETUP_GUIDE.md](./PLAID_SETUP_GUIDE.md) for detailed instructions on:
- Creating a Plaid account
- Configuring webhooks
- Setting up test credentials
- Connecting sandbox accounts

6. **Run the development server**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## ⚙️ Configuration

### Required Environment Variables

#### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### OpenAI (Required for AI features)
```env
OPENAI_API_KEY=sk-...
```

#### Financial Data (Required)
```env
FMP_API_KEY=your_fmp_api_key
```

#### Plaid (Optional - for real portfolio integration)
```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox
PLAID_COUNTRY_CODES=US
ENCRYPTION_KEY=your_32_byte_key
```

See [SETUP.md](./SETUP.md) for detailed configuration instructions.

## 🔗 Plaid Integration

Mercurium supports connecting real brokerage accounts via Plaid. This allows users to:

- **Connect Real Accounts**: Securely link brokerage accounts (Robinhood, Fidelity, Charles Schwab, etc.)
- **View Real Holdings**: See actual portfolio positions and values
- **AI Analysis**: Get AI-powered insights on real investments
- **Compare Strategies**: Compare real portfolio vs simulated strategies

### Plaid Setup

1. **Create Plaid Account**: Sign up at [plaid.com](https://plaid.com)
2. **Get API Keys**: Obtain Client ID and Secret from dashboard
3. **Configure Environment**: Set up environment variables
4. **Test in Sandbox**: Use sandbox credentials to test
5. **Go Production**: Apply for production access when ready

For detailed instructions, see:
- [PLAID_SETUP_GUIDE.md](./PLAID_SETUP_GUIDE.md) - Complete setup guide
- [PLAID_TESTING_GUIDE.md](./PLAID_TESTING_GUIDE.md) - Testing instructions
- [PLAID_ENV_EUROPE.md](./PLAID_ENV_EUROPE.md) - European configuration

### Supported Brokers (Sandbox)

- Robinhood
- Fidelity Investments
- Charles Schwab
- TD Ameritrade
- E*TRADE
- Interactive Brokers
- And many more...

## 📁 Project Structure

```
mercurium/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI endpoints (chat, analysis, portfolio creation)
│   │   ├── plaid/                # Plaid integration endpoints
│   │   ├── portfolios/           # Portfolio management
│   │   ├── orders/               # Order execution
│   │   ├── favorites/            # Favorites system
│   │   └── news/                 # News integration
│   ├── auth/                     # Authentication callbacks
│   ├── dashboard/                # Main dashboard
│   ├── portfolios/               # Portfolio pages (list, create, edit)
│   ├── stocks/                   # Stock search and details
│   ├── social/                   # Social feed
│   ├── community-portfolios/     # Community strategies
│   ├── profile/                  # User profiles
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── social/                   # Social features (feed, posts, profiles)
│   ├── ui/                       # Reusable UI components
│   ├── Avatar.tsx                # User avatar with upload
│   ├── ChatInterface.tsx         # AI chat interface
│   ├── ConnectionsManager.tsx   # Plaid connections management
│   ├── DashboardContent.tsx      # Dashboard layout
│   ├── EditPortfolioContent.tsx  # Portfolio editor
│   ├── Features.tsx              # Landing page features
│   ├── Hero.tsx                  # Landing page hero
│   ├── Navigation.tsx            # Main navigation
│   ├── PlaidLinkButton.tsx       # Plaid Link integration
│   ├── PortfolioBuilder.tsx      # Portfolio builder UI
│   ├── PortfolioForm.tsx         # Portfolio form
│   ├── RealPortfolioViewer.tsx   # Real portfolio display
│   └── ...                       # More components
├── lib/                          # Utilities and configurations
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Client-side
│   │   ├── server.ts             # Server-side
│   │   └── middleware.ts         # Auth middleware
│   └── plaid/                    # Plaid utilities
│       ├── client.ts             # Plaid client
│       └── encryption.ts         # Token encryption
├── public/                       # Static assets
│   ├── logo.png                  # Light theme logo
│   ├── logo-dark.png             # Dark theme logo
│   └── default-avatar.svg        # Default user avatar
├── .env.local                    # Environment variables (not in git)
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
├── README.md                     # This file
├── SETUP.md                      # Setup instructions
├── PLAID_SETUP_GUIDE.md          # Plaid setup guide
├── PLAID_TESTING_GUIDE.md        # Plaid testing guide
└── PLAID_ENV_EUROPE.md           # European Plaid config
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

### Development Workflow

1. **Start dev server**: `pnpm dev`
2. **Make changes**: Edit files in `app/` and `components/`
3. **Auto-reload**: Changes reflect immediately
4. **Test features**: Create portfolios, use AI, connect Plaid
5. **Check console**: Monitor for errors and warnings

### Key Development Areas

#### Adding New AI Features
Edit `app/api/ai/` routes to add new AI capabilities:
- Portfolio analysis
- Stock recommendations
- Market insights
- Risk assessment

#### Extending Social Features
Add new social components in `components/social/`:
- Comments system
- Likes/reactions
- Direct messaging
- Notifications

#### Adding New Stock Data
Integrate additional data sources in `app/api/`:
- Options data
- Crypto prices
- Forex rates
- Commodities

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
2. **Import in Vercel**: [vercel.com/new](https://vercel.com/new)
3. **Add Environment Variables**: Copy all from `.env.local`
4. **Deploy**: Vercel handles the rest

```bash
# Or use Vercel CLI
pnpm i -g vercel
vercel
```

### Important Production Settings

1. **Update Site URL**:
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

2. **Plaid Production**:
   ```env
   PLAID_ENV=production
   PLAID_SECRET=your_production_secret
   ```
   Note: Requires Plaid production approval

3. **Supabase Production**:
   - Enable RLS on all tables
   - Set up proper indexes
   - Configure backups

4. **Security**:
   - Use strong encryption keys
   - Enable HTTPS only
   - Set up CORS properly
   - Configure CSP headers

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup instructions
- **[PLAID_SETUP_GUIDE.md](./PLAID_SETUP_GUIDE.md)** - Plaid integration guide
- **[PLAID_TESTING_GUIDE.md](./PLAID_TESTING_GUIDE.md)** - Testing Plaid features
- **[PLAID_ENV_EUROPE.md](./PLAID_ENV_EUROPE.md)** - European configuration
- **[AI_INTEGRATION.md](./AI_INTEGRATION.md)** - AI features documentation
- **[AI_REAL_PORTFOLIO_GUIDE.md](./AI_REAL_PORTFOLIO_GUIDE.md)** - 🆕 AI Portfolio Advisor guide
- **[AI_PORTFOLIO_ADVISOR_SUMMARY.md](./AI_PORTFOLIO_ADVISOR_SUMMARY.md)** - 🆕 Technical implementation summary
- **[SPLIT_ADJUSTMENT_FIX.md](./SPLIT_ADJUSTMENT_FIX.md)** - 🔧 Critical fix for stock splits
- **[COMMERCIALIZATION.md](./COMMERCIALIZATION.md)** - Business model
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 🎯 Roadmap

### Current Features ✅
- ✅ AI Investment Assistant
- ✅ Portfolio Builder & Simulator
- ✅ Real Brokerage Integration (Plaid)
- ✅ Social Trading Network
- ✅ User Profiles & Avatars
- ✅ Community Portfolios
- ✅ Real-time Stock Data
- ✅ News Integration
- ✅ Favorites System

### Coming Soon 🚧
- [ ] AI Portfolio Rebalancing
- [ ] Tax Loss Harvesting
- [ ] Performance Analytics Dashboard
- [ ] Portfolio Comparison Tools
- [ ] Alerts & Notifications
- [ ] Mobile App (React Native)
- [ ] Options Trading Support
- [ ] Crypto Integration
- [ ] Advanced Charting
- [ ] PDF Export Reports

### Future Vision 🔮
- [ ] Robo-Advisor Features
- [ ] Automated Trading Strategies
- [ ] Social Trading Copy Feature
- [ ] Investment Challenges
- [ ] Educational Content
- [ ] API for Third-Party Integration
- [ ] White-Label Solution
- [ ] Institutional Features

## 🔒 Security & Privacy

- **Bank-Level Security**: Plaid provides bank-level encryption
- **No Password Storage**: Never store brokerage credentials
- **Token Encryption**: AES-256-GCM encryption for access tokens
- **Row Level Security**: Database-level data isolation
- **HTTPS Only**: All communication encrypted
- **Regular Audits**: Security reviews and updates
- **Privacy First**: User data never shared or sold

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 💬 Support

- 📧 **Email**: support@mercurium.com
- 📚 **Documentation**: See docs folder
- 🐛 **Issues**: Open an issue on GitHub
- 💬 **Discussions**: Join our community

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [OpenAI](https://openai.com/) - AI capabilities
- [Plaid](https://plaid.com/) - Financial data
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Icons
- [Recharts](https://recharts.org/) - Charts

## 🌟 Why Mercurium?

**Mercurium** combines the power of artificial intelligence with the wisdom of crowds. Whether you're a beginner learning to invest or an experienced trader looking for an edge, Mercurium provides the tools, insights, and community to help you succeed.

### Key Differentiators:
- 🤖 **AI-First**: Natural language interface for investment decisions
- 🔗 **Real Integration**: Connect actual brokerage accounts
- 👥 **Social Learning**: Learn from successful investors
- 📊 **Data-Driven**: Real-time market data and analysis
- 🔒 **Secure**: Bank-level security and encryption
- 🎯 **User-Friendly**: Beautiful, intuitive interface

---

**Ready to build winning strategies? Start now! 🚀**

```bash
pnpm install && pnpm dev
```

**Visit [http://localhost:3000](http://localhost:3000) and create your first AI-powered portfolio!**
