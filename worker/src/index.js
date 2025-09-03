import { logger } from './logger.js';
import { handleRequest } from './routes.js';
import { withCors } from './cors.js';

export default {
	async fetch(request, env, ctx) {
		const requestLogger = logger.forRequest(request);
		const startTime = Date.now();
		try {
			requestLogger.info('Request started');
			const response = await handleRequest(request, env, requestLogger);
			const duration = Date.now() - startTime;
			requestLogger.info('Request completed', { statusCode: response.status, duration: `${duration}ms` });
			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			requestLogger.error('Request failed', { error: error.message, duration: `${duration}ms` });
			return withCors(env, new Response('Internal Server Error', { status: 500 }));
		}
	}
};


