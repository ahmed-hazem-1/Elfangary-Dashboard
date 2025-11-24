# Netlify Deployment - FAQs & Troubleshooting

## Common Questions

### Q: Do I need to keep `server.cjs`?
**A:** Yes! Keep it for local development with `npm run dev:all`. On Netlify, serverless functions in `netlify/functions/` are used automatically.

### Q: Why are API calls going to `/.netlify/functions/` instead of `http://localhost:3001`?
**A:** The config file (`services/config.ts`) automatically detects the environment:
- Local (dev): Uses `http://localhost:3001`
- Netlify (prod): Uses `/.netlify/functions`

### Q: Do I need to change my React code?
**A:** No! The API service handles everything automatically. Your components don't need any changes.

### Q: What database should I use?
**A:** We recommend **Supabase** (free tier available):
1. Go to https://supabase.com
2. Create a new project
3. Get your PostgreSQL connection string
4. Import your `schema.sql`

### Q: What if I get "Cannot connect to database" error?
**A:** Check:
1. `DATABASE_URL` environment variable is set in Netlify
2. The connection string format is correct
3. Your Supabase project is active
4. Your IP is whitelisted (if using restrictive firewall)

---

## Common Issues & Solutions

### Issue: Build Failed on Netlify
**Solution:**
1. Check Netlify logs: **Deploy → Logs**
2. Common causes:
   - `package-lock.json` not committed
   - Node version mismatch
   - Missing environment variables

**Fix:**
```bash
npm install
git add package-lock.json
git commit -m "Add package lock"
git push
```

### Issue: "404 Not Found" on API calls
**Solution:**
1. Verify `netlify.toml` exists in root directory
2. Verify files exist in `netlify/functions/`:
   - `orders.js`
   - `menu.js`
   - `api.js`
3. Redeploy: Go to Netlify → Deploys → Trigger deploy

**Netlify function structure must be:**
```
project/
├── netlify/
│   └── functions/
│       ├── orders.js
│       ├── menu.js
│       └── api.js
└── netlify.toml
```

### Issue: API calls work locally but not on Netlify
**Solution:**
1. Check browser console (F12) for actual error
2. Check Netlify function logs:
   - **Site → Functions → View logs**
3. Verify environment variables:
   - **Settings → Build & deploy → Environment**

### Issue: "Failed to connect to database" after deploying
**Solution:**
1. Check `DATABASE_URL` in Netlify environment variables
2. Test the connection string locally:
   ```bash
   psql <your_database_url>
   ```
3. Ensure Supabase project is active
4. Check Supabase connection limits

### Issue: Timeout errors on API calls
**Solution:**
1. Database might be taking too long to respond
2. Increase timeout in function code (already set to 5000ms)
3. Check Supabase performance:
   - Look at query logs
   - Optimize slow queries

### Issue: CORS errors ("blocked by CORS policy")
**Solution:**
- Already handled! Serverless functions have CORS headers set
- If still getting errors, check browser console for exact error

### Issue: Changes not showing up after push
**Solution:**
1. Wait for Netlify to finish building (check Deploys tab)
2. Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
3. Disable service workers: **DevTools → Application → Service Workers → Unregister**
4. Hard refresh: Ctrl+Shift+R / Cmd+Shift+R

### Issue: "Cannot GET /"
**Solution:**
- This might mean the React build failed
- Check: **Deploys → View logs**
- Verify `publish = "dist"` in `netlify.toml`

---

## Testing Checklist

Before declaring deployment successful:

- [ ] Dashboard loads (no 404 errors)
- [ ] Can view existing orders
- [ ] Can create a new order
- [ ] Can update order status
- [ ] Can view menu items
- [ ] Can toggle menu item availability
- [ ] No console errors (F12)
- [ ] Responsive design works on mobile

---

## Monitoring & Debugging

### View Netlify Function Logs
1. Go to **Site Settings → Functions**
2. Click on a function name
3. See real-time logs and error details

### View Browser Console Logs
1. Press F12
2. Go to **Console** tab
3. Look for errors (red X)
4. Check network tab for failed requests

### Check Supabase Logs
1. Go to Supabase dashboard
2. **Editor → Database → Logs**
3. See query execution and errors

---

## Getting Help

If you're stuck:

1. **Check the docs:**
   - `NETLIFY_DEPLOYMENT.md` - Full guide
   - `NETLIFY_CHECKLIST.md` - Quick checklist
   - This file (FAQs)

2. **Check Netlify logs:**
   - Build logs: **Deploys → Logs**
   - Function logs: **Functions → [function-name]**

3. **Check browser console:**
   - F12 → Console → Look for red errors
   - F12 → Network → Look for 404/500 responses

4. **Verify setup:**
   - Run `netlify.toml` exists: ✓
   - Run functions exist: ✓ 
   - Environment variables set: ✓
   - Database URL valid: ✓

---

## Quick Commands

```bash
# Test locally before deploying
npm run dev:all

# Build for production
npm run build

# Check if build succeeds
npm run build 2>&1 | head -50

# See what will be deployed
ls -la dist/

# Push changes to GitHub
git add .
git commit -m "Fix: [describe change]"
git push origin main
```

---

## Still Not Working?

**Step 1:** Verify locally first
```bash
npm run dev:all
# Test at http://localhost:3000
# If it works locally, issue is with Netlify setup
```

**Step 2:** Check all 3 logs
- Netlify build logs
- Netlify function logs  
- Browser console (F12)

**Step 3:** Verify setup files
```bash
# Should all exist:
- netlify.toml
- netlify/functions/orders.js
- netlify/functions/menu.js
- services/config.ts (updated)
```

**Step 4:** Common fixes
- Clear Netlify cache and redeploy
- Update `netlify.toml` if modified
- Ensure no typos in DATABASE_URL
- Check Node version (18+)

---

**If all else fails:** Start fresh
1. Delete Netlify site
2. Create new site
3. Double-check `DATABASE_URL`
4. Re-deploy

Good luck! 🚀
