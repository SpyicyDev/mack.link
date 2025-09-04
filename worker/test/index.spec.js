import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Worker basics', () => {
	it('serves home page with admin sign-in button', async () => {
		const request = new Request('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Sign in to Admin');
		expect(html).toContain('href="/admin"');
	});

	it('handles preflight with CORS for API', async () => {
		const request = new Request('http://example.com/api/links', { method: 'OPTIONS' });
		const response = await worker.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
	});


	it('redirects to GitHub OAuth on /api/auth/github', async () => {
		const url = `http://example.com/api/auth/github?redirect_uri=${encodeURIComponent('http://example.com/admin/auth/callback')}`;
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

	it('returns 500 for unknown shortcode (no database in test)', async () => {
		const response = await SELF.fetch('http://example.com/does-not-exist');
		expect(response.status).toBe(500);
	});

	it('serves admin panel at /admin', async () => {
		const request = new Request('http://example.com/admin');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/html');
		const html = await response.text();
		expect(html).toContain('<!doctype html>');
	});

	it('serves admin assets without CORS headers', async () => {
		const request = new Request('http://example.com/admin/assets/index.js');
		const response = await worker.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});

	it('handles admin SPA routing', async () => {
		const request = new Request('http://example.com/admin/some-route');
		const response = await worker.fetch(request, env, createExecutionContext());
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/html');
	});
});
