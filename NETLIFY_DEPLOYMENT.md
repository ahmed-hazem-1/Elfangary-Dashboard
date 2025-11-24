# Netlify Deployment Guide

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Netlify Account** - Sign up at https://netlify.com
3. **PostgreSQL Database** - Use Supabase (free tier available at https://supabase.com)

---

## Step 1: Set Up PostgreSQL Database (Supabase)

1. Go to **https://supabase.com** and sign up
2. Create a new project
3. Go to **Settings → Database** and copy the connection string
4. Run your `schema.sql` to create tables:
   - Open the SQL editor in Supabase
   - Copy contents of `schema.sql` and execute

---

## Step 2: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Elfangary Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
git push -u origin main
```

---

## Step 3: Deploy to Netlify

### Option A: Using Netlify UI (Recommended)

1. Go to **https://app.netlify.com**
2. Click **"New site from Git"**
3. Choose **GitHub** and authorize
4. Select your repository
5. Build settings should auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **"Deploy site"**
7. Once deployed, go to **Site settings → Build & deploy → Environment**
8. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: Your Gemini API key

### Option B: Using Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## Step 4: Update Environment Variables on Netlify

1. In Netlify dashboard, go to **Site settings → Build & deploy → Environment**
2. Add these variables:
   - `DATABASE_URL=postgresql://user:password@host/database`
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=your_api_key`

---

## Step 5: Verify Deployment

1. Visit your Netlify site URL
2. Check browser console (F12) for any errors
3. Test the dashboard by creating/updating orders
4. Verify API calls are reaching `/api/*` endpoints

---

## Troubleshooting

### "Cannot connect to server" error
- Check that `DATABASE_URL` is set in Netlify environment variables
- Ensure Supabase database is running and accessible
- Check Netlify function logs in **Functions** tab

### 404 errors on API calls
- Verify `netlify.toml` is in the root directory
- Check that serverless functions are in `netlify/functions/`
- Clear browser cache and redeploy

### Database connection timeouts
- Increase `connectionTimeoutMillis` in function code
- Check Supabase connection pool settings
- Verify DATABASE_URL format is correct

### Build fails
- Run `npm install` locally and commit `package-lock.json`
- Check Node version (should be 18+)
- View build logs in Netlify dashboard

---

## Development vs Production

- **Development**: Runs locally with `npm run dev:all` using local server
- **Production**: Uses Netlify serverless functions automatically

No code changes needed - the app detects the environment automatically!

---

## Important Notes

- ⚠️ **Old server.cjs is NOT used on Netlify** - Netlify uses serverless functions instead
- ✅ **Keep server.cjs for local development** 
- 📦 **Netlify functions are in `netlify/functions/`**
- 🔒 **Keep DATABASE_URL secret** - Never commit it to GitHub

---

## Support

For issues:
1. Check Netlify deploy logs
2. Check Netlify function logs
3. Check browser console (F12)
4. Verify Supabase database connection
