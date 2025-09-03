const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
