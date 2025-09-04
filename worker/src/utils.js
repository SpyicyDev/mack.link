import { getConfig } from './config.js';
import { dbAll } from './db.js';

export function sanitizeInput(input) {
	if (typeof input !== 'string') return input;
	return input.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, '');
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

// simple in-memory caches (edge-local)
export const tokenCache = new Map();
export const rateLimitCache = new Map();

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

// Import placed at end to avoid circular dep
import { withCors } from './cors.js';


