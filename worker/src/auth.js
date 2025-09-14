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
	// Bypass entirely in disabled mode
	const { authDisabled } = getConfig(env);
	if (authDisabled) {
		const { getMockUser } = await import('./config.js');
		return getMockUser(env);
	}
	// Prefer session cookie; fall back to Authorization for backward compatibility
	const cookieHeader = request.headers.get('Cookie') || '';
	const cookies = parseCookies(cookieHeader);
	const { sessionCookieName } = getConfig(env);
	const actualCookieName = sessionCookieName || '__Host-link_session';
	const sessionToken = cookies[actualCookieName];
	
	logger.debug('Authentication attempt', { 
		cookieHeader, 
		expectedCookieName: actualCookieName, 
		hasSessionToken: !!sessionToken,
		parsedCookies: Object.keys(cookies)
	});
	
	if (sessionToken) {
		const user = await verifySessionJwt(env, sessionToken);
		logger.debug('Session JWT verification result', { hasUser: !!user, userLogin: user?.login });
		if (user) return user;
	}
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	const token = authHeader.substring(7);
	return await verifyGitHubToken(env, token);
}

export async function requireAuth(env, request) {
	let user = await authenticateRequest(env, request);
	const { authorizedUser, authDisabled } = getConfig(env);
	if (!user && authDisabled) {
		// Dev bypass: if disabled mode and no session, return mock user so UI can function
		const { getMockUser } = await import('./config.js');
		user = getMockUser(env);
	}
	if (!user) return withCors(env, new Response('Unauthorized', { status: 401 }), request);
	// In auth-disabled dev mode, skip authorizedUser enforcement
	if (!authDisabled && authorizedUser && user.login !== authorizedUser) {
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
	
	// Clear the current configured session cookie
	response.headers.append('Set-Cookie', clearSessionCookie(env));
	
	// Also clear the legacy __Host-link_session cookie for migration purposes
	response.headers.append('Set-Cookie', '__Host-link_session=deleted; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
	
	return withCors(env, response, request);
}


