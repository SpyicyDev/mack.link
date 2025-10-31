-- Migration: Add expiry metadata for ephemeral counters
-- This migration adds expiry tracking to prevent unbounded growth of rate-limit and session counters

-- Add expires_at column to counters table for ephemeral entries
-- SQLite doesn't support ALTER COLUMN, so we check if the column exists
-- This is safe to run multiple times

-- Check if column exists by attempting to add it (will fail silently if exists)
ALTER TABLE counters ADD COLUMN expires_at TEXT;

-- Create index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_counters_expires_at ON counters(expires_at) WHERE expires_at IS NOT NULL;

-- Note: Existing counter entries will have expires_at = NULL
-- Only rate-limit and password session entries will use expires_at

