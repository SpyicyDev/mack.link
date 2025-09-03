import { authService } from './auth.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

class LinkAPI {
  async getAllLinks() {
    const response = await fetch(`${API_BASE}/api/links`, {
      headers: {
        ...authService.getAuthHeaders()
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        window.location.reload();
        return;
      }
      throw new Error('Failed to fetch links');
    }
    return await response.json();
  }

  async createLink(shortcode, url, description = '', redirectType = 301) {
    const response = await fetch(`${API_BASE}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify({
        shortcode,
        url,
        description,
        redirectType
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return await response.json();
  }

  async updateLink(shortcode, updates) {
    const response = await fetch(`${API_BASE}/api/links/${shortcode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update link');
    }
    
    return await response.json();
  }

  async deleteLink(shortcode) {
    const response = await fetch(`${API_BASE}/api/links/${shortcode}`, {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeaders()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete link');
    }
  }

  async getLink(shortcode) {
    const response = await fetch(`${API_BASE}/api/links/${shortcode}`, {
      headers: {
        ...authService.getAuthHeaders()
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch link');
    }
    return await response.json();
  }
}

export const linkAPI = new LinkAPI();