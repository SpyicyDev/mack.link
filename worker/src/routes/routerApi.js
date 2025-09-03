import { requireAuth } from '../auth.js';
import { withCors } from '../cors.js';
import { getAllLinks, createLink, updateLink, deleteLink, bulkDeleteLinks, getLink } from './routesLinks.js';
import { handleGitHubAuth, handleGitHubCallback } from './routesOAuth.js';

export async function handleAPI(request, env, requestLogger) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// OAuth endpoints - no auth required
	if (path === '/api/auth/github') {
		return await handleGitHubAuth(request, env);
	}
	if (path === '/api/auth/callback') {
		return await handleGitHubCallback(request, env);
	}

	// Protected endpoints - auth required
	const authResult = await requireAuth(env, request);
	if (authResult instanceof Response) return authResult;

	if (path === '/api/links') {
		if (method === 'GET') return await getAllLinks(env);
		if (method === 'POST') return await createLink(request, env);
	}

	if (path === '/api/links/bulk') {
		if (method === 'DELETE') return await bulkDeleteLinks(request, env);
	}

	if (path.startsWith('/api/links/')) {
		const shortcode = path.split('/')[3];
		if (method === 'PUT') return await updateLink(request, env, shortcode);
		if (method === 'DELETE') return await deleteLink(env, shortcode);
		if (method === 'GET') return await getLink(env, shortcode);
	}

	if (path === '/api/user') {
		return withCors(env, new Response(JSON.stringify(authResult), { headers: { 'Content-Type': 'application/json' } }));
	}

	return withCors(env, new Response('API endpoint not found', { status: 404 }));
}


