// Password utilities for link protection
// Uses Web Crypto API available in Cloudflare Workers

/**
 * Generate a random salt
 */
function generateSalt() {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with salt using PBKDF2
 * @param {string} password - Plain text password
 * @param {string} salt - Salt (optional, will generate if not provided)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, salt = null) {
	if (!salt) {
		salt = generateSalt();
	}

	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: encoder.encode(salt),
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);

	const hashArray = new Uint8Array(hashBuffer);
	const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');

	return { hash, salt };
}

/**
 * Verify a password against a stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash from database
 * @param {string} salt - Salt used for hashing
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, salt) {
	try {
		const { hash } = await hashPassword(password, salt);
		return hash === storedHash;
	} catch (error) {
		return false;
	}
}

/**
 * Generate a secure session token for password verification
 * @returns {string}
 */
export function generateSessionToken() {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a password hash string that includes the salt
 * Format: salt:hash
 * @param {string} password - Plain text password
 * @returns {Promise<string>}
 */
export async function createPasswordHash(password) {
	if (!password || typeof password !== 'string' || password.trim().length === 0) {
		throw new Error('Password cannot be empty');
	}

	const { hash, salt } = await hashPassword(password.trim());
	return `${salt}:${hash}`;
}

/**
 * Verify a password against a combined hash string
 * @param {string} password - Plain text password
 * @param {string} combinedHash - Combined salt:hash string
 * @returns {Promise<boolean>}
 */
export async function verifyPasswordHash(password, combinedHash) {
	if (!password || !combinedHash) {
		return false;
	}

	const [salt, hash] = combinedHash.split(':');
	if (!salt || !hash) {
		return false;
	}

	return await verifyPassword(password.trim(), hash, salt);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validatePasswordStrength(password) {
	const errors = [];

	if (!password || typeof password !== 'string') {
		return { valid: false, errors: ['Password is required'] };
	}

	if (password.length < 8) {
		errors.push('Password must be at least 8 characters long');
	}

	if (password.length > 128) {
		errors.push('Password must be less than 128 characters long');
	}

	// Check for common weak passwords
	const weakPasswords = [
		'password', '12345678', 'qwerty123', 'password123',
		'admin123', 'letmein', 'welcome123', 'monkey123'
	];

	if (weakPasswords.includes(password.toLowerCase())) {
		errors.push('Password is too common and easily guessed');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
