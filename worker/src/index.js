import { logger } from './logger.js';
import { handleRequest } from './routes.js';
import { withCors } from './cors.js';
import { json } from './utils.js';

/**
 * Categorize errors for better handling
 */
function categorizeError(error) {
	// Rate limiting errors
	if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
		return { status: 429, message: 'Too Many Requests', category: 'rate_limit' };
	}
	
	// Database errors
	if (error.message?.includes('database') || error.message?.includes('D1')) {
		return { status: 503, message: 'Service Temporarily Unavailable', category: 'database' };
	}
	
	// Validation errors
	if (error.message?.includes('validation') || error.message?.includes('invalid')) {
		return { status: 400, message: 'Bad Request', category: 'validation' };
	}
	
	// Authentication errors
	if (error.message?.includes('unauthorized') || error.message?.includes('auth')) {
		return { status: 401, message: 'Unauthorized', category: 'auth' };
	}
	
	// Default to internal server error
	return { status: 500, message: 'Internal Server Error', category: 'internal' };
}

export default {
	async fetch(request, env, ctx) {
		const requestLogger = logger.forRequest(request);
		const startTime = Date.now();
		try {
			requestLogger.info('Request started');
			const response = await handleRequest(request, env, requestLogger, ctx);
			const duration = Date.now() - startTime;
			requestLogger.info('Request completed', { statusCode: response.status, duration: `${duration}ms` });
			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorInfo = categorizeError(error);
			
			requestLogger.error('Request failed', { 
				error: error.message, 
				stack: error.stack?.substring(0, 500), // Limit stack trace length
				duration: `${duration}ms`,
				category: errorInfo.category,
				statusCode: errorInfo.status
			});
			
			// For API requests, return JSON error response
			const url = new URL(request.url);
			if (url.pathname.startsWith('/api/')) {
				return json(env, {
					error: errorInfo.message,
					category: errorInfo.category,
					timestamp: new Date().toISOString()
				}, { status: errorInfo.status });
			}
			
			// For other requests, return simple error response
			return withCors(env, new Response(errorInfo.message, { status: errorInfo.status }));
		}
	}
};


