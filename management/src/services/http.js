import { authService } from './auth.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

async function request(path, { method = 'GET', headers = {}, body } = {}) {
	const init = {
		method,
		headers: {
			...headers,
		},
		credentials: 'include',
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
		const message = isJson && data?.error ? data.error : (typeof data === 'string' ? data : 'Request failed')
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


