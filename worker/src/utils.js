import { getConfig } from './config.js';
import { dbAll } from './db.js';

/**
 * Enhanced input sanitization with better security
 * @param {any} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {any} Sanitized input
 */
export function sanitizeInput(input, { maxLength = 2048, allowHtml = false } = {}) {
	if (typeof input !== 'string') return input;
	
	let sanitized = input.trim();
	
	// Remove control characters and other dangerous characters
	sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
	
	// Remove potentially dangerous characters if HTML is not allowed
	if (!allowHtml) {
		sanitized = sanitized.replace(/[<>'"&]/g, '');
	}
	
	// Enforce length limit
	if (sanitized.length > maxLength) {
		sanitized = sanitized.substring(0, maxLength);
	}
	
	return sanitized;
}

export function json(env, data, init = {}) {
	const response = new Response(JSON.stringify(data), {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
	});
	return withCors(env, response);
}

export function text(env, body, init = {}) {
	const response = new Response(body, init);
	return withCors(env, response);
}

export async function withTimeout(promise, env, timeoutMs, timeoutMessage = 'Operation timed out') {
	const { timeouts } = getConfig(env);
	const ms = timeoutMs ?? timeouts.default;
	return Promise.race([
		promise,
		new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms))
	]);
}

export async function retryWithBackoff(operation, { maxRetries = 3, baseDelay = 1000 } = {}) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation(attempt);
		} catch (error) {
			if (attempt === maxRetries) throw error;
			const delay = baseDelay * Math.pow(2, attempt - 1);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
}

// Simple in-memory caches (edge-local) with size limits to prevent memory leaks
const MAX_CACHE_SIZE = 10000;

class BoundedMap extends Map {
	constructor(maxSize = MAX_CACHE_SIZE) {
		super();
		this.maxSize = maxSize;
	}
	
	set(key, value) {
		// Remove oldest entry if we're at capacity
		if (this.size >= this.maxSize) {
			const firstKey = this.keys().next().value;
			this.delete(firstKey);
		}
		return super.set(key, value);
	}
}

export const tokenCache = new BoundedMap();
export const rateLimitCache = new BoundedMap();

/**
 * In-memory rate limiter fallback
 * @param {string} key - Rate limit key (usually IP address)
 * @param {Object} options - Rate limit options
 * @param {number} options.limit - Request limit
 * @param {number} options.windowMs - Time window in milliseconds
 * @returns {boolean} True if rate limited
 */
export function isRateLimited(key, { limit = 100, windowMs = 3600000 } = {}) {
	const now = Date.now();
	const window = Math.floor(now / windowMs);
	const cacheKey = `${key}:${window}`;
	
	const current = rateLimitCache.get(cacheKey) || 0;
	rateLimitCache.set(cacheKey, current + 1);
	
	return current >= limit;
}

export function getClientIP(request) {
	const xff = request.headers.get('X-Forwarded-For');
	if (xff) return xff.split(',')[0].trim();
	return request.headers.get('CF-Connecting-IP') || 'unknown';
}

// Persistent (D1-based) rate limit per IP and window bucket
export async function isRateLimitedPersistent(env, request, { key = 'default', limit = 100, windowMs = 3600000 } = {}) {
	try {
		const now = Date.now();
		const bucket = Math.floor(now / windowMs);
		const ip = getClientIP(request);
		const name = `rate:${key}:${windowMs}:${bucket}:${ip}`;
		// Use INSERT ... ON CONFLICT ... RETURNING value to atomically increment and read
		const rows = await dbAll(env,
			`INSERT INTO counters (name, value) VALUES (?, 1)
			 ON CONFLICT(name) DO UPDATE SET value = counters.value + 1
			 RETURNING value`,
			[name]
		);
		const value = (rows && rows[0] && (rows[0].value ?? rows[0].VALUE)) || 0;
		return Number(value) > Number(limit);
	} catch (e) {
		// Fallback to in-memory limiter on failure
		const ip = getClientIP(request);
		return isRateLimited(ip, { limit, windowMs });
	}
}

/**
 * Clean expired entries from in-memory caches
 * Should be called periodically to prevent memory buildup
 */
export function cleanupCaches() {
	const now = Date.now();
	const oneHour = 3600000;
	
	// Clean up rate limit cache entries older than 2 hours
	for (const [key] of rateLimitCache.entries()) {
		const parts = key.split(':');
		const window = parseInt(parts[parts.length - 1]);
		if (isNaN(window) || (now - window * oneHour) > (2 * oneHour)) {
			rateLimitCache.delete(key);
		}
	}
	
	// Token cache cleanup is handled by application logic
	// but we can clear very old entries (older than 24 hours)
	for (const [key, entry] of tokenCache.entries()) {
		if (entry && entry.timestamp && (now - entry.timestamp) > (24 * oneHour)) {
			tokenCache.delete(key);
		}
	}
}

// Import placed at end to avoid circular dep
import { withCors } from './cors.js';


