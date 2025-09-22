import { http } from './http';

export interface Link {
  shortcode: string;
  url: string;
  title?: string;
  description?: string;
  tags: string[];
  clicks: number;
  created: string;
  updated: string;
  archived: boolean;
  activatesAt: string;
  expiresAt: string;
  passwordEnabled: boolean;
  redirectType: number;
}

export interface CreateLinkData {
  url: string;
  shortcode?: string;
  title?: string;
  description?: string;
  tags?: string[];
  password?: string;
  activatesAt?: string;
  expiresAt?: string;
  redirectType?: number;
}

export interface AnalyticsOverview {
  totalClicks: number;
  totalLinks: number;
  todayClicks: number;
  recentClicks: number;
}

export const linkAPI = {
  // Link management
  listLinks: async (limit = 100, cursor?: string): Promise<{ links: Record<string, Link>; cursor?: string }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    
    const query = params.toString();
    return http.get(`/api/links${query ? `?${query}` : ''}`);
  },

  getLink: async (shortcode: string): Promise<Link> => {
    return http.get(`/api/links/${shortcode}`);
  },

  createLink: async (data: CreateLinkData): Promise<Link> => {
    return http.post('/api/links', data);
  },

  updateLink: async (shortcode: string, data: Partial<CreateLinkData>): Promise<Link> => {
    return http.put(`/api/links/${shortcode}`, data);
  },

  deleteLink: async (shortcode: string): Promise<void> => {
    return http.delete(`/api/links/${shortcode}`);
  },

  bulkDeleteLinks: async (shortcodes: string[]): Promise<void> => {
    return http.post('/api/links/bulk-delete', { shortcodes });
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    return http.get('/api/analytics/overview');
  },

  getAnalyticsTimeseries: async (params: {
    from: string;
    to: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return http.get(`/api/analytics/timeseries?${query}`);
  },

  getAnalyticsBreakdown: async (params: {
    from: string;
    to: string;
    dimension: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return http.get(`/api/analytics/breakdown?${query}`);
  },

  exportAnalytics: async (params: {
    from: string;
    to: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return http.get(`/api/analytics/export?${query}`);
  },

  // Reserved paths
  getReservedPaths: async (): Promise<string[]> => {
    return http.get('/api/reserved-paths');
  },
};