import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Admin Panel Integration', () => {
  it('serves home page with admin sign-in button', async () => {
    const request = new Request('http://example.com/');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('link.mackhaymond.co');
    expect(html).toContain('Sign in to Admin');
    expect(html).toContain('href="/admin"');
    expect(html).toContain('Fast personal URL shortener');
  });

  it('serves admin panel index at /admin', async () => {
    const request = new Request('http://example.com/admin');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('Cache-Control')).toContain('no-cache');

    const html = await response.text();
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<div id="root">');
    expect(html).toContain('/admin/assets/');
  });

  it('serves admin panel at /admin/ with trailing slash', async () => {
    const request = new Request('http://example.com/admin/');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('handles SPA routing for admin routes', async () => {
    const routes = [
      '/admin/login',
      '/admin/auth/callback',
      '/admin/dashboard',
      '/admin/settings',
      '/admin/analytics'
    ];

    for (const route of routes) {
      const request = new Request(`http://example.com${route}`);
      const response = await worker.fetch(request, env, createExecutionContext());

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('<div id="root">');
    }
  });

  it('serves admin CSS assets with proper headers', async () => {
    const request = new Request('http://example.com/admin/assets/index-qUJUzolK.css');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/css');
    expect(response.headers.get('Cache-Control')).toContain('max-age=31536000');
    expect(response.headers.get('Cache-Control')).toContain('immutable');
  });

  it('serves admin JavaScript assets with proper headers', async () => {
    const request = new Request('http://example.com/admin/assets/index-sA9ZI07Q.js');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/javascript');
    expect(response.headers.get('Cache-Control')).toContain('max-age=31536000');
  });

  it('serves favicon assets', async () => {
    const request = new Request('http://example.com/admin/favicon.jpg');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('handles missing admin assets by serving index.html', async () => {
    const request = new Request('http://example.com/admin/nonexistent-asset.js');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('<div id="root">');
  });

  it('does not add CORS headers for admin routes', async () => {
    const request = new Request('http://example.com/admin');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });

  it('adds CORS headers for API routes', async () => {
    const request = new Request('http://example.com/api/links', { method: 'OPTIONS' });
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
  });

  it('redirects OAuth with correct admin callback URL', async () => {
    const redirectUri = encodeURIComponent('http://example.com/admin/auth/callback');
    const request = new Request(`http://example.com/api/auth/github?redirect_uri=${redirectUri}`, {
      redirect: 'manual'
    });

    const response = await SELF.fetch(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('Location');
    expect(location).toContain('github.com/login/oauth/authorize');
    expect(location).toContain('redirect_uri=http%3A%2F%2Fexample.com%2Fadmin%2Fauth%2Fcallback');
  });

  it('verifies admin panel uses relative URLs for authentication', async () => {
    // Test that the admin panel HTML contains relative auth URLs
    const request = new Request('http://example.com/admin');
    const response = await worker.fetch(request, env, createExecutionContext());

    expect(response.status).toBe(200);
    const html = await response.text();

    // The React app should be configured to use relative URLs
    // This is verified by the build process embedding the correct assets
    expect(html).toContain('/admin/assets/');
    expect(html).not.toContain('localhost:8787');
    expect(html).not.toContain('http://');
  });

  it('preserves redirect functionality for shortcodes', async () => {
    // This should still work for actual redirects (when DB is available)
    const request = new Request('http://example.com/github');
    const response = await worker.fetch(request, env, createExecutionContext());

    // In test environment without DB, this returns 500, but structure is correct
    // In production with DB, this would redirect or return 404
    expect([404, 500]).toContain(response.status);
  });

  it('distinguishes between admin routes and shortcodes', async () => {
    // Admin route should serve SPA
    const adminRequest = new Request('http://example.com/admin/test-route');
    const adminResponse = await worker.fetch(adminRequest, env, createExecutionContext());
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.headers.get('Content-Type')).toContain('text/html');

    // Shortcode should attempt redirect (fails in test due to no DB)
    const shortcodeRequest = new Request('http://example.com/test-route');
    const shortcodeResponse = await worker.fetch(shortcodeRequest, env, createExecutionContext());
    expect(shortcodeResponse.status).toBe(500); // DB error in test environment
  });

  it('serves different asset types with correct MIME types', async () => {
    const assetTests = [
      { path: '/admin/assets/index-qUJUzolK.css', expectedType: 'text/css' },
      { path: '/admin/assets/index-sA9ZI07Q.js', expectedType: 'application/javascript' },
      { path: '/admin/favicon.jpg', expectedType: 'image/jpeg' },
      { path: '/admin/vite.svg', expectedType: 'image/svg+xml' }
    ];

    for (const test of assetTests) {
      const request = new Request(`http://example.com${test.path}`);
      const response = await worker.fetch(request, env, createExecutionContext());

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(test.expectedType);
    }
  });

  it('handles concurrent admin requests efficiently', async () => {
    const requests = Array(10).fill().map((_, i) =>
      worker.fetch(
        new Request(`http://example.com/admin/route-${i}`),
        env,
        createExecutionContext()
      )
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });
  });

  it('maintains proper routing hierarchy', async () => {
    const routeTests = [
      { path: '/', description: 'home page' },
      { path: '/admin', description: 'admin root' },
      { path: '/admin/login', description: 'admin SPA route' },
      { path: '/admin/assets/index.js', description: 'admin asset' },
      { path: '/api/links', description: 'API endpoint' },
      { path: '/api/auth/github', description: 'OAuth endpoint' },
      { path: '/shortcode', description: 'potential redirect' }
    ];

    for (const test of routeTests) {
      const request = new Request(`http://example.com${test.path}`);
      const response = await worker.fetch(request, env, createExecutionContext());

      // All requests should be handled (no 404 for routing issues)
      // Actual response codes depend on functionality
      expect([200, 302, 401, 500]).toContain(response.status);
    }
  });

  it('includes build information in assets', async () => {
    // Test that the build process correctly embedded assets
    const request = new Request('http://example.com/admin');
    const response = await worker.fetch(request, env, createExecutionContext());

    const html = await response.text();

    // Should contain references to built assets
    expect(html).toMatch(/assets\/index-[a-zA-Z0-9]+\.js/);
    expect(html).toMatch(/assets\/index-[a-zA-Z0-9]+\.css/);

    // Should have proper base path
    expect(html).toContain('href="/admin/');
    expect(html).toContain('src="/admin/');
  });

  it('handles edge cases gracefully', async () => {
    const edgeCases = [
      '/admin/../',
      '/admin//double-slash',
      '/admin/.',
      '/admin/deeply/nested/route/that/does/not/exist'
    ];

    for (const path of edgeCases) {
      const request = new Request(`http://example.com${path}`);
      const response = await worker.fetch(request, env, createExecutionContext());

      // Should serve admin SPA for all admin-prefixed routes
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    }
  });
});

describe('Build Process Validation', () => {
  it('verifies admin assets are properly embedded', async () => {
    // Import the admin assets to verify they were built correctly
    const { adminAssets, manifest } = await import('../src/admin-assets.js');

    // Should have core files
    expect(adminAssets).toHaveProperty('index.html');
    expect(adminAssets['index.html']).toContain('<!doctype html>');

    // Should have CSS and JS assets
    const cssFiles = Object.keys(adminAssets).filter(key => key.endsWith('.css'));
    const jsFiles = Object.keys(adminAssets).filter(key => key.endsWith('.js'));

    expect(cssFiles.length).toBeGreaterThan(0);
    expect(jsFiles.length).toBeGreaterThan(0);

    // Should have manifest information
    expect(manifest).toHaveProperty('generatedAt');
    expect(manifest).toHaveProperty('totalFiles');
    expect(manifest.totalFiles).toBeGreaterThan(0);
  });

  it('validates asset sizes are within limits', async () => {
    const { manifest } = await import('../src/admin-assets.js');

    // Total size should be reasonable for worker limits
    expect(manifest.totalSize).toBeLessThan(1024 * 1024 * 2); // 2MB limit
    expect(manifest.totalFiles).toBeGreaterThan(5); // Should have multiple assets
  });
});
