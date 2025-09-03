const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

async function verifyGitHubToken(token) {
	// Check cache first (5 minute cache)
	const cached = tokenCache.get(token);
	if (cached && Date.now() - cached.timestamp < 300000) {
		return cached.user;
	}

	try {
		const response = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `token ${token}`,
				'User-Agent': 'link.mackhaymond.co'
			}
		});
		
		if (!response.ok) {
			// Remove from cache if token is invalid
			tokenCache.delete(token);
			return null;
		}
		
		const user = await response.json();
		
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
		console.error('GitHub token verification failed:', error);
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

async function handleRedirect(request, env) {
	const url = new URL(request.url);
	const shortcode = url.pathname.slice(1);

	if (!shortcode || shortcode.startsWith('api/')) {
		return null;
	}

	const linkData = await env.LINKS.get(shortcode);
	if (!linkData) {
		return new Response('Link not found', { status: 404 });
	}

	const link = JSON.parse(linkData);
	
	await env.LINKS.put(shortcode, JSON.stringify({
		...link,
		clicks: (link.clicks || 0) + 1,
		lastClicked: new Date().toISOString()
	}));

	return Response.redirect(link.url, link.redirectType || 301);
}

async function handleAPI(request, env) {
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
		console.error('Create link error:', error);
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
	
	const authUrl = new URL('https://github.com/login/oauth/authorize');
	authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('scope', 'user:email');
	authUrl.searchParams.set('state', crypto.randomUUID());

	return corsResponse(Response.redirect(authUrl.toString(), 302));
}

async function handleGitHubCallback(request, env) {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	
	if (!code) {
		return corsResponse(new Response('No code provided', { status: 400 }));
	}

	try {
		// Exchange code for access token
		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
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
		});

		const tokenData = await tokenResponse.json();
		
		if (tokenData.error) {
			return corsResponse(new Response(JSON.stringify(tokenData), { status: 400 }));
		}

		// Get user info
		const userResponse = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `token ${tokenData.access_token}`,
				'User-Agent': 'link.mackhaymond.co'
			}
		});

		const user = await userResponse.json();

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
		console.error('OAuth callback error:', error);
		return corsResponse(new Response('OAuth callback failed', { status: 500 }));
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/api/')) {
			return await handleAPI(request, env);
		}

		const redirectResponse = await handleRedirect(request, env);
		if (redirectResponse) {
			return redirectResponse;
		}

		return new Response('link.mackhaymond.co URL Shortener', {
			headers: { 'Content-Type': 'text/plain' }
		});
	},
};
