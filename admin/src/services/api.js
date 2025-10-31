import { http } from './http.js';
import { API_ENDPOINTS, buildListLinksParams } from '@mack-link/shared';

class LinkAPI {
  async getAllLinks() {
    return await http.get(API_ENDPOINTS.LINKS.LIST);
  }

  async listLinks(limit = 500, cursor) {
    const params = buildListLinksParams({ limit, cursor });
    return await http.get(`${API_ENDPOINTS.LINKS.LIST}?${params.toString()}`);
  }

  async createLink(shortcodeOrData, url, description = '', redirectType = 301) {
    const payload = typeof shortcodeOrData === 'object' && shortcodeOrData !== null
      ? shortcodeOrData
      : { shortcode: shortcodeOrData, url, description, redirectType };
    return await http.post(API_ENDPOINTS.LINKS.CREATE, payload);
  }

  async updateLink(shortcode, updates) {
    return await http.put(API_ENDPOINTS.LINKS.UPDATE(shortcode), updates);
  }

  async deleteLink(shortcode) {
    await http.delete(API_ENDPOINTS.LINKS.DELETE(shortcode));
  }

  async bulkDeleteLinks(shortcodes) {
    return await http.delete(API_ENDPOINTS.LINKS.BULK_DELETE, { body: JSON.stringify({ shortcodes }) });
  }

  async bulkCreateLinks(items) {
    return await http.post(API_ENDPOINTS.LINKS.BULK_CREATE, { items });
  }

  async getLink(shortcode) {
    return await http.get(API_ENDPOINTS.LINKS.GET(shortcode));
  }
}

export const linkAPI = new LinkAPI();
