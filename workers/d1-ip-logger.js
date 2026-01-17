/**
 * D1 Database IP Logger Worker
 * 
 * Logs visitor IPs to Cloudflare D1 SQL database for structured querying.
 * Best for analytics, filtering, and long-term storage.
 * 
 * Setup:
 * 1. Create D1 database: wrangler d1 create ip-logs
 * 2. Run schema: wrangler d1 execute ip-logs --file=./schema.sql
 * 3. Add to wrangler.toml: [[d1_databases]]
 *                          binding = "DB"
 *                          database_name = "ip-logs"
 *                          database_id = "your-database-id"
 * 4. Deploy: wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Admin endpoints
    if (url.pathname === "/_stats" && request.method === "GET") {
      return handleStats(request, env);
    }
    
    if (url.pathname === "/_logs" && request.method === "GET") {
      return handleLogs(request, env);
    }
    
    // Extract visitor information
    const ip = request.headers.get("CF-Connecting-IP");
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const timestamp = new Date().toISOString();
    const path = url.pathname;
    const method = request.method;
    
    // Get Cloudflare metadata
    const cf = request.cf || {};
    const country = cf.country || "unknown";
    const city = cf.city || "unknown";
    const asn = cf.asn || 0;
    const colo = cf.colo || "unknown"; // Cloudflare datacenter
    
    // Determine if bot (basic check)
    const isBot = isBotUserAgent(userAgent);
    
    // Log to console
    console.log(JSON.stringify({ timestamp, ip, path, isBot }));
    
    // Store in D1 asynchronously
    ctx.waitUntil(storeInDatabase(env, {
      ip,
      userAgent,
      timestamp,
      path,
      method,
      country,
      city,
      asn,
      colo,
      isBot,
      referer: request.headers.get("Referer") || null
    }));
    
    // Forward request to Cloudflare Pages
    return fetch(request);
  }
};

/**
 * Store visit in D1 database
 */
async function storeInDatabase(env, data) {
  try {
    await env.DB.prepare(`
      INSERT INTO visits (
        ip, user_agent, timestamp, path, method, 
        country, city, asn, colo, is_bot, referer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.referer
    ).run();
  } catch (error) {
    console.error("Failed to store in D1:", error);
  }
}

/**
 * Basic bot detection
 */
function isBotUserAgent(ua) {
  const botPatterns = [
    /bot/i, /crawl/i, /spider/i, /scrape/i,
    /google/i, /bing/i, /yahoo/i, /baidu/i,
    /facebook/i, /twitter/i, /slack/i,
    /headless/i, /phantom/i, /selenium/i
  ];
  
  return botPatterns.some(pattern => pattern.test(ua));
}

/**
 * Handle stats endpoint
 */
async function handleStats(request, env) {
  try {
    // Total visits
    const totalResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM visits"
    ).first();
    
    // Unique IPs
    const uniqueResult = await env.DB.prepare(
      "SELECT COUNT(DISTINCT ip) as count FROM visits"
    ).first();
    
    // Top countries
    const countriesResult = await env.DB.prepare(`
      SELECT country, COUNT(*) as count 
      FROM visits 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    // Top paths
    const pathsResult = await env.DB.prepare(`
      SELECT path, COUNT(*) as count 
      FROM visits 
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    // Bot vs Human
    const botResult = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bots,
        SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) as humans
      FROM visits
    `).first();
    
    const stats = {
      total_visits: totalResult.count,
      unique_ips: uniqueResult.count,
      bots: botResult.bots,
      humans: botResult.humans,
      top_countries: countriesResult.results,
      top_paths: pathsResult.results
    };
    
    return new Response(JSON.stringify(stats, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

/**
 * Handle logs endpoint
 */
async function handleLogs(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const filterBot = url.searchParams.get("bot"); // "true" or "false"
  
  try {
    let query = "SELECT * FROM visits";
    const params = [];
    
    if (filterBot === "true") {
      query += " WHERE is_bot = 1";
    } else if (filterBot === "false") {
      query += " WHERE is_bot = 0";
    }
    
    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    
    const result = await env.DB.prepare(query)
      .bind(limit, offset)
      .all();
    
    return new Response(JSON.stringify(result.results, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
