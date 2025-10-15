# Changelog

All notable changes to Mercurium will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-10-14

### 🔧 Critical Bug Fix: Split Adjustment

#### Fixed

##### Portfolio Creation Accuracy 🎯
- 🐛 **CRITICAL FIX**: Stock splits/reverse splits no longer distort performance calculations
- 🐛 **Split Adjustment**: Now using `adjustment=split` parameter in ALL Alpaca API calls with IEX feed
- 🐛 **Files Updated**: 
  - `app/api/ai/create-portfolio/route.ts` - Portfolio creation
  - `app/api/ai/analyze-portfolio/route.ts` - Portfolio analysis
  - `app/api/stocks/info/route.ts` - Stock information
- 🐛 **Example Impact**: NVDA (10:1 split June 2024) now shows correct +180% YTD instead of -90%
- 🐛 **Reverse Splits**: No longer show fake +900% gains
- 🐛 **Forward Splits**: No longer show fake -90% losses
- 🐛 **Feed Note**: Using IEX feed (free) with adjustment - SIP feed requires paid subscription

**Impact**: This fix ensures AI portfolio recommendations are based on **real performance**, not distorted by corporate actions. Critical for accuracy and user trust.

**Technical Details**: See [SPLIT_ADJUSTMENT_FIX.md](./SPLIT_ADJUSTMENT_FIX.md) for complete documentation.

---

## [2.0.0] - 2025-10-14

### 🚀 Major Release: AI Portfolio Advisor for Real Brokerage Accounts

#### Added

##### AI Investment Advisor 🤖
- ✨ **AI Portfolio Advisor**: Professional-grade AI analysis for real brokerage portfolios
- ✨ **Natural Language Chat**: Ask questions about your portfolio in plain English
- ✨ **Advanced Function Calling**: 5 specialized AI functions for deep analysis
  - Portfolio diversification analysis (concentration, sector, overall)
  - Tax loss harvesting opportunity identification
  - Rebalancing suggestions (conservative/moderate/aggressive)
  - Benchmark comparison (SPY, QQQ, DIA, IWM)
  - Individual stock fundamental analysis
- ✨ **Tax Optimization**: Identify tax loss harvesting opportunities with estimated savings
- ✨ **Rebalancing Recommendations**: Specific buy/sell amounts and share quantities
- ✨ **Concentration Risk Analysis**: Top holdings analysis with risk assessment
- ✨ **Actionable Insights**: Professional recommendations with dollar amounts

##### Real Portfolio Integration 🔗
- ✨ **Plaid Integration**: Connect real brokerage accounts (Robinhood, Fidelity, etc.)
- ✨ **Holdings Sync**: Real-time portfolio data synchronization
- ✨ **Multi-Account Support**: Connect multiple brokerage accounts
- ✨ **Secure Storage**: AES-256-GCM encryption for access tokens
- ✨ **Connection Management**: Easy connect/disconnect/sync interface
- ✨ **Portfolio Viewer**: Beautiful UI for viewing real holdings
- ✨ **Performance Metrics**: Gain/loss tracking, portfolio weights, cost basis

##### Branding & Design 🎨
- ✨ **Mercurium Branding**: Complete rebrand from WhiteApp to Mercurium
- ✨ **New Landing Page**: AI-focused hero section with social trading emphasis
- ✨ **Updated Features Section**: Two-column layout highlighting AI Assistant, Strategies, and Social
- ✨ **Testimonials Section**: User success stories and social proof
- ✨ **Professional Dark Theme**: Forced dark mode for landing page
- ✨ **Updated Logo**: Mercurium logo with gradient styling
- ✨ **SEO Optimization**: Updated metadata for AI investment platform

##### User Experience 👤
- ✨ **Avatar System**: User profile images with upload functionality
- ✨ **Default Avatars**: Initials-based fallback avatars
- ✨ **Supabase Storage**: Secure avatar storage with RLS policies
- ✨ **Profile Integration**: Avatars across profiles, social feed, and navigation
- ✨ **Improved Navigation**: Better spacing and centered navigation items

##### API & Backend 🔧
- ✨ **`/api/ai/analyze-real-portfolio`**: New endpoint for AI portfolio analysis
- ✨ **`/api/plaid/*`**: Complete Plaid API integration (7 endpoints)
  - create-link-token, exchange-token, sync-holdings, get-holdings
  - connections, disconnect
- ✨ **`/api/users/avatar`**: Avatar upload and deletion endpoints
- ✨ **Enhanced Security**: All endpoints use `getUser()` instead of `getSession()`

##### Documentation 📚
- 📖 **AI_REAL_PORTFOLIO_GUIDE.md**: Comprehensive user guide for AI advisor
- 📖 **AI_PORTFOLIO_ADVISOR_SUMMARY.md**: Technical implementation details
- 📖 **PLAID_SETUP_GUIDE.md**: Complete Plaid integration guide
- 📖 **PLAID_TESTING_GUIDE.md**: Testing instructions for Plaid
- 📖 **PLAID_ENV_EUROPE.md**: European configuration guide
- 📖 **Updated README.md**: Mercurium-focused documentation

#### Changed

##### Security Improvements 🔒
- 🔐 **Authentication**: Migrated from `getSession()` to `getUser()` across all API routes
- 🔐 **Token Encryption**: Plaid access tokens encrypted at rest
- 🔐 **RLS Policies**: Enhanced Row Level Security for all tables
- 🔐 **Secure Storage**: Avatar storage with proper RLS policies

##### UI/UX Improvements 🎨
- 💅 **Navigation Spacing**: Increased gap between navigation items (gap-12)
- 💅 **Larger Font**: Increased navigation font size (text-base)
- 💅 **Centered Navigation**: Navigation items centered in header
- 💅 **Consistent AI Button**: Same AI Assistant button design across all pages
- 💅 **Collapsible Chat**: AI chat opens/closes smoothly
- 💅 **Loading States**: Better loading indicators for AI and sync operations

##### Performance Optimizations ⚡
- ⚡ **Plaid Link**: Optimized initialization to prevent multiple script loads
- ⚡ **Avatar Loading**: Efficient avatar caching and loading
- ⚡ **API Response**: Streamlined AI response handling

#### Fixed

##### Bug Fixes 🐛
- 🐛 **Plaid Link Warning**: Fixed "script embedded more than once" warning
- 🐛 **MetaMask Detection**: Added workarounds for MetaMask interference
- 🐛 **Sandbox Configuration**: Forced sandbox mode for testing
- 🐛 **Country Codes**: Fixed US vs EU country code configuration
- 🐛 **Holdings Sync**: Added manual sync button for immediate updates
- 🐛 **TypeScript Errors**: Fixed FormData type errors in avatar upload
- 🐛 **Theme Toggle**: Removed from landing page to force dark theme

##### Security Fixes 🔒
- 🔒 **Session Warnings**: Eliminated all `getSession()` security warnings
- 🔒 **Avatar Upload**: Fixed RLS policy violations in storage
- 🔒 **Token Storage**: Proper encryption for sensitive data

#### Technical Details

##### Architecture
- **AI Model**: OpenAI GPT-4 Turbo with function calling
- **Database**: Supabase PostgreSQL with RLS
- **Storage**: Supabase Storage for avatars
- **Encryption**: AES-256-GCM for tokens
- **API**: RESTful Next.js API routes
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS

##### New Database Tables
- `plaid_connections`: Store Plaid connection metadata
- `plaid_accounts`: Store account information
- `plaid_holdings`: Store portfolio holdings
- `user_profiles`: Enhanced with avatar_url

##### Environment Variables
- `PLAID_CLIENT_ID`: Plaid API client ID
- `PLAID_SECRET`: Plaid API secret key
- `PLAID_ENV`: Environment (sandbox/development/production)
- `PLAID_COUNTRY_CODES`: Supported country codes
- `ENCRYPTION_KEY`: 32-byte key for token encryption

---

## [1.0.0] - 2025-10-02

### Added

#### Core Features
- ✨ Complete authentication system with Supabase
- ✨ Email/password authentication
- ✨ Google OAuth integration
- ✨ Protected routes with middleware
- ✨ Session management

#### UI/UX
- 🎨 Modern, minimalist landing page
- 🎨 Hero section with CTA
- 🎨 Features showcase
- 🎨 Pricing section with 3 tiers
- 🎨 Testimonials section
- 🎨 Responsive header with mobile menu
- 🎨 Professional footer
- 🌓 Light and dark mode support
- 📱 Fully responsive design

#### Dashboard
- 📊 User dashboard with welcome section
- 📊 Statistics cards
- 📊 AI tools showcase
- 📊 Quick actions menu
- 📊 User profile display
- 🔒 Protected area for authenticated users

#### Developer Experience
- ⚡ Next.js 14 with App Router
- ⚡ TypeScript for type safety
- ⚡ Tailwind CSS for styling
- ⚡ ESLint configuration
- ⚡ Environment variables setup
- 📦 Clean project structure

#### Documentation
- 📚 Comprehensive README.md
- 📚 Detailed SETUP.md with step-by-step instructions
- 📚 Contributing guidelines
- 📚 MIT License

#### AI Integration Ready
- 🤖 Environment variables for OpenAI
- 🤖 Environment variables for Google AI (Gemini)
- 🤖 Environment variables for Anthropic (Claude)
- 🤖 Dashboard section for AI features

### Technical Details

#### Dependencies
- next: ^14.2.0
- react: ^18.3.0
- @supabase/supabase-js: ^2.45.0
- @supabase/auth-helpers-nextjs: ^0.10.0
- tailwindcss: ^3.4.0
- typescript: ^5.4.0
- lucide-react: ^0.344.0

#### File Structure
- `/app` - Next.js app directory with routes
- `/components` - Reusable React components
- `/lib` - Utilities and Supabase configuration
- Configuration files for Next.js, TypeScript, Tailwind

### Security
- 🔒 Environment variables for sensitive data
- 🔒 Row Level Security ready
- 🔒 Secure authentication flow
- 🔒 Protected API routes

---

## Future Releases

### [1.1.0] - Planned
- User profile editing
- Password reset flow
- Email verification improvements
- Admin panel basics

### [1.2.0] - Planned
- Payment integration (Stripe)
- Subscription management
- Usage analytics
- Advanced dashboard

### [2.0.0] - Planned
- Multi-tenancy support
- Team collaboration features
- Advanced AI integrations
- Mobile app

---

[1.0.0]: https://github.com/yourproject/whiteapp/releases/tag/v1.0.0

