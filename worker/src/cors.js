import { getConfig } from './config.js';

function parseOrigins(originConfig) {
	if (!originConfig || originConfig === '*') return ['*'];
	return originConfig.split(',').map(s => s.trim()).filter(Boolean);
}

export function getCorsHeaders(env, request) {
	const config = getConfig(env);
	const allowList = parseOrigins(config.managementOrigin);
	const requestOrigin = request?.headers?.get('Origin');
	let allowOrigin = '*';
	if (allowList[0] !== '*') {
		if (requestOrigin && allowList.includes(requestOrigin)) {
			allowOrigin = requestOrigin;
		} else if (!requestOrigin) {
			// Non-CORS same-origin requests or server-to-server: default to first allowed
			allowOrigin = allowList[0];
		} else {
			// Origin not allowed: respond with first allowed to be explicit
			allowOrigin = allowList[0];
		}
	}
	return {
		'Access-Control-Allow-Origin': allowOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
		'Vary': 'Origin'
	};
}

export function withCors(env, response, request) {
	const headers = getCorsHeaders(env, request);
	const newResponse = new Response(response.body, response);
	Object.keys(headers).forEach(key => {
		newResponse.headers.set(key, headers[key]);
	});
	return newResponse;
}

export function preflight(env, request) {
	return withCors(env, new Response(null, { status: 200 }), request);
}


