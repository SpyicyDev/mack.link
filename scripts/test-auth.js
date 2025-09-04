#!/usr/bin/env node

/**
 * Authentication Test Script for mack.link
 *
 * This script tests the authentication flow to help debug issues
 */

import { readFileSync } from 'fs';

const BASE_URL = process.argv[2] || 'https://link.mackhaymond.co';

class AuthTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  log(message, data = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
  }

  parseCookies(cookieHeader) {
    if (!cookieHeader) return;

    cookieHeader.split(',').forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    });
  }

  getCookieHeader() {
    const cookieString = Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    return cookieString;
  }

  async fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'User-Agent': 'AuthTester/1.0',
      ...options.headers
    };

    if (this.cookies.size > 0) {
      headers.Cookie = this.getCookieHeader();
    }

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual'
    });

    // Capture cookies from response
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      this.parseCookies(setCookieHeaders);
    }

    return response;
  }

  async testBasicEndpoints() {
    this.log('🔍 Testing basic endpoints...');

    // Test home page
    const homeResponse = await this.fetch('/');
    this.log(`Home page: ${homeResponse.status}`, homeResponse.status === 200 ? '✅' : '❌');

    // Test admin panel
    const adminResponse = await this.fetch('/admin');
    this.log(`Admin panel: ${adminResponse.status}`, adminResponse.status === 200 ? '✅' : '❌');

    // Test API without auth
    const apiResponse = await this.fetch('/api/links');
    this.log(`API (no auth): ${apiResponse.status}`, apiResponse.status === 401 ? '✅' : '❌');

    const apiText = await apiResponse.text();
    this.log(`API response: "${apiText}"`);
  }

  async testAuthFlow() {
    this.log('🔐 Testing authentication flow...');

    // Test OAuth initiation
    const redirectUri = encodeURIComponent(`${this.baseUrl}/admin/auth/callback`);
    const oauthResponse = await this.fetch(`/api/auth/github?redirect_uri=${redirectUri}`);

    this.log(`OAuth redirect: ${oauthResponse.status}`);

    if (oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('location');
      this.log(`OAuth URL: ${location ? '✅' : '❌'}`);

      if (location) {
        const url = new URL(location);
        this.log(`GitHub OAuth initiated to: ${url.hostname}`);
        this.log(`Client ID: ${url.searchParams.get('client_id')}`);
        this.log(`Redirect URI: ${decodeURIComponent(url.searchParams.get('redirect_uri') || '')}`);
        this.log(`State: ${url.searchParams.get('state')}`);
      }
    }

    // Check if oauth_state cookie was set
    if (this.cookies.has('oauth_state')) {
      this.log('OAuth state cookie: ✅');
    } else {
      this.log('OAuth state cookie: ❌');
    }
  }

  async testUserEndpoint() {
    this.log('👤 Testing user endpoint...');

    const userResponse = await this.fetch('/api/user');
    this.log(`User endpoint: ${userResponse.status}`);

    const responseText = await userResponse.text();
    this.log(`Response: ${responseText}`);

    if (userResponse.status === 200) {
      try {
        const userData = JSON.parse(responseText);
        this.log(`Authenticated user: ${userData.login}`, '✅');
        return userData;
      } catch (e) {
        this.log('Invalid JSON response', '❌');
      }
    } else if (userResponse.status === 401) {
      this.log('Not authenticated (expected)', '⚠️');
    }

    return null;
  }

  async testCookies() {
    this.log('🍪 Testing cookie handling...');

    if (this.cookies.size === 0) {
      this.log('No cookies set', '⚠️');
      return;
    }

    for (const [name, value] of this.cookies.entries()) {
      this.log(`Cookie: ${name} = ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    }

    // Test if session cookie is present
    const sessionCookieNames = ['__Host-link_session', 'link_session', 'session'];
    const sessionCookie = sessionCookieNames.find(name => this.cookies.has(name));

    if (sessionCookie) {
      this.log(`Session cookie found: ${sessionCookie}`, '✅');
    } else {
      this.log('No session cookie found', '❌');
    }
  }

  async runDiagnostics() {
    this.log('🚀 Starting authentication diagnostics...');
    this.log(`Testing against: ${this.baseUrl}`);
    this.log('');

    try {
      await this.testBasicEndpoints();
      this.log('');

      await this.testAuthFlow();
      this.log('');

      await this.testCookies();
      this.log('');

      await this.testUserEndpoint();
      this.log('');

      this.log('📋 Summary:');
      this.log('1. If OAuth redirect works but user endpoint returns 401, there may be a session issue');
      this.log('2. Check that session cookies are being set during OAuth callback');
      this.log('3. Verify that cookies are being sent with API requests');
      this.log('4. For local testing, use: node scripts/test-auth.js http://localhost:8787');

    } catch (error) {
      this.log('❌ Test failed:', error.message);
    }
  }
}

// Run diagnostics if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthTester(BASE_URL);
  tester.runDiagnostics()
    .then(() => {
      console.log('\n✅ Diagnostics complete');
    })
    .catch(error => {
      console.error('\n❌ Diagnostics failed:', error);
      process.exit(1);
    });
}

export { AuthTester };
