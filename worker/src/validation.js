import { isReservedPath, getReservedPathError } from './reservedPaths.js';

export function validateShortcode(shortcode) {
	if (typeof shortcode !== 'string') return 'Shortcode must be a string';
	if (!shortcode.trim()) return 'Shortcode is required';
	
	const trimmed = shortcode.trim();
	if (trimmed.length < 2) return 'Shortcode must be at least 2 characters long';
	if (trimmed.length > 50) return 'Shortcode must be less than 50 characters long';
	
	if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
		return 'Shortcode can only contain letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_)';
	}
	
	// Check for confusing character combinations
	if (trimmed.includes('--') || trimmed.includes('__')) {
		return 'Shortcode cannot contain consecutive special characters (-- or __)';
	}
	
	if (trimmed.startsWith('-') || trimmed.startsWith('_') || trimmed.endsWith('-') || trimmed.endsWith('_')) {
		return 'Shortcode cannot start or end with special characters';
	}
	
	// Check against dynamic reserved paths system
	if (isReservedPath(trimmed)) {
		return getReservedPathError(trimmed);
	}
	
	return null;
}

export function validateUrl(url) {
	if (typeof url !== 'string') return 'URL must be a string';
	if (!url.trim()) return 'URL is required';
	if (url.length > 2048) return 'URL must be less than 2048 characters';
	
	const trimmedUrl = url.trim();
	if (!/^https?:\/\/.+/.test(trimmedUrl)) {
		return 'URL must start with http:// or https:// (example: https://example.com)';
	}
	
	try {
		const parsedUrl = new URL(trimmedUrl);
		
		// Security checks
		if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
			return 'Cannot redirect to localhost URLs for security reasons';
		}
		
		if (parsedUrl.hostname.endsWith('.local') || parsedUrl.hostname.includes('192.168.') || parsedUrl.hostname.includes('10.0.')) {
			return 'Cannot redirect to private network URLs for security reasons';
		}
		
		// Check for suspicious schemes embedded in path
		if (parsedUrl.pathname.includes('javascript:') || parsedUrl.pathname.includes('data:')) {
			return 'URL contains potentially unsafe content';
		}
		
	} catch (error) {
		return `Invalid URL format: ${error.message}`;
	}
	return null;
}

export function validateDescription(description) {
	if (description !== undefined && description !== null) {
		if (typeof description !== 'string') return 'Description must be a string';
		if (description.length > 200) return 'Description must be less than 200 characters';
	}
	return null;
}

export function validateRedirectType(redirectType) {
	if (redirectType !== undefined && redirectType !== null) {
		if (typeof redirectType !== 'number') return 'Redirect type must be a number';
		if (![301, 302, 307, 308].includes(redirectType)) return 'Redirect type must be 301, 302, 307, or 308';
	}
	return null;
}

export function validateTags(tags) {
	if (tags === undefined || tags === null) return null;
	if (!Array.isArray(tags)) return 'Tags must be an array of strings';
	if (tags.length > 20) return 'Too many tags (max 20)';
	for (const t of tags) {
		if (typeof t !== 'string') return 'Tags must be an array of strings';
		const tag = t.trim();
		if (!tag) return 'Tags cannot be empty strings';
		if (tag.length > 32) return 'Tag length must be <= 32 characters';
		if (!/^[a-zA-Z0-9_-]+$/.test(tag)) return 'Tags may contain letters, numbers, hyphens, and underscores';
	}
	return null;
}

export function validateISODate(dateStr, { allowPast = true } = {}) {
	if (dateStr === undefined || dateStr === null) return null;
	if (typeof dateStr === 'string' && dateStr.trim() === '') return null;
	if (typeof dateStr !== 'string') return 'Date must be an ISO 8601 string';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return 'Invalid ISO 8601 date';
	if (!allowPast && d.getTime() < Date.now()) return 'Date must be in the future';
	return null;
}
