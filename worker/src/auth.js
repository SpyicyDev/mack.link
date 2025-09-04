import { getConfig } from './config.js';
import { withTimeout, retryWithBackoff, tokenCache } from './utils.js';
import { withCors } from './cors.js';
import { logger } from './logger.js';
import { parseCookies, verifySessionJwt } from './session.js';

export async function verifyGitHubToken(env, token) {
	const cached = tokenCache.get(token);
	if (cached && Date.now() - cached.timestamp < 300000) {
		return cached.user;
	}

	const config = getConfig(env);
	try {
		const user = await retryWithBackoff(async (attempt) => {
			logger.debug('GitHub token verification attempt', { attempt });
			const response = await withTimeout(
				fetch('https://api.github.com/user', {
					headers: {
						'Authorization': `token ${token}`,
						'User-Agent': 'link.mackhaymond.co'
					}
				}),
				env,
				config.timeouts.github,
				'GitHub API token verification timed out'
			);
			if (!response.ok) {
				if (response.status === 401 || response.status === 403) {
					tokenCache.delete(token);
					return null;
				}
				throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
			}
			return await withTimeout(response.json(), env, config.timeouts.jsonParse, 'GitHub API response parsing timed out');
		});
		if (!user) return null;
		tokenCache.set(token, { user, timestamp: Date.now() });
		return user;
	} catch (error) {
		logger.error('GitHub token verification failed', { error: error.message });
		return null;
	}
}

export async function authenticateRequest(env, request) {
	// Prefer session cookie; fall back to Authorization for backward compatibility
	const cookieHeader = request.headers.get('Cookie') || '';
	const cookies = parseCookies(cookieHeader);
	const { sessionCookieName } = getConfig(env);
	const sessionToken = cookies[sessionCookieName || '__Host-link_session'];
	if (sessionToken) {
		const user = await verifySessionJwt(env, sessionToken);
		if (user) return user;
	}
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	const token = authHeader.substring(7);
	return await verifyGitHubToken(env, token);
}

export async function requireAuth(env, request) {
	const user = await authenticateRequest(env, request);
	if (!user) return withCors(env, new Response('Unauthorized', { status: 401 }), request);
	const { authorizedUser } = getConfig(env);
	if (authorizedUser && user.login !== authorizedUser) {
		return withCors(env, new Response('Forbidden: Access denied', { status: 403 }), request);
	}
	return user;
}

export function generateStateToken() {
	return crypto.randomUUID();
}

export async function handleLogout(env, request) {
	const response = new Response(null, { status: 204 });
	const { clearSessionCookie } = await import('./session.js');
	response.headers.append('Set-Cookie', clearSessionCookie(env));
	return withCors(env, response, request);
}


