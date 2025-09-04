const API_BASE = import.meta.env.VITE_API_BASE || ''

class AuthService {
  constructor() {
    this.token = null // no longer used client-side
    this.user = JSON.parse(localStorage.getItem('user') || 'null')
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        const userRaw = localStorage.getItem('user')
        this.user = userRaw ? JSON.parse(userRaw) : null
        const event = new CustomEvent('auth:change', {
          detail: { token: this.token, user: this.user },
        })
        window.dispatchEvent(event)
      }
    })
  }

  isAuthenticated() {
    return !!this.user
  }

  getToken() {
    return this.token
  }

  getUser() {
    return this.user
  }

  async login() {
    // Redirect to GitHub OAuth
    const redirectUri = `${window.location.origin}/admin/auth/callback`
    const authUrl = `/api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = authUrl
  }

  async handleCallback(code, state) {
    try {
      const url = new URL('/api/auth/callback', window.location.origin)
      url.searchParams.set('code', code)
      if (state) {
        url.searchParams.set('state', state)
      }

      const response = await fetch(url.toString(), { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to authenticate')
      }

      const data = await response.json()

      if (data.error === 'access_denied') {
        throw new Error(
          data.error_description || 'Access denied: You are not authorized to use this service'
        )
      }

      this.user = data.user
      localStorage.setItem('user', JSON.stringify(this.user))
      const event = new CustomEvent('auth:change', {
        detail: { token: this.token, user: this.user },
      })
      window.dispatchEvent(event)

      return data
    } catch (error) {
      console.error('Authentication callback failed:', error)
      throw error
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem('user')
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    const event = new CustomEvent('auth:change', { detail: { token: null, user: null } })
    window.dispatchEvent(event)
  }

  getAuthHeaders() {
    return {}
  }
}

export const authService = new AuthService()
