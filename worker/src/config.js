// Centralized configuration access

export function getConfig(env = {}) {
	return {
		githubClientId: env.GITHUB_CLIENT_ID,
		githubClientSecret: env.GITHUB_CLIENT_SECRET,
		authorizedUser: env.AUTHORIZED_USER,
		jwtSecret: env.JWT_SECRET,
		sessionCookieName: env.SESSION_COOKIE_NAME || '__Host-link_session',
		sessionMaxAgeSeconds: env.SESSION_MAX_AGE || 60 * 60 * 8,
		// Development-only override to disable OAuth and simulate a logged-in user
		authDisabled: String(env.AUTH_DISABLED || '').toLowerCase() === 'true',
		// Allow insecure cookies (no Secure, SameSite=Lax) in local dev; auto-enabled when authDisabled
		allowInsecureCookies: String(env.SESSION_ALLOW_INSECURE_COOKIES || '').toLowerCase() === 'true' || String(env.AUTH_DISABLED || '').toLowerCase() === 'true',
		// Optional mock user overrides for disabled auth mode
		authDisabledUserLogin: env.AUTH_DISABLED_USER_LOGIN,
		authDisabledUserName: env.AUTH_DISABLED_USER_NAME,
		authDisabledUserAvatarUrl: env.AUTH_DISABLED_USER_AVATAR_URL,
		timeouts: {
			default: 10000,
			jsonParse: 2000,
			github: 8000,
		},
		rateLimits: {
			createPerHour: 50,
			updatePerHour: 200,
			deletePerHour: 200,
			bulkCreatePerHour: 50,
			bulkDeletePerHour: 50,
			windowMs: 60 * 60 * 1000,
		},
	};
}

// Helper to produce a mock user for auth-disabled mode
export function getMockUser(env = {}) {
	const cfg = getConfig(env);
	return {
		login: cfg.authDisabledUserLogin || 'ai-dev',
		id: 0,
		name: cfg.authDisabledUserName || 'AI Developer',
		avatar_url: cfg.authDisabledUserAvatarUrl || 'https://avatars.githubusercontent.com/u/0?v=4',
	};
}
