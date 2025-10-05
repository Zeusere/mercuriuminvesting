# 🚀 Deployment Guide

Complete guide to deploy WhiteApp to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deploy to Vercel](#deploy-to-vercel)
3. [Deploy to Netlify](#deploy-to-netlify)
4. [Deploy to Other Platforms](#deploy-to-other-platforms)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Environment Variables for Production](#environment-variables-for-production)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All features work locally
- [ ] Environment variables are documented
- [ ] Database schema is finalized
- [ ] Supabase RLS policies are in place
- [ ] Email templates are configured
- [ ] Error handling is implemented
- [ ] Loading states are added
- [ ] Mobile responsiveness is tested
- [ ] SEO meta tags are added
- [ ] Analytics are set up (optional)

---

## Deploy to Vercel

Vercel is the recommended platform for Next.js apps.

### Method 1: Deploy with Git (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add all variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_SITE_URL` (your production URL)
     - Other API keys as needed

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.vercel.app`

### Method 2: Deploy with CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... add all other variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Deploy to Netlify

### Steps

1. **Build Configuration**
   Create `netlify.toml` in your project root:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Push to Git**
   ```bash
   git add .
   git commit -m "Add Netlify config"
   git push
   ```

3. **Import to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add all variables from `.env.local`

5. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://your-app.netlify.app`

---

## Deploy to Other Platforms

### AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your repository
4. Configure build settings
5. Add environment variables
6. Deploy

### DigitalOcean App Platform

1. Go to [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Create new app
3. Connect your repository
4. Configure as Node.js app
5. Add environment variables
6. Deploy

### Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Connect GitHub repo
4. Add environment variables
5. Deploy automatically

---

## Post-Deployment Setup

### 1. Update Supabase Configuration

1. Go to your Supabase project
2. Navigate to **Authentication** → **Settings**
3. Update **Site URL** to your production domain:
   ```
   https://your-app.vercel.app
   ```
4. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```

### 2. Update Google OAuth (if using)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```
6. Add to **Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```

### 3. Configure Custom Domain (Optional)

#### On Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate to provision

#### Update Environment Variables:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. Enable Email Confirmations

1. In Supabase, go to **Authentication** → **Settings**
2. Enable "Confirm email"
3. Customize email templates in **Authentication** → **Email Templates**

### 5. Set Up Monitoring (Optional)

#### Vercel Analytics:
1. Go to your project on Vercel
2. Navigate to Analytics tab
3. Enable analytics

#### Sentry for Error Tracking:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 6. Performance Optimization

- Enable Image Optimization (automatic on Vercel)
- Configure CDN caching
- Add `robots.txt` and `sitemap.xml`
- Enable compression

---

## Environment Variables for Production

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Site
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com

# Google OAuth (if using)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

### Optional Variables

```env
# AI APIs
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-...

# Error Tracking
SENTRY_DSN=https://...
```

---

## Production Best Practices

### Security

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only
- [ ] Set up CORS properly
- [ ] Enable Supabase RLS on all tables
- [ ] Use Content Security Policy headers
- [ ] Keep dependencies updated

### Performance

- [ ] Enable caching headers
- [ ] Optimize images (use Next.js Image component)
- [ ] Minimize bundle size
- [ ] Use lazy loading
- [ ] Enable compression

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Enable analytics (Google Analytics, Plausible)
- [ ] Monitor API usage
- [ ] Set up uptime monitoring
- [ ] Create alerts for critical errors

### Backup

- [ ] Regular database backups
- [ ] Version control for code
- [ ] Document environment variables
- [ ] Export Supabase schema regularly

---

## Troubleshooting Production Issues

### Build Fails

- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation locally
- Check for environment-specific code

### Authentication Issues

- Verify redirect URLs in Supabase
- Check environment variables
- Ensure Google OAuth is configured for production domain
- Check CORS settings

### Performance Issues

- Use Vercel Analytics to identify bottlenecks
- Check database query performance
- Optimize images and assets
- Enable caching

---

## Rollback Strategy

If something goes wrong:

### On Vercel:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### On Netlify:
1. Go to Deploys
2. Find previous working deploy
3. Click "Publish deploy"

---

## Support

Need help with deployment?

- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [Netlify Documentation](https://docs.netlify.com)
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 Open an issue on GitHub

---

**Your app is now live! 🎉**

Monitor it, iterate on it, and build something amazing!

