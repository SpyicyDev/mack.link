export function getCorsHeaders(env, request) {
	if (!request) {
		return {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '600',
			Vary: 'Origin',
		};
	}

	const requestOrigin = request.headers?.get('Origin');
	const url = new URL(request.url);

	// For same-domain admin routes, no CORS needed
	if (url.pathname.startsWith('/admin')) {
		return {};
	}

	// For API routes, be permissive but secure
	return {
		'Access-Control-Allow-Origin': requestOrigin || '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Max-Age': '600',
		Vary: 'Origin',
	};
}

export function withCors(env, response, request) {
	const headers = getCorsHeaders(env, request);

	// If no CORS headers needed (same-domain), return response as-is
	if (Object.keys(headers).length === 0) {
		return response;
	}

	const newResponse = new Response(response.body, response);
	Object.keys(headers).forEach((key) => {
		newResponse.headers.set(key, headers[key]);
	});
	return newResponse;
}

export function preflight(env, request) {
	return withCors(env, new Response(null, { status: 200 }), request);
}
