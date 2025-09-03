import { getConfig } from './config.js';
import { withTimeout, retryWithBackoff, tokenCache } from './utils.js';
import { withCors } from './cors.js';
import { logger } from './logger.js';

export async function verifyGitHubToken(env, token) {
	const cached = tokenCache.get(token);
	if (cached && Date.now() - cached.timestamp < 300000) {
		return cached.user;
	}

	const config = getConfig(env);
	try {
		const user = await retryWithBackoff(async (attempt) => {
			logger.debug('GitHub token verification attempt', { attempt, token: token.substring(0, 8) + '...' });
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
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	const token = authHeader.substring(7);
	return await verifyGitHubToken(env, token);
}

export async function requireAuth(env, request) {
	const user = await authenticateRequest(env, request);
	if (!user) return withCors(env, new Response('Unauthorized', { status: 401 }));
	const { authorizedUser } = getConfig(env);
	if (authorizedUser && user.login !== authorizedUser) {
		return withCors(env, new Response('Forbidden: Access denied', { status: 403 }));
	}
	return user;
}

export function generateStateToken() {
	return crypto.randomUUID();
}


