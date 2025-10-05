# 📈 Trading AI Dashboard

Dashboard de trading con inteligencia artificial que permite crear órdenes de compra/venta mediante texto o voz. El sistema utiliza OpenAI para interpretar instrucciones en lenguaje natural y convertirlas en órdenes estructuradas.

## ✨ Características Principales

### 🤖 Inteligencia Artificial
- **Entrada por Texto o Voz**: Crea órdenes usando lenguaje natural
- **OpenAI GPT-4**: Interpreta tus instrucciones de trading
- **Parser Inteligente**: Convierte texto a órdenes estructuradas
- **Alta Precisión**: Sistema de confianza para validar interpretaciones

### 📊 Trading Completo
- **Órdenes de Mercado**: Ejecución inmediata al precio actual
- **Órdenes Límite**: Especifica el precio de compra/venta
- **Stop Loss**: Protección automática contra pérdidas
- **Take Profit**: Cierre automático al alcanzar beneficio objetivo
- **Historial Completo**: Visualiza todas tus órdenes

### 🔐 Autenticación Segura
- **Email/Password**: Autenticación tradicional
- **Google OAuth**: Login con una sola clic
- **Supabase Auth**: Backend seguro y escalable
- **Row Level Security**: Cada usuario ve solo sus órdenes

### 📦 Modern Stack
- **Next.js 14**: Latest App Router with Server Components
- **TypeScript**: Full type safety
- **Supabase**: Backend as a Service (BaaS)
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Beautiful, consistent icons

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Customization](#-customization)
- [License](#-license)

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Crea un archivo .env.local con tus credenciales:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY

# 3. Configure Supabase database
# Ejecuta el script SQL en supabase/migrations/001_trading_orders.sql
# en tu proyecto de Supabase

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

**📖 Para instrucciones detalladas, ver [TRADING_SETUP.md](./TRADING_SETUP.md)**

## 📥 Installation

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- A Supabase account (free tier available)
- (Optional) Google Cloud account for OAuth

### Step-by-Step Installation

1. **Clone or download this repository**

```bash
git clone <your-repo-url>
cd whiteapp
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

4. **Configure Supabase**

See [SETUP.md](./SETUP.md) for detailed Supabase configuration instructions.

5. **Run the development server**

```bash
npm run dev
```

## ⚙️ Configuration

### Environment Variables

All configuration is done through environment variables. Here are the required variables:

#### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Site Configuration (Required)
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change in production
```

#### Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### AI Providers (Optional)
```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

See [SETUP.md](./SETUP.md) for detailed instructions on obtaining these keys.

## 📁 Project Structure

```
whiteapp/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication callbacks
│   ├── dashboard/         # Protected dashboard area
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── DashboardContent.tsx
│   ├── Features.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   └── ThemeProvider.tsx
├── lib/                   # Utilities and configurations
│   └── supabase/         # Supabase client configuration
│       ├── client.ts     # Client-side Supabase
│       ├── server.ts     # Server-side Supabase
│       └── middleware.ts # Auth middleware
├── public/               # Static assets
├── .env.example          # Environment variables template
├── middleware.ts         # Next.js middleware
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies
├── README.md             # This file
└── SETUP.md             # Setup instructions
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make your changes**: Edit files in `app/` and `components/`
3. **Preview changes**: Changes auto-reload at http://localhost:3000
4. **Test authentication**: Create an account and test the flow
5. **Customize**: Update colors, content, and features as needed

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Deploy to Netlify

1. Push your code to GitHub
2. Import your repository in [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables in Netlify dashboard

### Deploy to Other Platforms

This is a standard Next.js app and can be deployed to:
- AWS Amplify
- Google Cloud Run
- Azure Static Web Apps
- Any platform supporting Node.js

### Important: Update Environment Variables

Don't forget to update `NEXT_PUBLIC_SITE_URL` to your production domain!

## 🎨 Customization

### Branding

1. **Update app name**: Edit `NEXT_PUBLIC_APP_NAME` in `.env`
2. **Change colors**: Edit `tailwind.config.ts` to customize the color scheme
3. **Replace logo**: Update the logo placeholder in components
4. **Modify content**: Edit components in `components/` folder

### Adding New Pages

```tsx
// app/your-page/page.tsx
export default function YourPage() {
  return <div>Your content here</div>
}
```

### Adding Protected Routes

Protected routes are automatically handled by middleware. Just add your route to the middleware matcher:

```ts
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*', '/your-protected-route/:path*'],
}
```

### Integrating AI

Example OpenAI integration:

```typescript
// app/api/chat/route.ts
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const { message } = await req.json()
  
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: message }],
  })
  
  return Response.json(completion.data)
}
```

## 🔒 Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use environment variables for all secrets
- ✅ Enable Row Level Security (RLS) in Supabase
- ✅ Validate user input on both client and server
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

## 📝 Adding Features

### Database Tables

Create tables in Supabase:

1. Go to Supabase Dashboard → Table Editor
2. Create your table
3. Enable RLS (Row Level Security)
4. Create policies for access control

Example policy:
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data"
ON your_table FOR SELECT
USING (auth.uid() = user_id);
```

### API Routes

Create API endpoints:

```typescript
// app/api/your-endpoint/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Your logic here
  
  return Response.json({ data: 'your data' })
}
```

## 🤝 Contributing

This is a skeleton/template project. Feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

## 💬 Support

- 📧 Email: support@whiteapp.com
- 📚 Documentation: See [SETUP.md](./SETUP.md)
- 🐛 Issues: Open an issue on GitHub

## 🎯 Roadmap

Future enhancements:
- [ ] Admin panel
- [ ] Multi-tenancy support
- [ ] Advanced analytics
- [ ] Payment integration (Stripe)
- [ ] Email templates
- [ ] More AI integrations
- [ ] Mobile app (React Native)

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Ready to build something amazing? Start now! 🚀**

```bash
npm install && npm run dev
```

