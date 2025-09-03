import { getConfig } from '../config.js';
import { withCors } from '../cors.js';
import { generateStateToken } from '../auth.js';
import { withTimeout, retryWithBackoff } from '../utils.js';
import { logger } from '../logger.js';

export async function handleGitHubAuth(request, env) {
	const url = new URL(request.url);
	const redirectUri = url.searchParams.get('redirect_uri') || 'http://localhost:5173/auth/callback';
	const state = generateStateToken();
	const config = getConfig(env);
	const authUrl = new URL('https://github.com/login/oauth/authorize');
	authUrl.searchParams.set('client_id', config.githubClientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('scope', 'user:email');
	authUrl.searchParams.set('state', state);
	logger.info('OAuth flow initiated', { state, redirectUri });
	return withCors(env, Response.redirect(authUrl.toString(), 302), request);
}

export async function handleGitHubCallback(request, env) {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code) return withCors(env, new Response('No code provided', { status: 400 }));
	logger.info('OAuth callback processing', { state });
	const config = getConfig(env);
	try {
		const tokenData = await retryWithBackoff(async (attempt) => {
			const tokenResponse = await withTimeout(
				fetch('https://github.com/login/oauth/access_token', {
					method: 'POST',
					headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({ client_id: config.githubClientId, client_secret: config.githubClientSecret, code })
				}),
				env,
				config.timeouts.github,
				'GitHub OAuth token exchange timed out'
			);
			if (!tokenResponse.ok) throw new Error(`GitHub OAuth token exchange failed: ${tokenResponse.status}`);
			const data = await withTimeout(tokenResponse.json(), env, config.timeouts.jsonParse, 'GitHub OAuth token response parsing timed out');
			if (data.error) throw new Error(`OAuth error: ${data.error_description || data.error}`);
			return data;
		});
		const user = await retryWithBackoff(async (attempt) => {
			const userResponse = await withTimeout(
				fetch('https://api.github.com/user', { headers: { 'Authorization': `token ${tokenData.access_token}`, 'User-Agent': 'link.mackhaymond.co' } }),
				env,
				config.timeouts.github,
				'GitHub user info fetch timed out'
			);
			if (!userResponse.ok) throw new Error(`GitHub user fetch failed: ${userResponse.status}`);
			return await withTimeout(userResponse.json(), env, config.timeouts.jsonParse, 'GitHub user info response parsing timed out');
		});
		if (config.authorizedUser && user.login !== config.authorizedUser) {
			return withCors(env, new Response(JSON.stringify({ error: 'access_denied', error_description: `Access denied. Only ${config.authorizedUser} is authorized to use this service.` }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
		}
		return withCors(env, new Response(JSON.stringify({ access_token: tokenData.access_token, user }), { headers: { 'Content-Type': 'application/json' } }), request);
	} catch (error) {
		logger.error('OAuth callback error', { error: error.message });
		return withCors(env, new Response('OAuth callback failed', { status: 500 }), request);
	}
}


