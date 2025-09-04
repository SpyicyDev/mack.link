#!/usr/bin/env node

/**
 * Deployment Validation Script for mack.link
 *
 * This script validates that the admin panel integration is working correctly
 * by testing key endpoints and functionality.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_BASE_URL = 'http://localhost:8787';
const TIMEOUT = 10000;

class DeploymentValidator {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      header: '📋'
    }[type] || 'ℹ️';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.log(`✓ ${name}`, 'success');
      this.passed++;
    } catch (error) {
      this.log(`✗ ${name}: ${error.message}`, 'error');
      this.failed++;
    }
  }

  async warn(name, testFn) {
    try {
      await testFn();
    } catch (error) {
      this.log(`⚠ ${name}: ${error.message}`, 'warning');
      this.warnings++;
    }
  }

  async validateHomePageIntegration() {
    await this.test('Home page serves with admin link', async () => {
      const response = await this.fetch('/');

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const html = await response.text();

      if (!html.includes('Sign in to Admin')) {
        throw new Error('Home page missing "Sign in to Admin" button');
      }

      if (!html.includes('href="/admin"')) {
        throw new Error('Home page missing admin link');
      }

      if (!html.includes('link.mackhaymond.co')) {
        throw new Error('Home page missing title');
      }
    });
  }

  async validateAdminPanelServing() {
    await this.test('Admin panel serves at /admin', async () => {
      const response = await this.fetch('/admin');

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType.includes('text/html')) {
        throw new Error(`Expected HTML content, got ${contentType}`);
      }

      const html = await response.text();
      if (!html.includes('<div id="root">')) {
        throw new Error('Admin panel missing React root element');
      }

      if (!html.includes('/admin/assets/')) {
        throw new Error('Admin panel missing asset references');
      }
    });

    await this.test('Admin panel serves with trailing slash', async () => {
      const response = await this.fetch('/admin/');

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
    });
  }

  async validateSPARouting() {
    const routes = ['/admin/login', '/admin/auth/callback', '/admin/dashboard'];

    for (const route of routes) {
      await this.test(`SPA routing works for ${route}`, async () => {
        const response = await this.fetch(route);

        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }

        const html = await response.text();
        if (!html.includes('<div id="root">')) {
          throw new Error('SPA route not serving React app');
        }
      });
    }
  }

  async validateAssetServing() {
    // Get asset names from the admin panel HTML
    const adminResponse = await this.fetch('/admin');
    const adminHtml = await adminResponse.text();

    // Extract CSS and JS asset paths
    const cssMatches = adminHtml.match(/href="\/admin\/(assets\/[^"]+\.css)"/g) || [];
    const jsMatches = adminHtml.match(/src="\/admin\/(assets\/[^"]+\.js)"/g) || [];

    const cssAssets = cssMatches.map(match =>
      match.match(/href="\/admin\/([^"]+)"/)[1]
    );
    const jsAssets = jsMatches.map(match =>
      match.match(/src="\/admin\/([^"]+)"/)[1]
    );

    // Test CSS assets
    for (const asset of cssAssets) {
      await this.test(`CSS asset serves: ${asset}`, async () => {
        const response = await this.fetch(`/admin/${asset}`);

        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType.includes('text/css')) {
          throw new Error(`Expected CSS content type, got ${contentType}`);
        }

        const cacheControl = response.headers.get('cache-control');
        if (!cacheControl.includes('max-age=31536000')) {
          throw new Error('CSS asset missing long cache headers');
        }
      });
    }

    // Test JS assets
    for (const asset of jsAssets) {
      await this.test(`JS asset serves: ${asset}`, async () => {
        const response = await this.fetch(`/admin/${asset}`);

        if (response.status !== 200) {
          throw new Error(`Expected status 200, got ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType.includes('application/javascript')) {
          throw new Error(`Expected JS content type, got ${contentType}`);
        }
      });
    }

    // Test favicon
    await this.test('Favicon serves correctly', async () => {
      const response = await this.fetch('/admin/favicon.jpg');

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType.includes('image/')) {
        throw new Error(`Expected image content type, got ${contentType}`);
      }
    });
  }

  async validateCORSConfiguration() {
    await this.test('Admin routes have no CORS headers', async () => {
      const response = await this.fetch('/admin');

      const corsOrigin = response.headers.get('access-control-allow-origin');
      if (corsOrigin !== null) {
        throw new Error('Admin routes should not have CORS headers');
      }
    });

    await this.test('API routes have CORS headers', async () => {
      const response = await this.fetch('/api/links', { method: 'OPTIONS' });

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const corsOrigin = response.headers.get('access-control-allow-origin');
      if (!corsOrigin) {
        throw new Error('API routes should have CORS headers');
      }
    });
  }

  async validateAPIEndpoints() {
    await this.test('API endpoints are accessible', async () => {
      const response = await this.fetch('/api/links');

      // Should return 401 (unauthorized) not 404 (not found)
      if (response.status !== 401) {
        throw new Error(`Expected status 401 (unauthorized), got ${response.status}`);
      }
    });

    await this.test('OAuth endpoint redirects correctly', async () => {
      const redirectUri = encodeURIComponent(`${this.baseUrl}/admin/auth/callback`);
      const response = await this.fetch(`/api/auth/github?redirect_uri=${redirectUri}`, {
        redirect: 'manual'
      });

      if (response.status !== 302) {
        throw new Error(`Expected status 302 (redirect), got ${response.status}`);
      }

      const location = response.headers.get('location');
      if (!location.includes('github.com/login/oauth/authorize')) {
        throw new Error('OAuth endpoint not redirecting to GitHub');
      }

      if (!location.includes('redirect_uri')) {
        throw new Error('OAuth redirect missing redirect_uri parameter');
      }
    });
  }

  async validateBuildArtifacts() {
    await this.test('Admin assets are properly embedded', async () => {
      try {
        const assetsPath = join(__dirname, '../worker/src/admin-assets.js');
        const assetsContent = readFileSync(assetsPath, 'utf8');

        if (!assetsContent.includes('export const adminAssets')) {
          throw new Error('admin-assets.js missing adminAssets export');
        }

        if (!assetsContent.includes('index.html')) {
          throw new Error('admin-assets.js missing index.html');
        }

        if (assetsContent.includes('Admin Panel Loading')) {
          throw new Error('admin-assets.js contains placeholder content - build may have failed');
        }

      } catch (error) {
        throw new Error(`Could not validate build artifacts: ${error.message}`);
      }
    });
  }

  async validatePerformance() {
    await this.warn('Admin panel loads quickly', async () => {
      const start = Date.now();
      const response = await this.fetch('/admin');
      const duration = Date.now() - start;

      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (duration > 2000) {
        throw new Error(`Admin panel took ${duration}ms to load (should be < 2000ms)`);
      }
    });

    await this.warn('Asset sizes are reasonable', async () => {
      const response = await this.fetch('/admin');
      const html = await response.text();

      if (html.length > 10 * 1024) { // 10KB for HTML
        throw new Error(`HTML size is ${Math.round(html.length/1024)}KB (should be < 10KB)`);
      }
    });
  }

  async validateRoutingHierarchy() {
    const testCases = [
      { path: '/', description: 'Home page' },
      { path: '/admin', description: 'Admin root' },
      { path: '/admin/test-route', description: 'Admin SPA route' },
      { path: '/api/links', description: 'API endpoint' }
    ];

    for (const testCase of testCases) {
      await this.test(`${testCase.description} routing works`, async () => {
        const response = await this.fetch(testCase.path);

        // All requests should be handled (no 404 for routing issues)
        if (response.status === 404 && testCase.path !== '/nonexistent-shortcode') {
          throw new Error('Request not handled by router');
        }

        // Validate expected response types
        if (testCase.path === '/') {
          const html = await response.text();
          if (!html.includes('Sign in to Admin')) {
            throw new Error('Home page content incorrect');
          }
        } else if (testCase.path.startsWith('/admin')) {
          const contentType = response.headers.get('content-type');
          if (!contentType.includes('text/html')) {
            throw new Error('Admin routes should serve HTML');
          }
        } else if (testCase.path.startsWith('/api/')) {
          // API routes should return JSON or appropriate responses
          if (response.status === 404) {
            throw new Error('API endpoint not found');
          }
        }
      });
    }
  }

  async runAllValidations() {
    this.log('🚀 Starting deployment validation...', 'header');
    this.log(`Testing against: ${this.baseUrl}`);

    try {
      // Test basic connectivity
      await this.test('Worker is responding', async () => {
        const response = await this.fetch('/');
        if (!response.ok && response.status !== 401) {
          throw new Error(`Worker not responding: ${response.status}`);
        }
      });

      // Core functionality tests
      await this.validateHomePageIntegration();
      await this.validateAdminPanelServing();
      await this.validateSPARouting();
      await this.validateAssetServing();
      await this.validateCORSConfiguration();
      await this.validateAPIEndpoints();
      await this.validateRoutingHierarchy();
      await this.validateBuildArtifacts();

      // Performance and optimization tests (warnings only)
      await this.validatePerformance();

    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'error');
      this.failed++;
    }

    // Summary
    this.log('', 'info');
    this.log('📊 Validation Summary:', 'header');
    this.log(`✅ Passed: ${this.passed}`);
    this.log(`❌ Failed: ${this.failed}`);
    this.log(`⚠️  Warnings: ${this.warnings}`);

    if (this.failed === 0) {
      this.log('🎉 All validations passed! Deployment is ready.', 'success');
      return true;
    } else {
      this.log('💥 Some validations failed. Please fix issues before deploying.', 'error');
      return false;
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] || DEFAULT_BASE_URL;
  const validator = new DeploymentValidator(baseUrl);

  validator.runAllValidations()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation script failed:', error);
      process.exit(1);
    });
}

export { DeploymentValidator };
