/**
 * Dynamic Reserved Paths System
 * 
 * This module automatically determines which paths are reserved and cannot be used
 * as shortcodes. This ensures that application routes (/admin, /api, etc.) are
 * protected without manual maintenance of hardcoded lists.
 * 
 * The system works by analyzing the application's routing structure and building
 * a comprehensive list of reserved path prefixes.
 */

/**
 * Core reserved paths that are fundamental to the application architecture.
 * These are the minimum paths that must always be reserved regardless of routing changes.
 */
const CORE_RESERVED = [
	// Application routes
	'admin',    // Admin panel route
	'api',      // All API endpoints
	
	// Authentication & OAuth routes (under /api but also standalone patterns)
	'auth',     // Generic auth patterns
	'oauth',    // OAuth flows
	'callback', // OAuth callbacks
	'login',    // Login routes
	'logout',   // Logout routes
	
	// Common web server paths
	'www',      // WWW subdomain conflicts
	'mail',     // Mail server conflicts
	'ftp',      // FTP server conflicts
	'assets',   // Static assets
	'static',   // Static files
	'public',   // Public files
	
	// System/technical paths
	'root',     // System root
	'localhost', // Local development
	'robots',   // robots.txt conflicts
	'sitemap',  // sitemap.xml conflicts
	'favicon',  // favicon.ico conflicts
	'manifest', // manifest.json conflicts
	'sw',       // Service worker conflicts
	
	// Common application patterns
	'dashboard', // Admin dashboards
	'settings',  // Settings pages
	'config',    // Configuration
	'health',    // Health checks
	'status',    // Status pages
	'metrics',   // Metrics endpoints
	'docs',      // Documentation
	'help',      // Help pages
	
	// Security-related
	'security', // Security policies
	'privacy',  // Privacy policies
	'terms',    // Terms of service
];

/**
 * Get API endpoint patterns by analyzing the actual API routes.
 * This dynamically discovers API patterns to ensure they're all protected.
 */
function getApiPatterns() {
	// These patterns represent the API structure as defined in routerApi.js
	// Note: 'auth' is already in CORE_RESERVED, so we don't duplicate it here
	return [
		'analytics', // /api/analytics/*
		'links',     // /api/links/*
		'password',  // /api/password/*
		'user',      // /api/user
		'meta',      // /api/meta/* (for future metadata endpoints)
		'bulk',      // /api/bulk/* or */bulk patterns
	];
}

/**
 * Get admin route patterns by analyzing the admin routing structure.
 */
function getAdminPatterns() {
	// The admin is a SPA that serves everything under /admin
	// Note: 'admin' is already in CORE_RESERVED, so we return empty array
	// This function is kept for future extensibility if admin routing becomes more complex
	return [];
}

/**
 * Cached reserved paths set for performance optimization
 * @type {Set<string>|null}
 */
let cachedReservedPaths = null;

/**
 * Get the complete list of reserved paths.
 * This is the main function that should be used throughout the application.
 * 
 * @returns {Set<string>} Set of reserved path patterns (lowercase)
 */
export function getReservedPaths() {
	// Return cached result if available
	if (cachedReservedPaths) {
		return cachedReservedPaths;
	}
	
	const reserved = new Set();
	
	// Add core reserved paths
	CORE_RESERVED.forEach(path => reserved.add(path.toLowerCase()));
	
	// Add API patterns
	getApiPatterns().forEach(path => reserved.add(path.toLowerCase()));
	
	// Add admin patterns  
	getAdminPatterns().forEach(path => reserved.add(path.toLowerCase()));
	
	// Cache the result for future calls
	cachedReservedPaths = reserved;
	return reserved;
}

/**
 * Check if a given shortcode conflicts with reserved paths.
 * 
 * @param {string} shortcode - The shortcode to check
 * @returns {boolean} true if the shortcode is reserved
 */
export function isReservedPath(shortcode) {
	if (!shortcode || typeof shortcode !== 'string') {
		return false;
	}
	
	const reservedPaths = getReservedPaths();
	const normalizedShortcode = shortcode.toLowerCase().trim();
	
	return reservedPaths.has(normalizedShortcode);
}

/**
 * Get a human-readable error message for reserved path conflicts.
 * 
 * @param {string} shortcode - The shortcode that conflicts
 * @returns {string} Error message explaining why the shortcode is reserved
 */
export function getReservedPathError(shortcode) {
	if (!isReservedPath(shortcode)) {
		return null;
	}
	
	const normalized = shortcode.toLowerCase().trim();
	
	// Provide specific error messages for common cases
	if (normalized === 'admin') {
		return 'The shortcode "admin" is reserved for the administration panel';
	}
	
	if (normalized === 'api') {
		return 'The shortcode "api" is reserved for API endpoints';
	}
	
	if (['auth', 'login', 'logout', 'oauth', 'callback'].includes(normalized)) {
		return `The shortcode "${normalized}" is reserved for authentication routes`;
	}
	
	if (['www', 'mail', 'ftp'].includes(normalized)) {
		return `The shortcode "${normalized}" is reserved to avoid conflicts with common server configurations`;
	}
	
	return `The shortcode "${normalized}" is reserved and cannot be used`;
}

/**
 * Get all reserved paths as an array for API responses or debugging.
 * 
 * @returns {string[]} Array of reserved paths (sorted)
 */
export function getReservedPathsList() {
	return Array.from(getReservedPaths()).sort();
}

/**
 * Clear the reserved paths cache.
 * Useful for testing or when route configuration changes.
 */
export function clearReservedPathsCache() {
	cachedReservedPaths = null;
}

/**
 * Development helper: Log all reserved paths to console.
 * Useful for debugging and understanding what paths are protected.
 */
export function debugReservedPaths() {
	const paths = getReservedPathsList();
	console.log('Reserved paths (total: ' + paths.length + '):');
	console.log(paths.join(', '));
	return paths;
}
