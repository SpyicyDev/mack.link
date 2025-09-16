import { authService } from './auth.js'

const API_BASE = import.meta.env.VITE_API_BASE || ''

/**
 * In dev-auth-disabled mode (VITE_AUTH_DISABLED=true), the Admin UI adds `x-dev-auth: 1`
 * to all API requests. The Worker accepts this header only for local Hosts (localhost/127.0.0.1)
 * and returns a mock user, skipping cookies and authorized-user checks.
 *
 * This solves cross-origin cookie issues between ports (5173 → 8787) and enables
 * zero-click UI development by an agent.
 */
async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const init = {
    method,
    headers: {
      ...headers,
    },
    credentials: 'include',
  }
  // In dev-auth-disabled mode, send a local-only header to allow mock user bypass
  if (import.meta?.env?.VITE_AUTH_DISABLED === 'true') {
    init.headers['x-dev-auth'] = '1'
  }
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
    if (!init.headers['Content-Type']) {
      init.headers['Content-Type'] = 'application/json'
    }
  }
  const res = await fetch(`${API_BASE}${path}`, init)
  if (res.status === 401) {
    authService.logout()
    window.location.reload()
    return
  }
  const contentType = res.headers.get('Content-Type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text()
  if (!res.ok) {
    const message =
      isJson && data?.error ? data.error : typeof data === 'string' ? data : 'Request failed'
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

export const http = {
  get: (path, init) => request(path, { ...init, method: 'GET' }),
  post: (path, body, init) => request(path, { ...init, method: 'POST', body }),
  put: (path, body, init) => request(path, { ...init, method: 'PUT', body }),
  delete: (path, init) => request(path, { ...init, method: 'DELETE' }),
}
