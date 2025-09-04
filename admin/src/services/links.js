// Utilities for constructing short link URLs consistently across the app

const API_BASE = import.meta.env.VITE_API_BASE || ''
const WORKER_DOMAIN_ENV = import.meta.env.VITE_WORKER_DOMAIN || ''

function parseUrlSafe(value) {
  try { return new URL(value) } catch { return null }
}

function normalizeWorkerOrigin() {
  // 1) Prefer explicit worker domain if provided
  if (WORKER_DOMAIN_ENV) {
    const hasProtocol = /:\/\//.test(WORKER_DOMAIN_ENV)
    if (hasProtocol) {
      const u = parseUrlSafe(WORKER_DOMAIN_ENV)
      if (u) return { protocol: u.protocol.replace(':',''), host: u.host }
    }
    const host = WORKER_DOMAIN_ENV
    const protocol = host.startsWith('localhost') || /:\d+$/.test(host) ? 'http' : 'https'
    return { protocol, host }
  }
  // 2) Otherwise, derive from API base if available
  const api = parseUrlSafe(API_BASE)
  if (api) return { protocol: api.protocol.replace(':',''), host: api.host }
  // 3) Fallback to localhost worker
  return { protocol: 'http', host: 'localhost:8787' }
}

export function getWorkerOrigin() {
  const { protocol, host } = normalizeWorkerOrigin()
  return `${protocol}://${host}`
}

export function shortUrl(shortcode) {
  const origin = getWorkerOrigin()
  return `${origin}/${encodeURIComponent(shortcode)}`
}

export function workerHost() {
  const { host } = normalizeWorkerOrigin()
  return host
}
