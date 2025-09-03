import { getConfig } from './config.js';

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

export function isRateLimited(ip, { limit = 100, windowMs = 3600000 } = {}) {
	const now = Date.now();
	const key = `${ip}-${Math.floor(now / windowMs)}`;
	const current = rateLimitCache.get(key) || 0;
	if (current >= limit) return true;
	rateLimitCache.set(key, current + 1);
	// opportunistic cleanup
	if (rateLimitCache.size > 1000) {
		const cutoff = now - windowMs;
		for (const [k] of rateLimitCache) {
			const tsBucket = parseInt(k.split('-')[1]);
			if (tsBucket * windowMs < cutoff) rateLimitCache.delete(k);
		}
	}
	return false;
}

// Import placed at end to avoid circular dep
import { withCors } from './cors.js';


