-- D1 Database Schema for IP Logging
-- Run with: wrangler d1 execute ip-logs --file=./schema.sql

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  user_agent TEXT,
  timestamp TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  country TEXT,
  city TEXT,
  asn INTEGER,
  colo TEXT,
  is_bot INTEGER DEFAULT 0,
  referer TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ip ON visits(ip);
CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_path ON visits(path);
CREATE INDEX IF NOT EXISTS idx_country ON visits(country);
CREATE INDEX IF NOT EXISTS idx_is_bot ON visits(is_bot);

-- View for daily stats
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT ip) as unique_visitors,
  SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bot_visits,
  SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) as human_visits
FROM visits
GROUP BY DATE(timestamp)
ORDER BY date DESC;
