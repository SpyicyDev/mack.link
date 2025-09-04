-- D1 schema for mack.link

-- Links table
CREATE TABLE IF NOT EXISTS links (
  shortcode TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  redirect_type INTEGER DEFAULT 301,
  tags TEXT DEFAULT '[]',
  archived INTEGER DEFAULT 0,
  activates_at TEXT,
  expires_at TEXT,
  password_hash TEXT,
  password_enabled INTEGER DEFAULT 0,
  created TEXT NOT NULL,
  updated TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  last_clicked TEXT
);

-- Analytics totals per day per scope (shortcode or '_all')
CREATE TABLE IF NOT EXISTS analytics_day (
  scope TEXT NOT NULL,
  day TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  PRIMARY KEY (scope, day)
);

-- Analytics breakdown aggregated (overall)
CREATE TABLE IF NOT EXISTS analytics_agg (
  scope TEXT NOT NULL,
  dimension TEXT NOT NULL,
  key TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  PRIMARY KEY (scope, dimension, key)
);

-- Analytics breakdown per day
CREATE TABLE IF NOT EXISTS analytics_day_agg (
  scope TEXT NOT NULL,
  day TEXT NOT NULL,
  dimension TEXT NOT NULL,
  key TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  PRIMARY KEY (scope, day, dimension, key)
);

-- Global counters
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_day_scope_day ON analytics_day(scope, day);
CREATE INDEX IF NOT EXISTS idx_analytics_agg_scope_dimension ON analytics_agg(scope, dimension);
CREATE INDEX IF NOT EXISTS idx_analytics_day_agg_scope_day_dimension ON analytics_day_agg(scope, day, dimension);
CREATE INDEX IF NOT EXISTS idx_links_archived_created ON links(archived, created);
CREATE INDEX IF NOT EXISTS idx_links_clicks ON links(clicks DESC);
