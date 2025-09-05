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

class ProfileAPI {
  async getProfile() {
    return await http.get('/api/profile');
  }
  async updateProfile(updates) {
    return await http.put('/api/profile', updates);
  }
  async listLinks() {
    return await http.get('/api/profile/links');
  }
  async createLink({ title, url, icon = '', isVisible = true }) {
    return await http.post('/api/profile/links', {
      title,
      url,
      icon,
      is_visible: isVisible ? 1 : 0,
    });
  }
  async updateLink(id, updates) {
    const body = { ...updates };
    if (typeof body.isVisible === 'boolean') {
      body.is_visible = body.isVisible ? 1 : 0;
      delete body.isVisible;
    }
    return await http.put(`/api/profile/links/${id}`, body);
  }
  async deleteLink(id) {
    return await http.delete(`/api/profile/links/${id}`);
  }
  async reorderLinks(orderIds) {
    return await http.put('/api/profile/links', { order: orderIds });
  }
}

export const linkAPI = new LinkAPI();
export const profileAPI = new ProfileAPI();
