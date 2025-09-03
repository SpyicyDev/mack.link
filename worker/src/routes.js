import { withCors, preflight } from './cors.js';
import { json } from './utils.js';
import { handleRedirect } from './routes/redirect.js';
import { handleAPI } from './routes/routerApi.js';

export async function handleRequest(request, env, requestLogger) {
	const url = new URL(request.url);

	if (request.method === 'OPTIONS') {
		return preflight(env);
	}

	if (url.pathname.startsWith('/api/')) {
		return await handleAPI(request, env, requestLogger);
	}

	const redirectResponse = await handleRedirect(request, env, requestLogger);
	if (redirectResponse) return redirectResponse;
	return withCors(env, new Response('link.mackhaymond.co URL Shortener', { headers: { 'Content-Type': 'text/plain' } }));
}


