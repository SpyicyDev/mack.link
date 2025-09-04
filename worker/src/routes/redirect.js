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
	// Enforce activation/expiration and archive
	if (link.archived) {
		return new Response('Link not available', { status: 404 });
	}
	if (link.activatesAt) {
		const start = new Date(link.activatesAt).getTime();
		if (!isNaN(start) && Date.now() < start) {
			return new Response('Link not available', { status: 404 });
		}
	}
	if (link.expiresAt) {
		const end = new Date(link.expiresAt).getTime();
		if (!isNaN(end) && Date.now() > end) {
			return new Response('Link expired', { status: 410 });
		}
	}
	// Skip counting for bots, crawlers, and prefetch/HEAD
	const ua = request.headers.get('User-Agent') || '';
	const method = request.method || 'GET';
	const isBot = /(bot|spider|crawler|preview|facebookexternalhit|slackbot|discordbot|twitterbot|linkedinbot|embedly|quora link|whatsapp|skypeuripreview)/i.test(ua);
	const isHead = method === 'HEAD';
	if (!isBot && !isHead) {
		await env.LINKS.put(shortcode, JSON.stringify({
			...link,
			clicks: (link.clicks || 0) + 1,
			lastClicked: new Date().toISOString()
		}));
	}
	requestLogger.info('Link redirected', { shortcode, destination: link.url, redirectType: link.redirectType || 301, previousClicks: link.clicks || 0 });
	return Response.redirect(link.url, link.redirectType || 301);
}


