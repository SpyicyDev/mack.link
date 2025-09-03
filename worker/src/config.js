// Centralized configuration access

export function getConfig(env) {
	return {
		githubClientId: env.GITHUB_CLIENT_ID,
		githubClientSecret: env.GITHUB_CLIENT_SECRET,
		authorizedUser: env.AUTHORIZED_USER,
		managementOrigin: env.MANAGEMENT_ORIGIN || '*',
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


