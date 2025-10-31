import { describe, it, expect } from 'vitest';
import { 
	validateShortcode, 
	validateUrl, 
	validateDescription, 
	validateRedirectType, 
	validateTags 
} from '../src/validation.js';

describe('Validation', () => {
	describe('validateShortcode', () => {
		it('should accept valid shortcodes', () => {
			expect(validateShortcode('abc')).toBeNull();
			expect(validateShortcode('test-123')).toBeNull();
			expect(validateShortcode('my_link')).toBeNull();
			expect(validateShortcode('A1-b2_C3')).toBeNull();
		});

		it('should reject shortcodes that are too short', () => {
			expect(validateShortcode('a')).toContain('at least 2 characters');
		});

		it('should reject shortcodes that are too long', () => {
			expect(validateShortcode('a'.repeat(51))).toContain('less than 50 characters');
		});

		it('should reject shortcodes with invalid characters', () => {
			expect(validateShortcode('test@123')).toContain('can only contain');
			expect(validateShortcode('test.com')).toContain('can only contain');
			expect(validateShortcode('test link')).toContain('can only contain');
		});

		it('should reject shortcodes starting/ending with special chars', () => {
			expect(validateShortcode('-test')).toContain('cannot start or end');
			expect(validateShortcode('test_')).toContain('cannot start or end');
		});

		it('should reject consecutive special characters', () => {
			expect(validateShortcode('test--link')).toContain('consecutive special characters');
			expect(validateShortcode('test__link')).toContain('consecutive special characters');
		});

		it('should reject reserved paths', () => {
			expect(validateShortcode('admin')).toContain('reserved');
			expect(validateShortcode('api')).toContain('reserved');
			expect(validateShortcode('auth')).toContain('reserved');
		});
	});

	describe('validateUrl', () => {
		it('should accept valid URLs', () => {
			expect(validateUrl('https://example.com')).toBeNull();
			expect(validateUrl('http://test.org/path')).toBeNull();
			expect(validateUrl('https://sub.domain.com:8080/path?query=value')).toBeNull();
		});

		it('should reject URLs without http(s)', () => {
			expect(validateUrl('example.com')).toContain('must start with http');
			expect(validateUrl('ftp://example.com')).toContain('must start with http');
		});

		it('should reject localhost URLs', () => {
			expect(validateUrl('http://localhost:3000')).toContain('localhost');
			expect(validateUrl('http://127.0.0.1')).toContain('localhost');
		});

		it('should reject private network URLs', () => {
			expect(validateUrl('http://192.168.1.1')).toContain('private network');
			expect(validateUrl('http://10.0.0.1')).toContain('private network');
			expect(validateUrl('http://test.local')).toContain('private network');
		});

		it('should reject URLs with dangerous content', () => {
			expect(validateUrl('http://example.com/javascript:alert(1)')).toContain('unsafe');
			expect(validateUrl('http://example.com/data:text/html')).toContain('unsafe');
		});

		it('should reject URLs that are too long', () => {
			const longUrl = 'https://example.com/' + 'a'.repeat(2050);
			expect(validateUrl(longUrl)).toContain('less than 2048');
		});
	});

	describe('validateDescription', () => {
		it('should accept valid descriptions', () => {
			expect(validateDescription('')).toBeNull();
			expect(validateDescription('Test description')).toBeNull();
			expect(validateDescription(undefined)).toBeNull();
		});

		it('should reject descriptions that are too long', () => {
			expect(validateDescription('a'.repeat(201))).toContain('less than 200');
		});
	});

	describe('validateRedirectType', () => {
		it('should accept valid redirect types', () => {
			expect(validateRedirectType(301)).toBeNull();
			expect(validateRedirectType(302)).toBeNull();
			expect(validateRedirectType(307)).toBeNull();
			expect(validateRedirectType(308)).toBeNull();
		});

		it('should reject invalid redirect types', () => {
			expect(validateRedirectType(200)).toContain('must be 301, 302, 307, or 308');
			expect(validateRedirectType(404)).toContain('must be 301, 302, 307, or 308');
		});
	});

	describe('validateTags', () => {
		it('should accept valid tags', () => {
			expect(validateTags(['tag1', 'tag2'])).toBeNull();
			expect(validateTags(['work', 'personal'])).toBeNull();
			expect(validateTags([])).toBeNull();
			expect(validateTags(undefined)).toBeNull();
		});

		it('should reject too many tags', () => {
			const tooMany = Array.from({ length: 21 }, (_, i) => `tag${i}`);
			expect(validateTags(tooMany)).toContain('Too many tags');
		});

		it('should reject tags that are too long', () => {
			expect(validateTags(['a'.repeat(33)])).toContain('Tag length');
		});

		it('should reject tags with invalid characters', () => {
			expect(validateTags(['tag with spaces'])).toContain('letters, numbers, hyphens');
			expect(validateTags(['tag@special'])).toContain('letters, numbers, hyphens');
		});

		it('should reject empty tag strings', () => {
			expect(validateTags(['valid', ''])).toContain('cannot be empty');
		});
	});
});

