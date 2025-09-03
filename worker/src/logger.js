// Structured Logging System

class Logger {
	constructor() {
		this.requestId = null;
		this.context = {};
	}

	setRequestId(id) {
		this.requestId = id;
		return this;
	}

	setContext(context) {
		this.context = { ...this.context, ...context };
		return this;
	}

	_log(level, message, data = {}) {
		const logEntry = {
			timestamp: new Date().toISOString(),
			level: level.toUpperCase(),
			requestId: this.requestId,
			message,
			context: this.context,
			...data
		};
		console.log(JSON.stringify(logEntry));
	}

	debug(message, data) {
		this._log('debug', message, data);
	}

	info(message, data) {
		this._log('info', message, data);
	}

	warn(message, data) {
		this._log('warn', message, data);
	}

	error(message, data) {
		this._log('error', message, data);
	}

	forRequest(request) {
		const requestId = crypto.randomUUID();
		const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
		const userAgent = request.headers.get('User-Agent') || 'unknown';
		return new Logger()
			.setRequestId(requestId)
			.setContext({
				method: request.method,
				url: request.url,
				clientIP,
				userAgent: userAgent.substring(0, 100)
			});
	}
}

export const logger = new Logger();
export { Logger };


