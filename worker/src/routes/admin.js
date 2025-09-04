import { withCors } from '../cors.js';

// Import embedded admin assets
import { adminAssets } from '../admin-assets.js';

export async function handleAdmin(request, env, requestLogger) {
	const url = new URL(request.url);
	let pathname = url.pathname;

	// Remove /admin prefix for file serving
	if (pathname === '/admin' || pathname === '/admin/') {
		pathname = '/index.html';
	} else {
		pathname = pathname.replace('/admin', '') || '/index.html';
	}

	// For SPA routing, serve index.html for non-asset routes
	if (!pathname.includes('.') && pathname !== '/index.html') {
		pathname = '/index.html';
	}

	requestLogger.info('Serving admin asset', { requestPath: url.pathname, filePath: pathname });

	try {
		const response = await serveStaticFile(pathname, env, requestLogger);
		return response;
	} catch (error) {
		requestLogger.error('Failed to serve admin asset', { error: error.message, pathname });
		return new Response('Admin panel temporarily unavailable', { status: 500 });
	}
}

async function serveStaticFile(path, env, requestLogger) {
	// Clean the path
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;

	// Check if file exists in embedded assets
	const fileContent = adminAssets[cleanPath];
	if (!fileContent) {
		requestLogger.debug('Admin asset not found', { path: cleanPath });
		// If a specific asset (e.g., .js) is requested but not embedded, return an empty file with correct MIME
		const ext = cleanPath.split('.').pop()?.toLowerCase();
		if (ext === 'js') {
			return createResponse('', 'application/javascript', env);
		}
		if (ext === 'css') {
			return createResponse('', 'text/css', env);
		}
		// For SPA, return index.html for unknown non-asset routes
		const indexContent = adminAssets['index.html'];
		if (indexContent) {
			return createResponse(indexContent, 'text/html', env);
		}
		return new Response('Admin panel not available', { status: 404 });
	}

	// Determine content type
	const contentType = getContentType(cleanPath);

	return createResponse(fileContent, contentType, env);
}

function createResponse(content, contentType, env) {
	// Parse JSON-encoded content back to string/binary
	let actualContent;
	try {
		actualContent = JSON.parse(content);
	} catch (e) {
		// If parsing fails, use content as-is (shouldn't happen)
		actualContent = content;
	}

	const response = new Response(actualContent, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': contentType.includes('html')
				? 'no-cache, no-store, must-revalidate'
				: 'public, max-age=31536000, immutable',
		}
	});

	// No CORS needed for same-domain admin routes
	return response;
}

function getContentType(filename) {
	const ext = filename.split('.').pop()?.toLowerCase();

	const mimeTypes = {
		'html': 'text/html; charset=utf-8',
		'css': 'text/css',
		'js': 'application/javascript',
		'json': 'application/json',
		'png': 'image/png',
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'svg': 'image/svg+xml',
		'ico': 'image/x-icon',
		'woff': 'font/woff',
		'woff2': 'font/woff2',
		'ttf': 'font/ttf',
		'eot': 'application/vnd.ms-fontobject',
		'map': 'application/json',
	};

	return mimeTypes[ext] || 'application/octet-stream';
}
