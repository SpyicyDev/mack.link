import { createHttpClient } from '@mack-link/shared';
import { authService } from './auth.js';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const AUTH_DISABLED = import.meta?.env?.VITE_AUTH_DISABLED === 'true';

/**
 * Shared HTTP client with dev-auth support
 * Uses consolidated logic from @mack-link/shared
 */
export const http = createHttpClient({
  apiBase: API_BASE,
  authDisabled: AUTH_DISABLED,
  onUnauthorized: () => {
    authService.logout();
    window.location.reload();
  },
});
