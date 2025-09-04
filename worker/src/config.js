// Centralized configuration access

export function getConfig(env = {}) {
	return {
		githubClientId: env.GITHUB_CLIENT_ID,
		githubClientSecret: env.GITHUB_CLIENT_SECRET,
		authorizedUser: env.AUTHORIZED_USER,
		managementOrigin: env.MANAGEMENT_ORIGIN || '*',
		jwtSecret: env.JWT_SECRET,
		sessionCookieName: env.SESSION_COOKIE_NAME || '__Host-link_session',
		sessionMaxAgeSeconds: env.SESSION_MAX_AGE || 60 * 60 * 8,
		timeouts: {
			default: 10000,
			jsonParse: 2000,
			github: 8000
		},
		rateLimits: {
			createPerHour: 50
		}
	};
}


