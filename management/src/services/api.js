import { http } from './http.js';

class LinkAPI {
  async getAllLinks() {
    return await http.get('/api/links');
  }

  async createLink(shortcode, url, description = '', redirectType = 301) {
    return await http.post('/api/links', { shortcode, url, description, redirectType });
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

  async getLink(shortcode) {
    return await http.get(`/api/links/${shortcode}`);
  }
}

export const linkAPI = new LinkAPI();