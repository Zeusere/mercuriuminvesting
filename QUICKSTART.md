# ⚡ Quick Start Guide

Get WhiteApp running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free)
- (Optional) Google Cloud account for OAuth

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Set Up Environment Variables (2 minutes)

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Get your Supabase credentials:
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Create a new project (or select existing)
   - Go to Settings → API
   - Copy your `Project URL` and `anon public` key

3. Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 3: Configure Supabase (1 minute)

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Add this to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
3. Save changes

## Step 4: Run the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Step 5: Test It (30 seconds)

1. Click "Get Started"
2. Create an account
3. Check your email and confirm
4. Login and see your dashboard!

## Next Steps

### Add Google Login (Optional)
See [SETUP.md](./SETUP.md#2-google-oauth-setup) for detailed instructions.

### Customize Your App
1. Edit `components/` to change UI
2. Update `tailwind.config.ts` for colors
3. Modify `app/page.tsx` for landing page content

### Add AI Features
Add your AI API keys to `.env.local`:
```env
OPENAI_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## Common Issues

### ❌ "Failed to fetch"
- Check your Supabase URL in `.env.local`
- Ensure your Supabase project is active

### ❌ Can't login
- Verify email confirmation was sent
- Check Supabase dashboard → Authentication → Users

### ❌ Dark mode not working
- Clear browser cache
- Check localStorage in browser DevTools

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🔧 [Detailed Setup Guide](./SETUP.md)
- 🐛 [Open an Issue](https://github.com/yourproject/issues)

---

**You're all set! Start building! 🚀**

