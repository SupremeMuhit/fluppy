/**
 * KV-Persistent IP Logger Worker
 * 
 * Logs visitor IPs to Cloudflare KV for persistent storage.
 * Logs are organized by date and stored indefinitely (or until manually purged).
 * 
 * Setup:
 * 1. Create KV namespace: wrangler kv:namespace create "IP_LOGS"
 * 2. Add to wrangler.toml: [[kv_namespaces]]
 *                          binding = "IP_LOGS"
 *                          id = "your-namespace-id"
 * 3. Deploy: wrangler deploy
 * 
 * View logs: Use the included admin viewer or query KV directly
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Admin endpoint to view logs (protect this in production!)
    if (url.pathname === "/_logs" && request.method === "GET") {
      return handleLogViewer(request, env);
    }
    
    // Extract visitor information
    const ip = request.headers.get("CF-Connecting-IP");
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const timestamp = new Date().toISOString();
    const date = timestamp.split("T")[0]; // YYYY-MM-DD
    const path = url.pathname;
    const method = request.method;
    
    // Get Cloudflare metadata
    const cf = request.cf || {};
    const country = cf.country || "unknown";
    const city = cf.city || "unknown";
    
    // Create log entry
    const logEntry = {
      timestamp,
      ip,
      method,
      path,
      userAgent,
      country,
      city,
      referer: request.headers.get("Referer") || "direct"
    };
    
    // Log to console (real-time viewing)
    console.log(JSON.stringify(logEntry));
    
    // Store in KV asynchronously (don't block the response)
    ctx.waitUntil(storeLog(env, date, logEntry));
    
    // Forward request to Cloudflare Pages
    return fetch(request);
  }
};

/**
 * Store log entry in KV
 * Appends to daily log file
 */
async function storeLog(env, date, logEntry) {
  try {
    const key = `logs:${date}`;
    
    // Get existing logs for today
    const existing = await env.IP_LOGS.get(key, "text");
    const newLine = JSON.stringify(logEntry);
    
    // Append new entry
    const updated = existing ? `${existing}\n${newLine}` : newLine;
    
    // Store back (with 30-day expiration to manage storage costs)
    await env.IP_LOGS.put(key, updated, {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });
  } catch (error) {
    console.error("Failed to store log:", error);
  }
}

/**
 * Handle log viewer endpoint
 * Returns logs for a specific date
 */
async function handleLogViewer(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const key = `logs:${date}`;
  
  try {
    const logs = await env.IP_LOGS.get(key, "text");
    
    if (!logs) {
      return new Response(`No logs found for ${date}`, {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // Parse and format logs
    const entries = logs.split("\n").map(line => JSON.parse(line));
    
    // Return as HTML for easy viewing
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IP Logs - ${date}</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
    h1 { color: #00ff00; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #2a2a2a; color: #00ff00; }
    tr:hover { background: #2a2a2a; }
    .ip { color: #ff6b6b; font-weight: bold; }
    .path { color: #4ecdc4; }
    .country { color: #ffd93d; }
  </style>
</head>
<body>
  <h1>IP Logs for ${date}</h1>
  <p>Total visits: ${entries.length}</p>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>IP Address</th>
        <th>Method</th>
        <th>Path</th>
        <th>Country</th>
        <th>City</th>
        <th>User Agent</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map(e => `
        <tr>
          <td>${e.timestamp}</td>
          <td class="ip">${e.ip}</td>
          <td>${e.method}</td>
          <td class="path">${e.path}</td>
          <td class="country">${e.country}</td>
          <td>${e.city}</td>
          <td>${e.userAgent.substring(0, 50)}...</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</body>
</html>
    `;
    
    return new Response(html, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
