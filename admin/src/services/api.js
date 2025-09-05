import { http } from './http.js';

class LinkAPI {
  async getAllLinks() {
    return await http.get('/api/links');
  }

  async listLinks(limit = 500, cursor) {
    const q = new URLSearchParams();
    if (limit) q.set('limit', String(limit));
    if (cursor) q.set('cursor', cursor);
    return await http.get(`/api/links?${q.toString()}`);
  }

  async createLink(shortcodeOrData, url, description = '', redirectType = 301) {
    const payload = typeof shortcodeOrData === 'object' && shortcodeOrData !== null
      ? shortcodeOrData
      : { shortcode: shortcodeOrData, url, description, redirectType };
    return await http.post('/api/links', payload);
  }

  async updateLink(shortcode, updates) {
    return await http.put(`/api/links/${shortcode}`, updates);
  }

  async deleteLink(shortcode) {
    await http.delete(`/api/links/${shortcode}`);
  }

  async bulkDeleteLinks(shortcodes) {
    return await http.delete('/api/links/bulk', { body: JSON.stringify({ shortcodes }) });
  }

  async bulkCreateLinks(items) {
    return await http.post('/api/links/bulk', { items });
  }

  async getLink(shortcode) {
    return await http.get(`/api/links/${shortcode}`);
  }
}

export const linkAPI = new LinkAPI();