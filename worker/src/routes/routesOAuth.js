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
	// Build redirect response manually to allow setting Set-Cookie
	const cookie = `oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=None`;
	const redirectResponse = new Response(null, { status: 302, headers: { 'Location': authUrl.toString(), 'Set-Cookie': cookie } });
	return withCors(env, redirectResponse, request);
}

export async function handleGitHubCallback(request, env) {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code) return withCors(env, new Response('No code provided', { status: 400 }));
	logger.info('OAuth callback processing', { state });
	const config = getConfig(env);
	// Verify OAuth state from cookie
	const cookieHeader = request.headers.get('Cookie') || '';
	const cookies = Object.fromEntries(cookieHeader.split(/;\s*/).filter(Boolean).map(kv => {
		const idx = kv.indexOf('=');
		if (idx === -1) return [kv, ''];
		return [kv.slice(0, idx), kv.slice(idx + 1)];
	}));
	const cookieState = cookies['oauth_state'];
	if (!cookieState || (state && cookieState !== state)) {
		return withCors(env, new Response(JSON.stringify({ error: 'invalid_state', error_description: 'OAuth state mismatch' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
	}
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
		// Create session JWT and set in HttpOnly cookie. Do not expose GitHub token to the client.
		const { createSessionJwt, buildSessionCookie, clearOauthStateCookie } = await import('../session.js');
		const sessionJwt = await createSessionJwt(env, { login: user.login, id: user.id, avatar_url: user.avatar_url, name: user.name });
		const responseBody = { user };
		const response = new Response(JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' } });
		response.headers.append('Set-Cookie', buildSessionCookie(sessionJwt));
		// Clear oauth_state cookie after successful exchange
		response.headers.append('Set-Cookie', clearOauthStateCookie());
		return withCors(env, response, request);
	} catch (error) {
		logger.error('OAuth callback error', { error: error.message });
		return withCors(env, new Response(JSON.stringify({ error: 'oauth_callback_failed', error_description: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
	}
}


