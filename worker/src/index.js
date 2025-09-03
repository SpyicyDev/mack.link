const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Structured Logging System
class Logger {
	constructor() {
		this.requestId = null;
		this.context = {};
	}

	setRequestId(id) {
		this.requestId = id;
		return this;
	}

	setContext(context) {
		this.context = { ...this.context, ...context };
		return this;
	}

	_log(level, message, data = {}) {
		const logEntry = {
			timestamp: new Date().toISOString(),
			level: level.toUpperCase(),
			requestId: this.requestId,
			message,
			context: this.context,
			...data
		};
		
		console.log(JSON.stringify(logEntry));
	}

	debug(message, data) {
		this._log('debug', message, data);
	}

	info(message, data) {
		this._log('info', message, data);
	}

	warn(message, data) {
		this._log('warn', message, data);
	}

	error(message, data) {
		this._log('error', message, data);
	}

	// Create a new logger instance for a request
	forRequest(request) {
		const requestId = crypto.randomUUID();
		const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
		const userAgent = request.headers.get('User-Agent') || 'unknown';
		
		return new Logger()
			.setRequestId(requestId)
			.setContext({
				method: request.method,
				url: request.url,
				clientIP,
				userAgent: userAgent.substring(0, 100) // Truncate long user agents
			});
	}
}

const logger = new Logger();

// Request timeout utility
function withTimeout(promise, timeoutMs = 10000, timeoutMessage = 'Operation timed out') {
	return Promise.race([
		promise,
		new Promise((_, reject) => 
			setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
		)
	]);
}

// Exponential backoff utility for retries
async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation(attempt);
		} catch (error) {
			if (attempt === maxRetries) {
				throw error;
			}
			
			const delay = baseDelay * Math.pow(2, attempt - 1);
			logger.warn('Retry attempt failed, waiting before retry', { 
				attempt, 
				maxRetries, 
				delay: `${delay}ms`, 
				error: error.message 
			});
			
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
}

// Validation utilities
function validateShortcode(shortcode) {
	if (typeof shortcode !== 'string') return 'Shortcode must be a string';
	if (!shortcode.trim()) return 'Shortcode is required';
	if (shortcode.length < 2) return 'Shortcode must be at least 2 characters';
	if (shortcode.length > 50) return 'Shortcode must be less than 50 characters';
	if (!/^[a-zA-Z0-9_-]+$/.test(shortcode)) {
		return 'Shortcode can only contain letters, numbers, hyphens, and underscores';
	}
	// Reserved words that shouldn't be used as shortcodes
	const reserved = ['api', 'admin', 'www', 'mail', 'ftp', 'localhost', 'root'];
	if (reserved.includes(shortcode.toLowerCase())) {
		return 'This shortcode is reserved and cannot be used';
	}
	return null;
}

function validateUrl(url) {
	if (typeof url !== 'string') return 'URL must be a string';
	if (!url.trim()) return 'URL is required';
	if (url.length > 2048) return 'URL must be less than 2048 characters';
	if (!/^https?:\/\/.+/.test(url)) {
		return 'URL must start with http:// or https://';
	}
	try {
		new URL(url);
	} catch {
		return 'Invalid URL format';
	}
	return null;
}

function validateDescription(description) {
	if (description !== undefined && description !== null) {
		if (typeof description !== 'string') return 'Description must be a string';
		if (description.length > 500) return 'Description must be less than 500 characters';
	}
	return null;
}

function validateRedirectType(redirectType) {
	if (redirectType !== undefined && redirectType !== null) {
		if (typeof redirectType !== 'number') return 'Redirect type must be a number';
		if (![301, 302, 307, 308].includes(redirectType)) {
			return 'Redirect type must be 301, 302, 307, or 308';
		}
	}
	return null;
}

function sanitizeInput(input) {
	if (typeof input !== 'string') return input;
	return input.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, '');
}

// Rate limiting utilities
const rateLimitCache = new Map();

function isRateLimited(ip, limit = 100, window = 3600000) { // 100 requests per hour
	const now = Date.now();
	const key = `${ip}-${Math.floor(now / window)}`;
	const current = rateLimitCache.get(key) || 0;
	
	if (current >= limit) {
		return true;
	}
	
	rateLimitCache.set(key, current + 1);
	
	// Clean up old entries
	if (rateLimitCache.size > 1000) {
		const cutoff = now - window;
		for (const [k] of rateLimitCache) {
			if (parseInt(k.split('-')[1]) * window < cutoff) {
				rateLimitCache.delete(k);
			}
		}
	}
	
	return false;
}

// Token verification cache
const tokenCache = new Map();

// CSRF state management
const stateCache = new Map();

function generateStateToken() {
	return crypto.randomUUID();
}

function storeState(state, data = {}) {
	stateCache.set(state, {
		...data,
		timestamp: Date.now()
	});
	
	// Clean up old states (older than 10 minutes)
	if (stateCache.size > 100) {
		const cutoff = Date.now() - 600000; // 10 minutes
		for (const [key, value] of stateCache) {
			if (value.timestamp < cutoff) {
				stateCache.delete(key);
			}
		}
	}
}

function validateAndConsumeState(state) {
	const stateData = stateCache.get(state);
	if (!stateData) {
		return null;
	}
	
	// Remove the state after use (one-time use)
	stateCache.delete(state);
	
	// Check if state is expired (10 minutes)
	if (Date.now() - stateData.timestamp > 600000) {
		return null;
	}
	
	return stateData;
}

async function verifyGitHubToken(token) {
	// Check cache first (5 minute cache)
	const cached = tokenCache.get(token);
	if (cached && Date.now() - cached.timestamp < 300000) {
		return cached.user;
	}

	try {
		const user = await retryWithBackoff(async (attempt) => {
			logger.debug('GitHub token verification attempt', { attempt, token: token.substring(0, 8) + '...' });
			
			const response = await withTimeout(
				fetch('https://api.github.com/user', {
					headers: {
						'Authorization': `token ${token}`,
						'User-Agent': 'link.mackhaymond.co'
					}
				}),
				8000, // 8 second timeout
				'GitHub API token verification timed out'
			);
			
			if (!response.ok) {
				if (response.status === 401 || response.status === 403) {
					// Don't retry auth failures
					tokenCache.delete(token);
					return null;
				}
				throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
			}
			
			return await withTimeout(
				response.json(),
				2000, // 2 second timeout for JSON parsing
				'GitHub API response parsing timed out'
			);
		});

		if (!user) {
			return null; // Auth failure
		}
		
		// Cache the result
		tokenCache.set(token, {
			user,
			timestamp: Date.now()
		});

		// Clean up cache if it gets too large
		if (tokenCache.size > 100) {
			const now = Date.now();
			for (const [key, value] of tokenCache) {
				if (now - value.timestamp > 300000) {
					tokenCache.delete(key);
				}
			}
		}
		
		return user;
	} catch (error) {
		logger.error('GitHub token verification failed', { 
			error: error.message,
			stack: error.stack?.substring(0, 500)
		});
		return null;
	}
}

async function authenticateRequest(request) {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	
	const token = authHeader.substring(7);
	return await verifyGitHubToken(token);
}

async function requireAuth(request, env) {
	const user = await authenticateRequest(request);
	if (!user) {
		return corsResponse(new Response('Unauthorized', { status: 401 }));
	}
	
	// Check if user is authorized
	if (env.AUTHORIZED_USER && user.login !== env.AUTHORIZED_USER) {
		return corsResponse(new Response('Forbidden: Access denied', { status: 403 }));
	}
	
	return user;
}

function corsResponse(response) {
	const newResponse = new Response(response.body, response);
	Object.keys(CORS_HEADERS).forEach(key => {
		newResponse.headers.set(key, CORS_HEADERS[key]);
	});
	return newResponse;
}

async function handleRedirect(request, env, requestLogger = logger) {
	const url = new URL(request.url);
	const shortcode = url.pathname.slice(1);

	if (!shortcode || shortcode.startsWith('api/')) {
		return null;
	}

	const linkData = await env.LINKS.get(shortcode);
	if (!linkData) {
		requestLogger.info('Link not found', { shortcode });
		return new Response('Link not found', { status: 404 });
	}

	const link = JSON.parse(linkData);
	
	await env.LINKS.put(shortcode, JSON.stringify({
		...link,
		clicks: (link.clicks || 0) + 1,
		lastClicked: new Date().toISOString()
	}));

	requestLogger.info('Link redirected', { 
		shortcode, 
		destination: link.url, 
		redirectType: link.redirectType || 301,
		previousClicks: link.clicks || 0
	});

	return Response.redirect(link.url, link.redirectType || 301);
}

async function handleAPI(request, env, requestLogger = logger) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	if (method === 'OPTIONS') {
		return corsResponse(new Response(null, { status: 200 }));
	}

	// OAuth endpoints - no auth required
	if (path === '/api/auth/github') {
		return await handleGitHubAuth(request, env);
	}
	
	if (path === '/api/auth/callback') {
		return await handleGitHubCallback(request, env);
	}

	// Protected endpoints - auth required
	const authResult = await requireAuth(request, env);
	if (authResult instanceof Response) {
		return authResult; // Return the 401/403 response
	}

	if (path === '/api/links') {
		if (method === 'GET') {
			return await getAllLinks(env);
		}
		if (method === 'POST') {
			return await createLink(request, env);
		}
	}

	if (path.startsWith('/api/links/')) {
		const shortcode = path.split('/')[3];
		if (method === 'PUT') {
			return await updateLink(request, env, shortcode);
		}
		if (method === 'DELETE') {
			return await deleteLink(env, shortcode);
		}
		if (method === 'GET') {
			return await getLink(env, shortcode);
		}
	}

	if (path === '/api/user') {
		return corsResponse(new Response(JSON.stringify(authResult), {
			headers: { 'Content-Type': 'application/json' }
		}));
	}

	return corsResponse(new Response('API endpoint not found', { status: 404 }));
}

async function getAllLinks(env) {
	const links = {};
	const list = await env.LINKS.list();
	
	for (const key of list.keys) {
		const linkData = await env.LINKS.get(key.name);
		if (linkData) {
			links[key.name] = JSON.parse(linkData);
		}
	}

	return corsResponse(new Response(JSON.stringify(links), {
		headers: { 'Content-Type': 'application/json' }
	}));
}

async function createLink(request, env) {
	try {
		// Rate limiting check
		const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
		if (isRateLimited(clientIP, 50)) { // 50 creates per hour for authenticated users
			return corsResponse(new Response('Rate limit exceeded', { status: 429 }));
		}

		const body = await request.json();
		let { shortcode, url, description, redirectType } = body;

		// Sanitize inputs
		shortcode = sanitizeInput(shortcode);
		url = sanitizeInput(url);
		description = sanitizeInput(description);

		// Validate all inputs
		const shortcodeError = validateShortcode(shortcode);
		if (shortcodeError) {
			return corsResponse(new Response(JSON.stringify({ error: shortcodeError }), { 
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		const urlError = validateUrl(url);
		if (urlError) {
			return corsResponse(new Response(JSON.stringify({ error: urlError }), { 
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		const descriptionError = validateDescription(description);
		if (descriptionError) {
			return corsResponse(new Response(JSON.stringify({ error: descriptionError }), { 
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		const redirectTypeError = validateRedirectType(redirectType);
		if (redirectTypeError) {
			return corsResponse(new Response(JSON.stringify({ error: redirectTypeError }), { 
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		// Check if shortcode already exists
		const existing = await env.LINKS.get(shortcode);
		if (existing) {
			return corsResponse(new Response(JSON.stringify({ error: 'Shortcode already exists' }), { 
				status: 409,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		// Create the link data
		const linkData = {
			url: url.trim(),
			description: description ? description.trim() : '',
			redirectType: redirectType || 301,
			created: new Date().toISOString(),
			updated: new Date().toISOString(),
			clicks: 0
		};

		await env.LINKS.put(shortcode, JSON.stringify(linkData));

		return corsResponse(new Response(JSON.stringify({ shortcode, ...linkData }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		}));
	} catch (error) {
		logger.error('Create link error', { 
			error: error.message,
			stack: error.stack?.substring(0, 500)
		});
		return corsResponse(new Response(JSON.stringify({ error: 'Invalid request data' }), { 
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		}));
	}
}

async function updateLink(request, env, shortcode) {
	try {
		const existing = await env.LINKS.get(shortcode);
		if (!existing) {
			return corsResponse(new Response('Link not found', { status: 404 }));
		}

		const currentData = JSON.parse(existing);
		const updates = await request.json();

		const linkData = {
			...currentData,
			...updates,
			updated: new Date().toISOString()
		};

		await env.LINKS.put(shortcode, JSON.stringify(linkData));

		return corsResponse(new Response(JSON.stringify({ shortcode, ...linkData }), {
			headers: { 'Content-Type': 'application/json' }
		}));
	} catch (error) {
		return corsResponse(new Response('Invalid JSON', { status: 400 }));
	}
}

async function deleteLink(env, shortcode) {
	const existing = await env.LINKS.get(shortcode);
	if (!existing) {
		return corsResponse(new Response('Link not found', { status: 404 }));
	}

	await env.LINKS.delete(shortcode);
	return corsResponse(new Response(null, { status: 204 }));
}

async function getLink(env, shortcode) {
	const linkData = await env.LINKS.get(shortcode);
	if (!linkData) {
		return corsResponse(new Response('Link not found', { status: 404 }));
	}

	return corsResponse(new Response(linkData, {
		headers: { 'Content-Type': 'application/json' }
	}));
}

async function handleGitHubAuth(request, env) {
	const url = new URL(request.url);
	const redirectUri = url.searchParams.get('redirect_uri') || 'http://localhost:5173/auth/callback';
	
	const state = generateStateToken();
	storeState(state, {
		redirectUri,
		userAgent: request.headers.get('User-Agent')?.substring(0, 100),
		clientIP: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
	});
	
	const authUrl = new URL('https://github.com/login/oauth/authorize');
	authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('scope', 'user:email');
	authUrl.searchParams.set('state', state);

	logger.info('OAuth flow initiated', { state, redirectUri });

	return corsResponse(Response.redirect(authUrl.toString(), 302));
}

async function handleGitHubCallback(request, env) {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	
	if (!code) {
		logger.warn('OAuth callback missing code');
		return corsResponse(new Response('No code provided', { status: 400 }));
	}

	if (!state) {
		logger.warn('OAuth callback missing state parameter');
		return corsResponse(new Response('No state parameter provided', { status: 400 }));
	}

	// Validate CSRF state
	const stateData = validateAndConsumeState(state);
	if (!stateData) {
		logger.warn('OAuth callback invalid or expired state', { state });
		return corsResponse(new Response('Invalid or expired state parameter', { status: 400 }));
	}

	// Optional: Additional validation against request context
	const currentIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
	if (stateData.clientIP !== currentIP) {
		logger.warn('OAuth callback IP mismatch', { 
			storedIP: stateData.clientIP, 
			currentIP,
			state
		});
		// Note: This is logged but not blocked as IPs can change legitimately
	}

	logger.info('OAuth callback state validated', { state });

	try {
		// Exchange code for access token
		const tokenData = await retryWithBackoff(async (attempt) => {
			logger.debug('OAuth token exchange attempt', { attempt });
			
			const tokenResponse = await withTimeout(
				fetch('https://github.com/login/oauth/access_token', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						client_id: env.GITHUB_CLIENT_ID,
						client_secret: env.GITHUB_CLIENT_SECRET,
						code: code,
					})
				}),
				8000,
				'GitHub OAuth token exchange timed out'
			);

			if (!tokenResponse.ok) {
				throw new Error(`GitHub OAuth token exchange failed: ${tokenResponse.status}`);
			}

			const data = await withTimeout(
				tokenResponse.json(),
				2000,
				'GitHub OAuth token response parsing timed out'
			);
			
			if (data.error) {
				throw new Error(`OAuth error: ${data.error_description || data.error}`);
			}

			return data;
		});

		// Get user info with retry
		const user = await retryWithBackoff(async (attempt) => {
			logger.debug('OAuth user info fetch attempt', { attempt });
			
			const userResponse = await withTimeout(
				fetch('https://api.github.com/user', {
					headers: {
						'Authorization': `token ${tokenData.access_token}`,
						'User-Agent': 'link.mackhaymond.co'
					}
				}),
				8000,
				'GitHub user info fetch timed out'
			);

			if (!userResponse.ok) {
				throw new Error(`GitHub user fetch failed: ${userResponse.status}`);
			}

			return await withTimeout(
				userResponse.json(),
				2000,
				'GitHub user info response parsing timed out'
			);
		});

		// Check if user is authorized
		if (env.AUTHORIZED_USER && user.login !== env.AUTHORIZED_USER) {
			return corsResponse(new Response(JSON.stringify({
				error: 'access_denied',
				error_description: `Access denied. Only ${env.AUTHORIZED_USER} is authorized to use this service.`
			}), { 
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			}));
		}

		return corsResponse(new Response(JSON.stringify({
			access_token: tokenData.access_token,
			user: user
		}), {
			headers: { 'Content-Type': 'application/json' }
		}));

	} catch (error) {
		logger.error('OAuth callback error', { 
			error: error.message,
			stack: error.stack?.substring(0, 500)
		});
		return corsResponse(new Response('OAuth callback failed', { status: 500 }));
	}
}

export default {
	async fetch(request, env, ctx) {
		const requestLogger = logger.forRequest(request);
		const startTime = Date.now();
		
		try {
			requestLogger.info('Request started');
			
			const url = new URL(request.url);

			let response;
			if (url.pathname.startsWith('/api/')) {
				response = await handleAPI(request, env, requestLogger);
			} else {
				const redirectResponse = await handleRedirect(request, env, requestLogger);
				if (redirectResponse) {
					response = redirectResponse;
				} else {
					response = new Response('link.mackhaymond.co URL Shortener', {
						headers: { 'Content-Type': 'text/plain' }
					});
				}
			}

			const duration = Date.now() - startTime;
			requestLogger.info('Request completed', { 
				statusCode: response.status,
				duration: `${duration}ms`
			});

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			requestLogger.error('Request failed', { 
				error: error.message,
				stack: error.stack?.substring(0, 500),
				duration: `${duration}ms`
			});
			
			return corsResponse(new Response('Internal Server Error', { status: 500 }));
		}
	},
};
