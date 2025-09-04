import { withCors } from '../cors.js';
import { sanitizeInput, isRateLimited } from '../utils.js';
import { validateShortcode, validateUrl, validateDescription, validateRedirectType, validateTags, validateISODate } from '../validation.js';

export async function getAllLinks(env, request) {
	const links = {};
	const list = await env.LINKS.list();
	for (const key of list.keys) {
		// Skip analytics and any non-link keys (they use colon-delimited prefixes)
		if (key.name.includes(':')) continue;
		const linkData = await env.LINKS.get(key.name);
		if (!linkData) continue;
		try {
			const parsed = JSON.parse(linkData);
			// Ensure parsed object looks like a link (has url)
			if (parsed && typeof parsed === 'object' && 'url' in parsed) {
				links[key.name] = parsed;
			}
		} catch {}
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
		let { shortcode, url, description, redirectType, tags, archived, activatesAt, expiresAt } = body;
		shortcode = sanitizeInput(shortcode);
		url = sanitizeInput(url);
		description = sanitizeInput(description);
		if (Array.isArray(tags)) tags = tags.map(sanitizeInput);
		const shortcodeError = validateShortcode(shortcode);
		if (shortcodeError) return withCors(env, new Response(JSON.stringify({ error: shortcodeError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const urlError = validateUrl(url);
		if (urlError) return withCors(env, new Response(JSON.stringify({ error: urlError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const descriptionError = validateDescription(description);
		if (descriptionError) return withCors(env, new Response(JSON.stringify({ error: descriptionError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const redirectTypeError = validateRedirectType(redirectType);
		if (redirectTypeError) return withCors(env, new Response(JSON.stringify({ error: redirectTypeError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const tagsError = validateTags(tags);
		if (tagsError) return withCors(env, new Response(JSON.stringify({ error: tagsError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const activatesAtError = validateISODate(activatesAt);
		if (activatesAtError) return withCors(env, new Response(JSON.stringify({ error: activatesAtError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const expiresAtError = validateISODate(expiresAt);
		if (expiresAtError) return withCors(env, new Response(JSON.stringify({ error: expiresAtError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const existing = await env.LINKS.get(shortcode);
		if (existing) return withCors(env, new Response(JSON.stringify({ error: 'Shortcode already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } }), request);
		const linkData = {
			url: url.trim(),
			description: description ? description.trim() : '',
			redirectType: redirectType || 301,
			created: new Date().toISOString(),
			updated: new Date().toISOString(),
			clicks: 0,
			tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
			archived: !!archived,
			activatesAt: activatesAt || null,
			expiresAt: expiresAt || null
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
		let { url, description, redirectType, tags, archived, activatesAt, expiresAt } = updates;
		if (url !== undefined) url = sanitizeInput(url);
		if (description !== undefined) description = sanitizeInput(description);
		if (Array.isArray(tags)) tags = tags.map(sanitizeInput);
		const urlError = url !== undefined ? validateUrl(url) : null;
		if (urlError) return withCors(env, new Response(JSON.stringify({ error: urlError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const descriptionError = description !== undefined ? validateDescription(description) : null;
		if (descriptionError) return withCors(env, new Response(JSON.stringify({ error: descriptionError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const redirectTypeError = redirectType !== undefined ? validateRedirectType(redirectType) : null;
		if (redirectTypeError) return withCors(env, new Response(JSON.stringify({ error: redirectTypeError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const tagsError = tags !== undefined ? validateTags(tags) : null;
		if (tagsError) return withCors(env, new Response(JSON.stringify({ error: tagsError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const activatesAtError = activatesAt !== undefined ? validateISODate(activatesAt) : null;
		if (activatesAtError) return withCors(env, new Response(JSON.stringify({ error: activatesAtError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const expiresAtError = expiresAt !== undefined ? validateISODate(expiresAt) : null;
		if (expiresAtError) return withCors(env, new Response(JSON.stringify({ error: expiresAtError }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		const linkData = {
			...currentData,
			...(url !== undefined ? { url: url.trim() } : {}),
			...(description !== undefined ? { description: description ? description.trim() : '' } : {}),
			...(redirectType !== undefined ? { redirectType } : {}),
			...(tags !== undefined ? { tags: Array.isArray(tags) ? tags.filter(Boolean) : [] } : {}),
			...(archived !== undefined ? { archived: !!archived } : {}),
			...(activatesAt !== undefined ? { activatesAt: activatesAt || null } : {}),
			...(expiresAt !== undefined ? { expiresAt: expiresAt || null } : {}),
			updated: new Date().toISOString()
		};
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

export async function bulkCreateLinks(request, env) {
	try {
		const { items } = await request.json();
		if (!Array.isArray(items) || items.length === 0) {
			return withCors(env, new Response(JSON.stringify({ error: 'Items array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		}
		if (items.length > 100) {
			return withCors(env, new Response(JSON.stringify({ error: 'Cannot create more than 100 links at once' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
		}
		const results = { created: [], conflicts: [], errors: [] };
		for (const item of items) {
			try {
				let { shortcode, url, description = '', redirectType = 301 } = item;
				shortcode = sanitizeInput(shortcode);
				url = sanitizeInput(url);
				description = sanitizeInput(description);
				const shortcodeError = validateShortcode(shortcode);
				if (shortcodeError) { results.errors.push({ shortcode, error: shortcodeError }); continue; }
				const urlError = validateUrl(url);
				if (urlError) { results.errors.push({ shortcode, error: urlError }); continue; }
				const descriptionError = validateDescription(description);
				if (descriptionError) { results.errors.push({ shortcode, error: descriptionError }); continue; }
				const redirectTypeError = validateRedirectType(redirectType);
				if (redirectTypeError) { results.errors.push({ shortcode, error: redirectTypeError }); continue; }
				const existing = await env.LINKS.get(shortcode);
				if (existing) { results.conflicts.push(shortcode); continue; }
				const linkData = { url: url.trim(), description: description ? description.trim() : '', redirectType: redirectType || 301, created: new Date().toISOString(), updated: new Date().toISOString(), clicks: 0 };
				await env.LINKS.put(shortcode, JSON.stringify(linkData));
				results.created.push({ shortcode, ...linkData });
			} catch (err) {
				results.errors.push({ shortcode: item?.shortcode, error: err.message });
			}
		}
		return withCors(env, new Response(JSON.stringify(results), { status: 207, headers: { 'Content-Type': 'application/json' } }), request);
	} catch (error) {
		return withCors(env, new Response(JSON.stringify({ error: 'Invalid request data' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
	}
}

export async function listLinks(env, request) {
	const url = new URL(request.url);
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10), 1), 1000);
	const cursor = url.searchParams.get('cursor') || undefined;
	const list = await env.LINKS.list({ limit, cursor });
	const links = {};
	for (const key of list.keys) {
		// Skip analytics and any non-link keys (they use colon-delimited prefixes)
		if (key.name.includes(':')) continue;
		const linkData = await env.LINKS.get(key.name);
		if (!linkData) continue;
		try {
			const parsed = JSON.parse(linkData);
			if (parsed && typeof parsed === 'object' && 'url' in parsed) {
				links[key.name] = parsed;
			}
		} catch {}
	}
	const body = { links, cursor: list.list_complete ? null : list.cursor };
	return withCors(env, new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }), request);
}


