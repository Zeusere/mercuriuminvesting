# 🔧 Setup Guide - WhiteApp

Complete step-by-step instructions to configure Supabase and Google OAuth for your WhiteApp.

## Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [Google OAuth Setup](#2-google-oauth-setup)
3. [Environment Variables](#3-environment-variables)
4. [Database Configuration](#4-database-configuration)
5. [Testing Authentication](#5-testing-authentication)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Supabase Setup

### Step 1.1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### Step 1.2: Create a New Project

1. Click **"New Project"**
2. Fill in the project details:
   - **Name**: Choose a name (e.g., "whiteapp-production")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select "Free" to start
3. Click **"Create new project"**
4. Wait 2-3 minutes for project setup to complete

### Step 1.3: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** (⚙️ icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see these values:

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon public key** (under "Project API keys"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   **service_role key** (under "Project API keys"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Copy these values to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: Never commit the `service_role` key to version control!

### Step 1.4: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **"Site URL"**, enter your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. Under **"Redirect URLs"**, add:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

4. Scroll down to **"Email Auth"** and ensure it's enabled
5. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and recovery emails

---

## 2. Google OAuth Setup

### Step 2.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Enter project details:
   - **Project name**: "WhiteApp" (or your app name)
   - **Organization**: (leave default)
5. Click **"Create"**

### Step 2.2: Enable Google+ API (if required)

1. In the Google Cloud Console, select your project
2. Go to **"APIs & Services"** → **"Library"**
3. Search for "Google+ API"
4. Click on it and press **"Enable"** (if not already enabled)

### Step 2.3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in required information:
   - **App name**: WhiteApp
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
5. Click **"Save and Continue"**
6. Skip "Scopes" by clicking **"Save and Continue"**
7. Add test users (your email) if app is in testing mode
8. Click **"Save and Continue"**

### Step 2.4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Fill in the details:
   
   **Name**: WhiteApp Web Client
   
   **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
   
   **Authorized redirect URIs**:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   
   ⚠️ Replace `xxxxxxxxxxxxx` with your actual Supabase project ID!

5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret**

### Step 2.5: Configure Google OAuth in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **"Google"** and click to expand
4. Enable Google provider
5. Paste your Google credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
6. Click **"Save"**

### Step 2.6: Add Google Credentials to .env

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 3. Environment Variables

### Complete .env File

Create a `.env` file in your project root with all required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# AI API Keys (Optional - add when needed)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...

# App Configuration
NEXT_PUBLIC_APP_NAME=WhiteApp
NEXT_PUBLIC_APP_DESCRIPTION=Modern web application skeleton
```

### Environment Variable Checklist

- [ ] Supabase URL configured
- [ ] Supabase anon key configured
- [ ] Supabase service role key configured
- [ ] Site URL set correctly
- [ ] Google OAuth credentials added (if using Google login)
- [ ] .env file added to .gitignore

---

## 4. Database Configuration

### Step 4.1: Set Up User Profiles (Optional)

Create a `profiles` table to store additional user information:

1. Go to Supabase → **SQL Editor**
2. Click **"New Query"**
3. Paste this SQL:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create a trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **"Run"**
5. Verify the table was created in **Table Editor**

### Step 4.2: Create Additional Tables

Create tables for your app features as needed:

```sql
-- Example: Projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Testing Authentication

### Test Email/Password Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click **"Get Started"** or **"Sign up"**
4. Create an account with email and password
5. Check your email for confirmation link
6. Click the confirmation link
7. Sign in with your credentials
8. Verify you're redirected to the dashboard

### Test Google OAuth

1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. Select your Google account
4. Grant permissions
5. Verify you're redirected to the dashboard

### Verify in Supabase

1. Go to Supabase → **Authentication** → **Users**
2. You should see your test users listed
3. Check their authentication methods

---

## 6. Troubleshooting

### Common Issues and Solutions

#### ❌ "Invalid login credentials"

**Solution**: 
- Verify your Supabase keys in `.env`
- Ensure user confirmed their email
- Check if user exists in Supabase dashboard

#### ❌ Google OAuth redirect error

**Solution**:
- Verify redirect URI in Google Cloud Console matches exactly:
  `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
- Check that Google provider is enabled in Supabase
- Ensure OAuth consent screen is configured

#### ❌ "Failed to fetch" error

**Solution**:
- Check if Supabase project is active
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check internet connection
- Verify CORS settings in Supabase

#### ❌ Dark mode not working

**Solution**:
- Check browser's localStorage
- Clear cache and reload
- Verify ThemeProvider is wrapping your app

#### ❌ Environment variables not loading

**Solution**:
- Restart development server after changing `.env`
- Ensure `.env` is in project root
- Variables for client-side must start with `NEXT_PUBLIC_`

### Getting Help

1. **Check Logs**: Look at browser console and terminal for errors
2. **Supabase Logs**: Check Supabase dashboard → Logs
3. **Documentation**: 
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
4. **Community**: 
   - Supabase Discord
   - Next.js GitHub Discussions

---

## 🎉 Setup Complete!

Your WhiteApp is now configured and ready to use! 

### Next Steps:

1. ✅ Test all authentication flows
2. ✅ Customize the UI and branding
3. ✅ Add your AI integrations
4. ✅ Create your database schema
5. ✅ Deploy to production

### Production Deployment Checklist:

- [ ] Update `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Add production domain to Supabase redirect URLs
- [ ] Add production domain to Google OAuth authorized origins
- [ ] Enable email confirmations in production
- [ ] Set up proper error monitoring
- [ ] Configure custom email templates
- [ ] Enable RLS on all tables
- [ ] Review security policies

**Happy Building! 🚀**

