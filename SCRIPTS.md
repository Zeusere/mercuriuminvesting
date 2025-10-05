# 📜 Useful Scripts & Commands

Collection of helpful commands for developing and managing WhiteApp.

## Table of Contents

1. [Development](#development)
2. [Database Management](#database-management)
3. [Deployment](#deployment)
4. [Maintenance](#maintenance)
5. [Troubleshooting](#troubleshooting)

---

## Development

### Start Development Server

```bash
# Start Next.js dev server
npm run dev

# With turbopack (faster)
npm run dev -- --turbo
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Build and start
npm run build && npm start
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint -- --fix

# Type checking
npm run type-check

# Format code with Prettier (if installed)
npx prettier --write .
```

### Testing

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Database Management

### Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Pull database schema
supabase db pull

# Push database changes
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --project-id your-project-id > types/supabase.ts

# Run migrations
supabase migration up
```

### Create Database Backup

```bash
# From Supabase dashboard
# Settings → Database → Connection Info
# Use pg_dump with connection string

pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" > backup.sql
```

### Restore Database

```bash
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < backup.sql
```

---

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Pull environment variables
vercel env pull .env.local
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Docker (Optional)

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Build image
docker build -t whiteapp .

# Run container
docker run -p 3000:3000 --env-file .env.local whiteapp
```

---

## Maintenance

### Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm update next

# Update to latest (use with caution)
npx npm-check-updates -u
npm install

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Clean Up

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Clear all caches and reinstall
rm -rf node_modules .next package-lock.json
npm install
```

### Optimize Images

```bash
# Install image optimization tool
npm install -g sharp-cli

# Optimize images in public folder
npx sharp -i public/images/*.{jpg,png} -o public/images/optimized/
```

---

## Troubleshooting

### Common Issues

#### Fix TypeScript errors

```bash
# Remove TypeScript cache
rm -rf .next tsconfig.tsbuildinfo

# Regenerate Next.js types
npm run dev
# Then stop the server after it starts
```

#### Fix ESLint errors

```bash
# Auto-fix what can be fixed
npm run lint -- --fix

# Ignore specific files
echo "build/\n.next/\nnode_modules/" > .eslintignore
```

#### Reset Supabase Auth

```bash
# In Supabase SQL Editor, run:
# DELETE FROM auth.users WHERE email = 'test@example.com';
```

#### Debug Production Build

```bash
# Build with debug info
ANALYZE=true npm run build

# Check bundle size
npx @next/bundle-analyzer
```

### Environment Variables Issues

```bash
# Verify env vars are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Print all NEXT_PUBLIC_ vars
env | grep NEXT_PUBLIC
```

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

## Custom Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "rm -rf .next node_modules",
    "fresh": "npm run clean && npm install",
    "analyze": "ANALYZE=true next build",
    "db:pull": "supabase db pull",
    "db:types": "supabase gen types typescript --project-id $NEXT_PUBLIC_SUPABASE_PROJECT_ID > types/supabase.ts",
    "pre-commit": "npm run lint && npm run type-check",
    "prepare": "husky install"
  }
}
```

---

## Git Hooks

### Install Husky

```bash
# Install Husky
npm install --save-dev husky

# Initialize
npx husky-init

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-commit "npm run type-check"
```

### Pre-commit Hook Example

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (if you have them)
# npm test -- --passWithNoTests

echo "Pre-commit checks passed!"
```

---

## Performance Analysis

### Analyze Bundle Size

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Update next.config.js
cat >> next.config.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
EOF

# Run analysis
ANALYZE=true npm run build
```

### Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view

# Run audit on production
lighthouse https://your-domain.com --view
```

---

## Database Utilities

### Seed Database

Create `scripts/seed.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Seeding database...')

  // Add seed data here
  const { data, error } = await supabase.from('your_table').insert([
    { name: 'Example 1' },
    { name: 'Example 2' },
  ])

  if (error) {
    console.error('Error seeding:', error)
  } else {
    console.log('Seeded successfully!')
  }
}

seed()
```

Run with:
```bash
npx ts-node scripts/seed.ts
```

---

## Monitoring

### Set Up Error Tracking

```bash
# Install Sentry
npx @sentry/wizard -i nextjs

# Follow prompts to configure
```

### Set Up Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

// In body:
<Analytics />
```

---

## Useful One-Liners

```bash
# Count lines of code
find . -name '*.tsx' -o -name '*.ts' | xargs wc -l

# Find TODO comments
grep -r "TODO" --include="*.ts" --include="*.tsx"

# List all components
find components -name "*.tsx" | sed 's|.*/||;s|\.tsx||'

# Check for console.logs (should remove in production)
grep -r "console.log" --include="*.ts" --include="*.tsx"

# Find large files
find . -type f -size +1M -not -path "*/node_modules/*"
```

---

## Backup Strategy

### Create Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"

mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
supabase db dump -f $BACKUP_DIR/db_$DATE.sql

# Backup environment variables
echo "Backing up environment..."
cp .env.local $BACKUP_DIR/env_$DATE.backup

# Backup important files
echo "Creating archive..."
tar -czf $BACKUP_DIR/whiteapp_$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=backups \
  .

echo "Backup complete: $BACKUP_DIR/whiteapp_$DATE.tar.gz"
```

Make executable and run:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

---

## Quick Reference

### Most Used Commands

```bash
npm run dev              # Start development
npm run build            # Build for production
npm run lint             # Check code quality
npm run type-check       # Check TypeScript
supabase db pull         # Pull database schema
vercel --prod            # Deploy to production
```

---

**Save this file for quick reference during development! 📚**

