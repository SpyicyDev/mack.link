#!/usr/bin/env node

/**
 * Live Authentication Test for mack.link
 *
 * This script simulates the OAuth flow and tests session management
 * to help debug authentication issues in real-time.
 */

const BASE_URL = process.argv[2] || 'https://link.mackhaymond.co';

class LiveAuthTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const icons = { info: '🔍', success: '✅', error: '❌', warning: '⚠️ ' };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  parseCookies(setCookieHeader) {
    if (!setCookieHeader) return;

    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookies.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value && name.trim() && value.trim()) {
        this.cookies.set(name.trim(), value.trim());
        this.log(`Cookie set: ${name.trim()}=${value.trim().substring(0, 20)}...`);
      }
    });
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  async makeRequest(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'User-Agent': 'LiveAuthTester/1.0',
      ...options.headers
    };

    if (this.cookies.size > 0) {
      headers.Cookie = this.getCookieHeader();
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        redirect: 'manual'
      });

      // Capture Set-Cookie headers
      const setCookieHeaders = response.headers.get('set-cookie');
      if (setCookieHeaders) {
        this.parseCookies(setCookieHeaders);
      }

      return response;
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testStep1_OAuthInitiation() {
    this.log('Step 1: Testing OAuth initiation...');

    const redirectUri = encodeURIComponent(`${this.baseUrl}/admin/auth/callback`);
    const response = await this.makeRequest(`/api/auth/github?redirect_uri=${redirectUri}`);

    if (response.status !== 302) {
      this.log(`OAuth initiation failed: ${response.status}`, 'error');
      return false;
    }

    const location = response.headers.get('location');
    if (!location || !location.includes('github.com')) {
      this.log('OAuth redirect URL invalid', 'error');
      return false;
    }

    this.log('OAuth initiation successful', 'success');
    this.log(`Redirect URL: ${location}`);

    return true;
  }

  async testStep2_SessionCheck() {
    this.log('Step 2: Testing session validation...');

    if (!this.cookies.has('link_session') && !this.cookies.has('__Host-link_session')) {
      this.log('No session cookie found - this is expected before OAuth callback', 'warning');
      return false;
    }

    const response = await this.makeRequest('/api/user');

    if (response.status === 200) {
      const userData = await response.json();
      this.log(`Authenticated as: ${userData.login}`, 'success');
      return true;
    } else if (response.status === 401) {
      this.log('Session invalid (401) - expected without proper OAuth', 'warning');
      return false;
    } else {
      this.log(`Unexpected response: ${response.status}`, 'error');
      return false;
    }
  }

  async testStep3_APIAccess() {
    this.log('Step 3: Testing API access...');

    const response = await this.makeRequest('/api/links');

    if (response.status === 401) {
      this.log('API correctly returns 401 without authentication', 'success');
      return true;
    } else if (response.status === 200) {
      this.log('API access successful - user is authenticated', 'success');
      return true;
    } else {
      this.log(`API returned unexpected status: ${response.status}`, 'error');
      return false;
    }
  }

  displayDiagnostics() {
    this.log('\n📋 Current State:');
    this.log(`Base URL: ${this.baseUrl}`);
    this.log(`Cookies stored: ${this.cookies.size}`);

    if (this.cookies.size > 0) {
      for (const [name, value] of this.cookies.entries()) {
        this.log(`  - ${name}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      }
    }

    this.log('\n🔧 Manual Testing Instructions:');
    this.log('1. Open: https://link.mackhaymond.co/admin');
    this.log('2. Open DevTools → Network tab');
    this.log('3. Clear cookies and try to sign in');
    this.log('4. Look for these requests:');
    this.log('   - /api/auth/github (should be 302)');
    this.log('   - /admin/auth/callback (should set link_session cookie)');
    this.log('   - /api/user or /api/links (should work after callback)');

    this.log('\n🚨 Common Issues:');
    this.log('- JWT_SECRET not configured (prevents session creation)');
    this.log('- GITHUB_CLIENT_SECRET missing (prevents OAuth callback)');
    this.log('- Cookie SameSite/Secure settings blocking cookie');
    this.log('- React Router basename causing redirect loops');
  }

  async runFullTest() {
    this.log('🚀 Starting live authentication test...\n');

    try {
      const step1 = await this.testStep1_OAuthInitiation();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const step2 = await this.testStep2_SessionCheck();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const step3 = await this.testStep3_APIAccess();

      this.log('\n📊 Test Results:');
      this.log(`OAuth Initiation: ${step1 ? '✅' : '❌'}`);
      this.log(`Session Check: ${step2 ? '✅' : '⚠️ '} (expected to fail without OAuth callback)`);
      this.log(`API Security: ${step3 ? '✅' : '❌'}`);

      this.displayDiagnostics();

    } catch (error) {
      this.log(`Test failed with error: ${error.message}`, 'error');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LiveAuthTester(BASE_URL);
  tester.runFullTest().catch(console.error);
}

export { LiveAuthTester };
