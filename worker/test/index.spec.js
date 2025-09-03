import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Worker basics', () => {
	it('serves default text at root with CORS', async () => {
		const request = new Request('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.MANAGEMENT_ORIGIN);
		expect(await response.text()).toBe('link.mackhaymond.co URL Shortener');
	});

	it('handles preflight with CORS', async () => {
		const request = new Request('http://example.com/api/links', { method: 'OPTIONS' });
		const response = await worker.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.MANAGEMENT_ORIGIN);
	});


	it('redirects to GitHub OAuth on /api/auth/github', async () => {
		const url = `http://example.com/api/auth/github?redirect_uri=${encodeURIComponent('http://localhost:5173/auth/callback')}`;
		const request = new Request(url, { redirect: 'manual' });
		const response = await SELF.fetch(request);
		expect(response.status).toBe(302);
		const location = response.headers.get('Location');
		expect(location).toContain('https://github.com/login/oauth/authorize');
		expect(location).toContain(`client_id=${env.GITHUB_CLIENT_ID}`);
	});

	it('returns 401 for protected endpoint without auth', async () => {
		const response = await SELF.fetch('http://example.com/api/links');
		expect(response.status).toBe(401);
	});

	it('returns 404 for unknown shortcode', async () => {
		const response = await SELF.fetch('http://example.com/does-not-exist');
		expect(response.status).toBe(404);
	});
});
