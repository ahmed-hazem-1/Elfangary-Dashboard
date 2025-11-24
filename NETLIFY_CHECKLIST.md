# Netlify Deployment Checklist

## Before Deploying

- [ ] You have a GitHub account
- [ ] Your code is pushed to GitHub
- [ ] You have a Netlify account (https://netlify.com)
- [ ] You have a PostgreSQL database (Supabase recommended)
- [ ] You have a Gemini API key (if using AI features)

## Deployment Steps

1. **Push to GitHub**
   - [ ] Run: `git add .`
   - [ ] Run: `git commit -m "Setup Netlify deployment"`
   - [ ] Run: `git push origin main`

2. **Connect to Netlify**
   - [ ] Go to https://app.netlify.com
   - [ ] Click "New site from Git"
   - [ ] Select your GitHub repository
   - [ ] Accept the default build settings

3. **Configure Environment Variables**
   - [ ] Go to **Site settings → Build & deploy → Environment**
   - [ ] Add `DATABASE_URL`: (your Supabase connection string)
   - [ ] Add `NODE_ENV`: `production`
   - [ ] Add `GEMINI_API_KEY`: (your API key)

4. **Verify Deployment**
   - [ ] Wait for build to complete (green checkmark)
   - [ ] Click the site URL to open your dashboard
   - [ ] Test creating an order
   - [ ] Check browser console (F12) for errors

## What Changed

### New Files Created:
- `netlify.toml` - Netlify configuration
- `netlify/functions/orders.js` - Serverless API for orders
- `netlify/functions/menu.js` - Serverless API for menu
- `NETLIFY_DEPLOYMENT.md` - Full deployment guide

### Modified Files:
- `services/config.ts` - Now uses Netlify functions in production

### NOT Changed:
- `server.cjs` - Still needed for local development with `npm run dev:all`
- All React/UI components - No changes needed!

## Local Development

To test locally before deploying:

```bash
# Install dependencies
npm install

# Start everything (server + dev server)
npm run dev:all

# Server runs on http://localhost:3001
# Dashboard runs on http://localhost:3000
```

## Production (After Netlify Deployment)

- No need to run `npm run dev:all`
- Netlify automatically serves everything
- Serverless functions handle API calls
- Just visit your Netlify site URL

## Troubleshooting Quick Links

- **Build failed?** Check Netlify Deploy tab → Logs
- **API 404 errors?** Verify netlify.toml exists and functions are in netlify/functions/
- **Database connection error?** Check DATABASE_URL environment variable
- **Cannot connect to server?** You're running production code - functions are in use, not local server
