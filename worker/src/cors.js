import { getConfig } from './config.js';

export function getCorsHeaders(env) {
	const config = getConfig(env);
	const origin = config.managementOrigin || '*';
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization'
	};
}

export function withCors(env, response) {
	const headers = getCorsHeaders(env);
	const newResponse = new Response(response.body, response);
	Object.keys(headers).forEach(key => {
		newResponse.headers.set(key, headers[key]);
	});
	return newResponse;
}

export function preflight(env) {
	return withCors(env, new Response(null, { status: 200 }));
}


