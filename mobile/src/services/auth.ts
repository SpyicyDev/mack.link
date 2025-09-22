import { http } from './http';

export interface User {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

class AuthService {
  private user: User | null = null;

  constructor() {
    // Load user from localStorage on initialization
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        const userRaw = localStorage.getItem('user');
        this.user = userRaw ? JSON.parse(userRaw) : null;
        this.dispatchAuthChange();
      }
    });

    // Bootstrap dev auth if needed
    this.bootstrapDevAuthIfNeeded();
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  getUser(): User | null {
    return this.user;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.user) {
      return this.user;
    }

    try {
      const userData = await http.get('/api/auth/user');
      this.user = userData;
      this.saveUser();
      this.dispatchAuthChange();
      return this.user;
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 401) {
        this.user = null;
        this.clearUser();
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await http.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.user = null;
      this.clearUser();
      this.dispatchAuthChange();
    }
  }

  async initAuth(): Promise<User | null> {
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }

  getAuthUrl(): string {
    const redirectUri = `${window.location.origin}/auth/callback`;
    return `/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async devLogin(): Promise<User | null> {
    try {
      const userData = await http.post('/api/auth/dev/login');
      this.user = userData;
      this.saveUser();
      this.dispatchAuthChange();
      return this.user;
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 403) {
        throw new Error('Development authentication is not enabled');
      }
      throw error;
    }
  }

  private async bootstrapDevAuthIfNeeded(): Promise<void> {
    try {
      const dev = import.meta?.env?.VITE_AUTH_DISABLED === 'true';
      if (!dev || this.user) return;

      const userData = await http.get('/api/auth/user');
      this.user = userData;
      this.saveUser();
      this.dispatchAuthChange();
    } catch (error) {
      // Non-fatal during dev startup
      console.warn('Dev auto-auth bootstrap failed', error);
    }
  }

  private saveUser(): void {
    if (this.user) {
      localStorage.setItem('user', JSON.stringify(this.user));
    }
  }

  private clearUser(): void {
    localStorage.removeItem('user');
  }

  private dispatchAuthChange(): void {
    const event = new CustomEvent('auth:change', {
      detail: { user: this.user },
    });
    window.dispatchEvent(event);
  }
}

export const authService = new AuthService();