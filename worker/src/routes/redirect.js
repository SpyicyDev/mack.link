import { logger } from '../logger.js';

export async function handleRedirect(request, env, requestLogger = logger) {
	const url = new URL(request.url);
	const shortcode = url.pathname.slice(1);
	if (!shortcode || shortcode.startsWith('api/')) return null;
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
	requestLogger.info('Link redirected', { shortcode, destination: link.url, redirectType: link.redirectType || 301, previousClicks: link.clicks || 0 });
	return Response.redirect(link.url, link.redirectType || 301);
}


