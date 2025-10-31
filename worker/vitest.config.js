import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersProject({
	test: {
		poolOptions: {
			workers: {
				wrangler: {
					configPath: './wrangler.jsonc',
				},
				miniflare: {
					// Add any bindings needed for testing
					bindings: {
						AUTH_DISABLED: 'true',
						JWT_SECRET: 'test-secret-for-vitest',
						SESSION_ALLOW_INSECURE_COOKIES: 'true',
					},
				},
			},
		},
	},
});

