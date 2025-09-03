const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyGitHubToken(token) {
	try {
		const response = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `token ${token}`,
				'User-Agent': 'link.mackhaymond.co'
			}
		});
		
		if (!response.ok) {
			return null;
		}
		
		const user = await response.json();
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

async function requireAuth(request) {
	const user = await authenticateRequest(request);
	if (!user) {
		return corsResponse(new Response('Unauthorized', { status: 401 }));
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
	const authResult = await requireAuth(request);
	if (authResult instanceof Response) {
		return authResult; // Return the 401 response
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
		const { shortcode, url, description, redirectType } = await request.json();
		
		if (!shortcode || !url) {
			return corsResponse(new Response('Missing shortcode or url', { status: 400 }));
		}

		const existing = await env.LINKS.get(shortcode);
		if (existing) {
			return corsResponse(new Response('Shortcode already exists', { status: 409 }));
		}

		const linkData = {
			url,
			description: description || '',
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
		return corsResponse(new Response('Invalid JSON', { status: 400 }));
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
