# Deployment Instructions

## Complete Setup: Website + IP Logger

This project has two components:
1. **Frontend Website** (`/public`) - Educational anti-scam site visitors will see
2. **Worker** (`/workers`) - Backend IP logger (invisible to visitors)

---

## Part 1: Deploy Cloudflare Pages (Frontend)

### Option A: Git Integration (Recommended)

1. **Create Git Repository**:
   ```bash
   cd "G:\MUHIT\Red Project\ipproject"
   git init
   git add .
   git commit -m "Initial commit: Anti-scam website with IP logger"
   ```

2. **Push to GitHub/GitLab**:
   ```bash
   git remote add origin https://github.com/yourusername/ipproject.git
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Click **Connect to Git**
   - Select your repository
   - Configure build:
     - **Build command**: *(leave empty)*
     - **Build output directory**: `public`
   - Click **Save and Deploy**

### Option B: Direct Upload

1. **Go to Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages**
2. Click **Upload assets**
3. Upload the contents of the `public` folder
4. Click **Deploy site**

**Your website is now live!** 🎉  
Example URL: `https://ipproject.pages.dev`

---

## Part 2: Deploy Worker (IP Logger)

### Step 1: Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### Step 2: Choose Your Worker

Edit `wrangler.toml` and set `main` to one of:
- `workers/basic-ip-logger.js` - Console-only (simplest)
- `workers/kv-ip-logger.js` - KV storage (recommended)
- `workers/d1-ip-logger.js` - SQL database
- `workers/advanced-ip-logger.js` - Production with security

### Step 3: Set Up Storage (if using KV or D1)

**For KV Logger**:
```bash
wrangler kv:namespace create "IP_LOGS"
# Copy the namespace ID
# Uncomment [[kv_namespaces]] in wrangler.toml
# Paste the ID
```

**For D1 Logger**:
```bash
wrangler d1 create ip-logs
# Copy the database ID
wrangler d1 execute ip-logs --file=workers/schema.sql
# Uncomment [[d1_databases]] in wrangler.toml
# Paste the ID
```

### Step 4: Deploy Worker
```bash
cd "G:\MUHIT\Red Project\ipproject"
wrangler deploy
```

---

## Part 3: Connect Worker to Pages

### Method 1: Custom Routes (Recommended)

In `wrangler.toml`, uncomment and configure:
```toml
routes = [
  { pattern = "ipproject.pages.dev/*", zone_name = "pages.dev" }
]
```

If using a custom domain:
```toml
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

Then redeploy:
```bash
wrangler deploy
```

### Method 2: Dashboard Configuration

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Click on your Worker
3. Go to **Settings** → **Triggers**
4. Click **Add route**
5. Enter: `ipproject.pages.dev/*` (or your custom domain)
6. Click **Add route**

---

## Part 4: Verify Everything Works

### Test the Website:
Visit `https://ipproject.pages.dev` (or your URL)
- You should see the beautiful anti-scam education site

### Test IP Logging:

**For Basic Logger**:
- Dashboard → Workers & Pages → ip-logger → Logs → Begin log stream
- Visit your website
- You should see log entries appear

**For KV Logger**:
- Visit: `https://ip-logger.your-subdomain.workers.dev/_logs?date=2026-01-17`
- You should see a formatted table of logs

**For D1 Logger**:
- Visit: `https://ip-logger.your-subdomain.workers.dev/_stats`
- You should see analytics JSON

---

## Architecture Overview

```
Visitor
  ↓
Cloudflare Edge
  ↓
Worker (logs IP silently) ←— Invisible to visitor
  ↓
Cloudflare Pages (serves anti-scam website) ←— Visitor sees this
```

✅ Visitor sees: Beautiful educational website about scam prevention  
✅ You see: Real-time IP logs in your dashboard  
❌ Visitor never knows their IP is being logged

---

## Quick Test Locally

```bash
# Test Worker locally
wrangler dev workers/basic-ip-logger.js

# In another terminal, serve the website
cd public
python -m http.server 8080
# Or use: npx serve

# Visit: http://localhost:8080
```

---

## Customization

### Change Website Content:
Edit `public/index.html` - update scam types, tips, etc.

### Change Website Design:
Edit `public/style.css` - colors are in `:root` CSS variables

### Change Worker Behavior:
Edit your chosen worker file in `/workers`

### Add Custom Domain:
1. Cloudflare Dashboard → Pages → Your project → Custom domains
2. Add your domain
3. Update Worker routes to match

---

## Monitoring

### View Real-time Logs:
Dashboard → Workers & Pages → ip-logger → Logs

### View Stored Logs (KV):
`https://your-worker.workers.dev/_logs?date=YYYY-MM-DD`

### View Analytics (D1):
`https://your-worker.workers.dev/_stats`

---

## Cost Estimate

**Cloudflare Free Tier**:
- ✅ Unlimited bandwidth for Pages
- ✅ 100,000 Worker requests/day
- ✅ 1 GB KV storage
- ✅ 5 GB D1 storage

**For most sites: COMPLETELY FREE** 🎉

---

## Troubleshooting

### Website shows but logs don't appear?
- Check Worker is deployed: `wrangler deployments list`
- Verify route is configured correctly
- Check Worker logs for errors

### Worker shows errors?
- Verify KV/D1 bindings in `wrangler.toml`
- Check namespace/database IDs are correct
- Review error messages in logs

### Can't deploy Worker?
- Make sure you're logged in: `wrangler login`
- Check `wrangler.toml` syntax
- Verify you have permission in Cloudflare account

---

## Next Steps

1. **Deploy** your Pages site
2. **Deploy** your Worker
3. **Connect** them via routes
4. **Test** by visiting your site
5. **Monitor** logs in dashboard
6. **Customize** content and design as needed

**You're all set!** 🚀

---

## Questions?

- Check the main [README.md](README.md) for detailed documentation
- Visit [Cloudflare Community](https://community.cloudflare.com/)
- Review [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- Review [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
