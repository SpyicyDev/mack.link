const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('github_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  async login() {
    // Redirect to GitHub OAuth
    const redirectUri = `${window.location.origin}/auth/callback`;
    const authUrl = `${API_BASE}/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }

  async handleCallback(code) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/callback?code=${code}`);
      
      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      
      this.token = data.access_token;
      this.user = data.user;
      
      localStorage.setItem('github_token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return data;
    } catch (error) {
      console.error('Authentication callback failed:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('github_token');
    localStorage.removeItem('user');
  }

  getAuthHeaders() {
    return this.token ? {
      'Authorization': `Bearer ${this.token}`
    } : {};
  }
}

export const authService = new AuthService();