/**
 * Advanced IP Logger with Security Features
 * 
 * Includes:
 * - Rate limiting (prevent abuse)
 * - Bot filtering (configurable)
 * - IP blocking (blacklist/whitelist)
 * - Multiple storage backends (KV + D1)
 * 
 * This is the production-ready version.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Admin endpoints (secured)
    if (url.pathname.startsWith("/_admin")) {
      return handleAdmin(request, env, url);
    }
    
    // Extract visitor information
    const ip = request.headers.get("CF-Connecting-IP");
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const timestamp = new Date();
    const path = url.pathname;
    const method = request.method;
    
    // Get Cloudflare metadata
    const cf = request.cf || {};
    const country = cf.country || "unknown";
    
    // Security checks
    const securityResult = await checkSecurity(env, ip, userAgent);
    
    if (securityResult.blocked) {
      console.log(`Blocked: ${ip} - ${securityResult.reason}`);
      return new Response("Access Denied", { status: 403 });
    }
    
    // Bot detection
    const isBot = isBotUserAgent(userAgent);
    const botScore = cf.botManagement?.score || 0; // Cloudflare Bot Management (if enabled)
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(env, ip);
    
    if (rateLimitResult.limited) {
      console.log(`Rate limited: ${ip}`);
      return new Response("Too Many Requests", { 
        status: 429,
        headers: {
          "Retry-After": "60"
        }
      });
    }
    
    // Prepare log data
    const logData = {
      ip,
      userAgent,
      timestamp: timestamp.toISOString(),
      path,
      method,
      country,
      city: cf.city || "unknown",
      asn: cf.asn || 0,
      colo: cf.colo || "unknown",
      isBot,
      botScore,
      referer: request.headers.get("Referer") || null,
      acceptLanguage: request.headers.get("Accept-Language") || null
    };
    
    // Log to console (real-time)
    console.log(JSON.stringify(logData));
    
    // Store asynchronously (don't block response)
    ctx.waitUntil(storeLog(env, logData));
    
    // Forward to Cloudflare Pages
    return fetch(request);
  }
};

/**
 * Security checks (IP blocking, malicious patterns)
 */
async function checkSecurity(env, ip, userAgent) {
  // Check IP blacklist (stored in KV)
  if (env.IP_LOGS) {
    const blacklisted = await env.IP_LOGS.get(`blacklist:${ip}`);
    if (blacklisted) {
      return { blocked: true, reason: "IP blacklisted" };
    }
  }
  
  // Check for malicious patterns in user agent
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /burp/i,
    /acunetix/i
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(userAgent)) {
      return { blocked: true, reason: "Malicious user agent detected" };
    }
  }
  
  return { blocked: false };
}

/**
 * Rate limiting (per IP)
 * Allows 60 requests per minute per IP
 */
async function checkRateLimit(env, ip) {
  if (!env.IP_LOGS) return { limited: false };
  
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60;
  
  try {
    // Get current count
    const data = await env.IP_LOGS.get(key, "json");
    
    if (!data) {
      // First request in this window
      await env.IP_LOGS.put(key, JSON.stringify({
        count: 1,
        windowStart: now
      }), {
        expirationTtl: 60 // Auto-expire after 1 minute
      });
      return { limited: false };
    }
    
    // Check if window expired
    if (now - data.windowStart > windowMs) {
      // New window
      await env.IP_LOGS.put(key, JSON.stringify({
        count: 1,
        windowStart: now
      }), {
        expirationTtl: 60
      });
      return { limited: false };
    }
    
    // Within window - check count
    if (data.count >= maxRequests) {
      return { limited: true };
    }
    
    // Increment count
    await env.IP_LOGS.put(key, JSON.stringify({
      count: data.count + 1,
      windowStart: data.windowStart
    }), {
      expirationTtl: 60
    });
    
    return { limited: false };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { limited: false }; // Fail open
  }
}

/**
 * Bot detection
 */
function isBotUserAgent(ua) {
  const botPatterns = [
    /bot/i, /crawl/i, /spider/i, /scrape/i,
    /google/i, /bing/i, /yahoo/i, /baidu/i,
    /facebook/i, /twitter/i, /linkedin/i,
    /slack/i, /telegram/i, /whatsapp/i,
    /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
    /curl/i, /wget/i, /python/i, /java/i, /go-http/i
  ];
  
  return botPatterns.some(pattern => pattern.test(ua));
}

/**
 * Store log in both KV and D1 (dual storage)
 */
async function storeLog(env, data) {
  const date = data.timestamp.split("T")[0];
  
  // Store in KV (for quick daily access)
  if (env.IP_LOGS) {
    try {
      const key = `logs:${date}`;
      const existing = await env.IP_LOGS.get(key, "text");
      const newLine = JSON.stringify(data);
      const updated = existing ? `${existing}\n${newLine}` : newLine;
      
      await env.IP_LOGS.put(key, updated, {
        expirationTtl: 60 * 60 * 24 * 30 // 30 days
      });
    } catch (error) {
      console.error("KV storage failed:", error);
    }
  }
  
  // Store in D1 (for analytics)
  if (env.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO visits (
          ip, user_agent, timestamp, path, method,
          country, city, asn, colo, is_bot, bot_score, referer, accept_language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.ip,
        data.userAgent,
        data.timestamp,
        data.path,
        data.method,
        data.country,
        data.city,
        data.asn,
        data.colo,
        data.isBot ? 1 : 0,
        data.botScore,
        data.referer,
        data.acceptLanguage
      ).run();
    } catch (error) {
      console.error("D1 storage failed:", error);
    }
  }
}

/**
 * Handle admin endpoints
 * IMPORTANT: Secure these endpoints in production!
 */
async function handleAdmin(request, env, url) {
  // TODO: Add authentication here (API key, OAuth, etc.)
  const authHeader = request.headers.get("Authorization");
  const expectedKey = env.ADMIN_API_KEY; // Set this in wrangler.toml secrets
  
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Block IP endpoint
  if (url.pathname === "/_admin/block" && request.method === "POST") {
    const { ip } = await request.json();
    await env.IP_LOGS.put(`blacklist:${ip}`, "true");
    return new Response(`Blocked ${ip}`, { status: 200 });
  }
  
  // Unblock IP endpoint
  if (url.pathname === "/_admin/unblock" && request.method === "POST") {
    const { ip } = await request.json();
    await env.IP_LOGS.delete(`blacklist:${ip}`);
    return new Response(`Unblocked ${ip}`, { status: 200 });
  }
  
  return new Response("Not Found", { status: 404 });
}
