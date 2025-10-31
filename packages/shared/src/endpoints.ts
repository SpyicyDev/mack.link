/**
 * Canonical API endpoint paths
 * Single source of truth for all API routes
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    GITHUB: '/api/auth/github',
    CALLBACK: '/api/auth/callback',
    LOGOUT: '/api/auth/logout',
    DEV_LOGIN: '/api/auth/dev/login',
  },

  // User endpoints
  USER: '/api/user',

  // Link endpoints
  LINKS: {
    LIST: '/api/links',
    CREATE: '/api/links',
    GET: (shortcode: string) => `/api/links/${shortcode}`,
    UPDATE: (shortcode: string) => `/api/links/${shortcode}`,
    DELETE: (shortcode: string) => `/api/links/${shortcode}`,
    BULK_CREATE: '/api/links/bulk',
    BULK_DELETE: '/api/links/bulk',
  },

  // Analytics endpoints
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    TIMESERIES: '/api/analytics/timeseries',
    TIMESERIES_LINKS: '/api/analytics/timeseries-links',
    BREAKDOWN: '/api/analytics/breakdown',
    EXPORT: '/api/analytics/export',
  },

  // Password protection endpoints
  PASSWORD: {
    VERIFY: '/api/password/verify',
  },

  // Metadata endpoints
  META: {
    RESERVED_PATHS: '/api/meta/reserved-paths',
  },
} as const;

/**
 * Build query parameters for analytics requests
 */
export function buildAnalyticsParams(params: {
  scope?: 'all' | 'shortcode';
  shortcode?: string;
  from?: string;
  to?: string;
  dimension?: string;
  limit?: number;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.scope === 'shortcode' && params.shortcode) {
    searchParams.set('shortcode', params.shortcode);
  }

  if (params.from) {
    searchParams.set('from', params.from);
  }

  if (params.to) {
    searchParams.set('to', params.to);
  }

  if (params.dimension) {
    searchParams.set('dimension', params.dimension);
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  return searchParams;
}

/**
 * Build query parameters for list links requests
 */
export function buildListLinksParams(params: {
  limit?: number;
  cursor?: string;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  return searchParams;
}

