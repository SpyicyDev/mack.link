import { http } from './http';
import { 
  Link, 
  CreateLinkData, 
  AnalyticsOverview, 
  API_ENDPOINTS,
  buildAnalyticsParams,
  buildListLinksParams 
} from '@mack-link/shared';

export interface ListLinksResponse {
  links: Record<string, Link>;
  cursor?: string;
}

export const linkAPI = {
  // Link management
  listLinks: async (limit = 100, cursor?: string): Promise<ListLinksResponse> => {
    const params = buildListLinksParams({ limit, cursor });
    const query = params.toString();
    return http.get(`${API_ENDPOINTS.LINKS.LIST}${query ? `?${query}` : ''}`);
  },

  getLink: async (shortcode: string): Promise<Link> => {
    return http.get(API_ENDPOINTS.LINKS.GET(shortcode));
  },

  createLink: async (data: CreateLinkData): Promise<Link> => {
    return http.post(API_ENDPOINTS.LINKS.CREATE, data);
  },

  updateLink: async (shortcode: string, data: Partial<CreateLinkData>): Promise<Link> => {
    return http.put(API_ENDPOINTS.LINKS.UPDATE(shortcode), data);
  },

  deleteLink: async (shortcode: string): Promise<void> => {
    return http.delete(API_ENDPOINTS.LINKS.DELETE(shortcode));
  },

  bulkDeleteLinks: async (shortcodes: string[]): Promise<void> => {
    return http.delete(API_ENDPOINTS.LINKS.BULK_DELETE, { body: JSON.stringify({ shortcodes }) });
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    return http.get(API_ENDPOINTS.ANALYTICS.OVERVIEW);
  },

  getAnalyticsTimeseries: async (params: {
    from: string;
    to: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const queryParams = buildAnalyticsParams(params);
    return http.get(`${API_ENDPOINTS.ANALYTICS.TIMESERIES}?${queryParams.toString()}`);
  },

  getAnalyticsBreakdown: async (params: {
    from: string;
    to: string;
    dimension: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const queryParams = buildAnalyticsParams(params);
    return http.get(`${API_ENDPOINTS.ANALYTICS.BREAKDOWN}?${queryParams.toString()}`);
  },

  exportAnalytics: async (params: {
    from: string;
    to: string;
    scope?: 'all' | 'shortcode';
    shortcode?: string;
  }) => {
    const queryParams = buildAnalyticsParams(params);
    return http.get(`${API_ENDPOINTS.ANALYTICS.EXPORT}?${queryParams.toString()}`);
  },

  // Reserved paths
  getReservedPaths: async (): Promise<string[]> => {
    const response = await http.get(API_ENDPOINTS.META.RESERVED_PATHS);
    return response.reserved || [];
  },
};

// Re-export types for convenience
export type { Link, CreateLinkData, AnalyticsOverview };
