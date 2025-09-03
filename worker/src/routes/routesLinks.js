import { withCors } from '../cors.js';
import { sanitizeInput, isRateLimited } from '../utils.js';
import { validateShortcode, validateUrl, validateDescription, validateRedirectType } from '../validation.js';

export async function getAllLinks(env, request) {
	const links = {};
	const list = await env.LINKS.list();
	for (const key of list.keys) {
		const linkData = await env.LINKS.get(key.name);
		if (linkData) links[key.name] = JSON.parse(linkData);
	}
	return withCors(env, new Response(JSON.stringify(links), { headers: { 'Content-Type': 'application/json' } }), request);
}

export async function createLink(request, env) {
	try {
		const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
		if (isRateLimited(clientIP, { limit: 50, windowMs: 3600000 })) {
			return withCors(env, new Response('Rate limit exceeded', { status: 429 }), request);
		}
		const body = await request.json();
		let { shortcode, url, description, redirectType } = body;
		shortcode = sanitizeInput(shortcode);
		url = sanitizeInput(url);
		description = sanitizeInput(description);
		const shortcodeError = validateShortcode(shortcode);
		if (shortcodeError) return withCors(env, new Response(JSON.stringify({ error: shortcodeError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const urlError = validateUrl(url);
		if (urlError) return withCors(env, new Response(JSON.stringify({ error: urlError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const descriptionError = validateDescription(description);
		if (descriptionError) return withCors(env, new Response(JSON.stringify({ error: descriptionError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const redirectTypeError = validateRedirectType(redirectType);
		if (redirectTypeError) return withCors(env, new Response(JSON.stringify({ error: redirectTypeError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const existing = await env.LINKS.get(shortcode);
		if (existing) return withCors(env, new Response(JSON.stringify({ error: 'Shortcode already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } }), request);
		const linkData = {
			url: url.trim(),
			description: description ? description.trim() : '',
			redirectType: redirectType || 301,
			created: new Date().toISOString(),
			updated: new Date().toISOString(),
			clicks: 0
		};
		await env.LINKS.put(shortcode, JSON.stringify(linkData));
		return withCors(env, new Response(JSON.stringify({ shortcode, ...linkData }), { status: 201, headers: { 'Content-Type': 'application/json' } }), request);
	} catch (error) {
		return withCors(env, new Response(JSON.stringify({ error: 'Invalid request data' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
	}
}

export async function updateLink(request, env, shortcode) {
	try {
		const existing = await env.LINKS.get(shortcode);
		if (!existing) return withCors(env, new Response('Link not found', { status: 404 }), request);
		const currentData = JSON.parse(existing);
		const updates = await request.json();
		const linkData = { ...currentData, ...updates, updated: new Date().toISOString() };
		await env.LINKS.put(shortcode, JSON.stringify(linkData));
		return withCors(env, new Response(JSON.stringify({ shortcode, ...linkData }), { headers: { 'Content-Type': 'application/json' } }), request);
	} catch (error) {
		return withCors(env, new Response('Invalid JSON', { status: 400 }), request);
	}
}

export async function deleteLink(env, shortcode, request) {
	const existing = await env.LINKS.get(shortcode);
	if (!existing) return withCors(env, new Response('Link not found', { status: 404 }), request);
	await env.LINKS.delete(shortcode);
	return withCors(env, new Response(null, { status: 204 }), request);
}

export async function bulkDeleteLinks(request, env) {
	try {
		const { shortcodes } = await request.json();
		if (!Array.isArray(shortcodes) || shortcodes.length === 0) {
			return withCors(env, new Response(JSON.stringify({ error: 'Shortcodes array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		}
		if (shortcodes.length > 100) {
			return withCors(env, new Response(JSON.stringify({ error: 'Cannot delete more than 100 links at once' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		}
		for (const sc of shortcodes) {
			const error = validateShortcode(sc);
			if (error) {
				return withCors(env, new Response(JSON.stringify({ error: `Invalid shortcode \"${sc}\": ${error}` }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
			}
		}
		const results = { deleted: [], notFound: [], errors: [] };
		for (const sc of shortcodes) {
			try {
				const existing = await env.LINKS.get(sc);
				if (!existing) { results.notFound.push(sc); continue; }
				await env.LINKS.delete(sc);
				results.deleted.push(sc);
			} catch (error) {
				results.errors.push({ shortcode: sc, error: error.message });
			}
		}
		return withCors(env, new Response(JSON.stringify({ message: `Bulk delete completed: ${results.deleted.length} deleted, ${results.notFound.length} not found, ${results.errors.length} errors`, results }), { headers: { 'Content-Type': 'application/json' } }), request);
	} catch (error) {
		return withCors(env, new Response(JSON.stringify({ error: 'Invalid request data' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
	}
}

export async function getLink(env, shortcode, request) {
	const linkData = await env.LINKS.get(shortcode);
	if (!linkData) return withCors(env, new Response('Link not found', { status: 404 }), request);
	return withCors(env, new Response(linkData, { headers: { 'Content-Type': 'application/json' } }), request);
}


