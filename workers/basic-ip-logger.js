/**
 * Basic IP Logger Worker
 * 
 * Logs visitor IP addresses to Cloudflare Workers console.
 * Logs are visible only in the Cloudflare Dashboard.
 * 
 * Deploy: wrangler deploy
 * View logs: Cloudflare Dashboard → Workers & Pages → [Worker Name] → Logs
 */

export default {
  async fetch(request, env, ctx) {
    // Extract real client IP (set by Cloudflare, cannot be spoofed)
    const ip = request.headers.get("CF-Connecting-IP");
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const timestamp = new Date().toISOString();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Get Cloudflare request metadata
    const cf = request.cf || {};
    const country = cf.country || "unknown";
    const city = cf.city || "unknown";
    const asn = cf.asn || "unknown";
    
    // Create structured log entry
    const logEntry = {
      timestamp,
      ip,
      method,
      path,
      userAgent,
      country,
      city,
      asn,
      referer: request.headers.get("Referer") || "direct"
    };
    
    // Log to Workers console (owner-only, visible in dashboard)
    console.log(JSON.stringify(logEntry));
    
    // CORS Headers for frontend logging
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // If this is a specific ping for logging (from the frontend), just return 200 OK
    if (url.pathname === "/ping") {
       return new Response("Logged", { headers: corsHeaders });
    }

    // Otherwise, fetch the website content (for when visiting worker directly)
    const pagesUrl = `https://fluppy.pages.dev${url.pathname}${url.search}`;
    const response = await fetch(pagesUrl);
    
    // Re-create response to attach CORS headers
    const newResponse = new Response(response.body, response);
    Object.keys(corsHeaders).forEach(key => newResponse.headers.set(key, corsHeaders[key]));
    return newResponse;
  }
};
