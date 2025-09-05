-- Migration script to reconcile analytics data inconsistencies
-- Run with: npx wrangler d1 execute mack-link --file src/migrate-analytics.sql [--remote]

-- 1. Update the analytics:_all:totalClicks counter to match sum of all link clicks
INSERT OR REPLACE INTO counters (name, value)
SELECT 
    'analytics:_all:totalClicks', 
    COALESCE(SUM(clicks), 0) 
FROM links 
WHERE archived = 0;

-- 2. Identify links with missing analytics_day entries (optional check)
-- This query will show which links have clicks but no corresponding analytics_day entries
SELECT 
    l.shortcode,
    l.clicks,
    COALESCE(ad.total_analytics_clicks, 0) as analytics_clicks,
    l.clicks - COALESCE(ad.total_analytics_clicks, 0) as difference
FROM links l
LEFT JOIN (
    SELECT 
        scope, 
        SUM(clicks) as total_analytics_clicks 
    FROM analytics_day 
    WHERE scope != '_all' 
    GROUP BY scope
) ad ON l.shortcode = ad.scope
WHERE l.clicks > 0 
AND (ad.total_analytics_clicks IS NULL OR l.clicks != ad.total_analytics_clicks);

-- 3. Show summary of current state
SELECT 
    'Links table total clicks' as source,
    COALESCE(SUM(clicks), 0) as total_clicks
FROM links 
WHERE archived = 0

UNION ALL

SELECT 
    'Analytics counter' as source,
    COALESCE(value, 0) as total_clicks
FROM counters 
WHERE name = 'analytics:_all:totalClicks'

UNION ALL

SELECT 
    'Analytics _all scope total' as source,
    COALESCE(SUM(clicks), 0) as total_clicks
FROM analytics_day 
WHERE scope = '_all';

-- Note: If there are significant discrepancies, you may need to:
-- 1. Clear analytics tables and rebuild from scratch, OR
-- 2. Manually adjust individual records
-- 
-- For a complete rebuild (DESTRUCTIVE - use with caution):
-- DELETE FROM analytics_day;
-- DELETE FROM analytics_agg;  
-- DELETE FROM analytics_day_agg;
-- DELETE FROM counters WHERE name LIKE 'analytics:%';
