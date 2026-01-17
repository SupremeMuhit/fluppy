# Cloudflare Worker IP Logger

Complete solution for logging **exact visitor IP addresses** on Cloudflare Pages using Cloudflare Workers.

## 📋 Overview

This project provides **four implementations** of increasing sophistication:

1. **Basic Logger** - Console-only logging
2. **KV Logger** - Persistent storage in Cloudflare KV
3. **D1 Logger** - Structured SQL database logging
4. **Advanced Logger** - Production-ready with security features

## 🎯 Key Features

✅ **Logs real client IPs** using `CF-Connecting-IP` header  
✅ **Owner-only access** - logs never shown to visitors  
✅ **Cloudflare metadata** - country, city, ASN, datacenter  
✅ **Bot detection** - filter automated traffic  
✅ **Rate limiting** - prevent abuse  
✅ **IP blocking** - blacklist/whitelist support  
✅ **Multiple storage** - KV, D1, or both  

---

## 🚀 Quick Start

### Prerequisites

1. Cloudflare account (free tier works!)
2. Cloudflare Pages site deployed
3. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed

```bash
npm install -g wrangler
wrangler login
```

### Option 1: Basic Logger (Simplest)

**Best for**: Quick setup, real-time viewing only

```bash
# 1. Edit wrangler.toml
# Set: main = "workers/basic-ip-logger.js"

# 2. Deploy
wrangler deploy

# 3. View logs
# Go to: Cloudflare Dashboard → Workers & Pages → ip-logger → Logs
```

### Option 2: KV Logger (Persistent)

**Best for**: Long-term storage, daily logs

```bash
# 1. Create KV namespace
wrangler kv:namespace create "IP_LOGS"

# 2. Copy the ID and update wrangler.toml
# Uncomment the [[kv_namespaces]] section
# Add your namespace ID

# 3. Edit wrangler.toml
# Set: main = "workers/kv-ip-logger.js"

# 4. Deploy
wrangler deploy

# 5. View logs
# Visit: https://your-worker.workers.dev/_logs?date=2026-01-17
```

### Option 3: D1 Logger (Analytics)

**Best for**: Structured queries, analytics, filtering

```bash
# 1. Create D1 database
wrangler d1 create ip-logs

# 2. Run schema
wrangler d1 execute ip-logs --file=workers/schema.sql

# 3. Update wrangler.toml
# Uncomment [[d1_databases]] section
# Add your database ID

# 4. Edit wrangler.toml
# Set: main = "workers/d1-ip-logger.js"

# 5. Deploy
wrangler deploy

# 6. View stats
# Visit: https://your-worker.workers.dev/_stats

# 7. View logs
# Visit: https://your-worker.workers.dev/_logs?limit=50
```

### Option 4: Advanced Logger (Production)

**Best for**: Production sites with security needs

```bash
# 1. Set up both KV and D1 (see above)

# 2. Create admin API key
wrangler secret put ADMIN_API_KEY
# Enter a strong random key when prompted

# 3. Edit wrangler.toml
# Set: main = "workers/advanced-ip-logger.js"

# 4. Deploy
wrangler deploy
```

---

## 🔗 Connecting to Cloudflare Pages

After deploying your Worker, connect it to your Pages site:

### Method 1: Custom Domain Route

```toml
# In wrangler.toml, uncomment and configure:
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Method 2: Workers Routes in Dashboard

1. Go to **Workers & Pages** → **ip-logger**
2. Click **Settings** → **Triggers**
3. Add route: `yourdomain.com/*`
4. Save

### Method 3: Pages Integration

1. Go to your **Cloudflare Pages** project
2. Click **Settings** → **Functions**
3. Under **Service Bindings**, add your Worker
4. The Worker will now intercept all requests

---

## 📊 Viewing Logs

### Console Logs (All Workers)

1. Dashboard → **Workers & Pages** → **ip-logger**
2. Click **Logs** → **Begin log stream**
3. Real-time logs appear here

### KV Logs Viewer

Visit: `https://your-worker.workers.dev/_logs?date=YYYY-MM-DD`

Returns formatted HTML table with:
- Timestamp
- IP address
- HTTP method
- Path
- Country/City
- User agent

### D1 Analytics

**Stats endpoint**: `/_stats`
```json
{
  "total_visits": 1234,
  "unique_ips": 567,
  "bots": 89,
  "humans": 1145,
  "top_countries": [...],
  "top_paths": [...]
}
```

**Logs endpoint**: `/_logs?limit=100&offset=0&bot=false`

---

## 🔒 Security & Privacy

### What Gets Logged

- ✅ IP address (`CF-Connecting-IP`)
- ✅ Timestamp
- ✅ URL path
- ✅ HTTP method
- ✅ Country/City (from Cloudflare)
- ✅ User agent
- ✅ Referer
- ❌ Passwords or sensitive form data
- ❌ Cookies or session tokens

### Access Control

> [!CAUTION]
> **Admin endpoints are NOT secured by default!**

To secure admin endpoints in production:

1. **Add authentication** to `handleAdmin()` function
2. **Use API keys** (set via `wrangler secret put ADMIN_API_KEY`)
3. **Restrict by IP** using Cloudflare Access
4. **Use Cloudflare Access** for Zero Trust authentication

Example API key usage:
```bash
# Call admin endpoint with auth
curl -X POST https://your-worker.workers.dev/_admin/block \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4"}'
```

### Legal Compliance

> [!IMPORTANT]
> IP addresses are **personal data** under GDPR/CCPA.

**Requirements**:
- Update privacy policy to mention IP logging
- State purpose: "security and diagnostics"
- Mention retention period (e.g., 30 days)
- Provide contact for data requests

**This solution is appropriate for**:
- Owner-only diagnostics
- Security monitoring
- Internal analytics

**NOT appropriate for**:
- Third-party sharing
- Marketing purposes
- Public analytics without consent

---

## 🛠️ Advanced Features

### Rate Limiting

The advanced worker limits to **60 requests/minute per IP**.

Adjust in `checkRateLimit()`:
```javascript
const maxRequests = 60;  // Change this
const windowMs = 60 * 1000;  // 1 minute
```

### Bot Filtering

Automatically detects bots based on user agent patterns.

Add custom patterns in `isBotUserAgent()`:
```javascript
const botPatterns = [
  /yourbot/i,
  // ... existing patterns
];
```

### IP Blocking

Block malicious IPs via admin API:

```bash
# Block an IP
curl -X POST https://your-worker.workers.dev/_admin/block \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"ip": "1.2.3.4"}'

# Unblock an IP
curl -X POST https://your-worker.workers.dev/_admin/unblock \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"ip": "1.2.3.4"}'
```

### Custom Queries (D1)

Query the database directly:

```bash
# Get all visits from a specific IP
wrangler d1 execute ip-logs --command \
  "SELECT * FROM visits WHERE ip = '1.2.3.4'"

# Get daily stats
wrangler d1 execute ip-logs --command \
  "SELECT * FROM daily_stats"

# Top 10 visitor IPs
wrangler d1 execute ip-logs --command \
  "SELECT ip, COUNT(*) as visits FROM visits GROUP BY ip ORDER BY visits DESC LIMIT 10"
```

---

## 📁 File Structure

```
ipproject/
├── workers/
│   ├── basic-ip-logger.js       # Console-only logging
│   ├── kv-ip-logger.js          # KV persistent storage
│   ├── d1-ip-logger.js          # D1 database logging
│   ├── advanced-ip-logger.js    # Production-ready with security
│   └── schema.sql               # D1 database schema
├── wrangler.toml                # Cloudflare Workers config
└── README.md                    # This file
```

---

## 🧪 Testing

Test your Worker locally:

```bash
# Run local dev server
wrangler dev workers/basic-ip-logger.js

# Test in browser
# Visit: http://localhost:8787

# Check logs in terminal
```

Test IP logging:

```bash
# Simulate request with custom IP header
curl -H "CF-Connecting-IP: 1.2.3.4" https://your-worker.workers.dev/test
```

---

## 🔧 Troubleshooting

### Logs not appearing?

1. Check Worker is deployed: `wrangler deployments list`
2. Verify route is configured correctly
3. Check real-time logs: Dashboard → Worker → Logs

### KV not storing?

1. Verify namespace binding in `wrangler.toml`
2. Check namespace ID is correct
3. Test: `wrangler kv:key list --namespace-id=YOUR_ID`

### D1 errors?

1. Verify schema is applied: `wrangler d1 execute ip-logs --command "SELECT * FROM visits LIMIT 1"`
2. Check database binding in `wrangler.toml`
3. Review Worker logs for SQL errors

### Worker not intercepting Pages?

1. Ensure route matches your domain **exactly**
2. Check route priority (Workers routes run first)
3. Verify DNS is proxied (orange cloud) in Cloudflare

---

## 💰 Costs

**Cloudflare Free Tier includes**:
- ✅ 100,000 Worker requests/day
- ✅ 1 GB KV storage
- ✅ 5 GB D1 storage
- ✅ 25 million D1 reads/month

**For most sites, this is FREE.**

Pricing beyond free tier:
- Workers: $5/month for 10M requests
- KV: $0.50/GB/month
- D1: $5/month for 25GB storage

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

## 🤝 Contributing

Improvements welcome! Consider adding:

- Geographic heat maps
- Visitor session tracking
- Export to CSV/JSON
- Email alerts for suspicious activity
- Integration with external analytics platforms

---

## ⚠️ Disclaimer

This tool is for **legitimate website monitoring only**. Respect user privacy and comply with applicable laws. The author is not responsible for misuse.

---

## 📄 License

MIT License - use freely, modify as needed.

---

**Questions?** Check the [Cloudflare Community Forums](https://community.cloudflare.com/) or open an issue.
