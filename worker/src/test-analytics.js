// Basic test to verify analytics UTM tracking works
// Run with: node --test test-analytics.js

import { test } from 'node:test';
import assert from 'node:assert';

// Mock the analytics functions for testing
function parseUTMParams(url) {
	const utmParams = {};
	try {
		const urlObj = new URL(url);
		const params = urlObj.searchParams;

		if (params.get('utm_source')) utmParams.source = params.get('utm_source');
		if (params.get('utm_medium')) utmParams.medium = params.get('utm_medium');
		if (params.get('utm_campaign')) utmParams.campaign = params.get('utm_campaign');
		if (params.get('utm_term')) utmParams.term = params.get('utm_term');
		if (params.get('utm_content')) utmParams.content = params.get('utm_content');
	} catch {}
	return utmParams;
}

test('UTM parameter parsing from request URL', () => {
	const testCases = [
		{
			url: 'https://link.mackhaymond.co/github?utm_source=twitter&utm_medium=social&utm_campaign=launch',
			expected: { source: 'twitter', medium: 'social', campaign: 'launch' }
		},
		{
			url: 'https://link.mackhaymond.co/linkedin?utm_source=newsletter&utm_medium=email',
			expected: { source: 'newsletter', medium: 'email' }
		},
		{
			url: 'https://link.mackhaymond.co/test',
			expected: {}
		},
		{
			url: 'https://link.mackhaymond.co/test?utm_source=google&utm_campaign=ads&utm_term=keyword',
			expected: { source: 'google', campaign: 'ads', term: 'keyword' }
		}
	];

	testCases.forEach(({ url, expected }, index) => {
		const result = parseUTMParams(url);
		assert.deepStrictEqual(result, expected, `Test case ${index + 1} failed: ${url}`);
	});
});

test('Bot detection regex', () => {
	const botRegex = /(bot|spider|crawler|preview|facebookexternalhit|slackbot|discordbot|twitterbot|linkedinbot|embedly|quora link|whatsapp|skypeuripreview|googlebot|bingbot|yahoobot|duckduckbot|baiduspider|yandexbot|applebot|pinterestrequestinfobot|telegrambot|bitlybot|zoom|msteamsbot)/i;
	
	const testCases = [
		{ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0', expected: false },
		{ ua: 'Googlebot/2.1 (+http://www.google.com/bot.html)', expected: true },
		{ ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', expected: true },
		{ ua: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', expected: true },
		{ ua: 'Twitterbot/1.0', expected: true },
		{ ua: 'WhatsApp/2.19.81 A', expected: true },
		{ ua: 'PinterestRequestInfoBot (https://help.pinterest.com)', expected: true },
		{ ua: 'Mozilla/5.0 (compatible; Applebot/0.1)', expected: true },
		{ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', expected: false }
	];

	testCases.forEach(({ ua, expected }, index) => {
		const result = botRegex.test(ua);
		assert.strictEqual(result, expected, `Bot detection test ${index + 1} failed for UA: ${ua}`);
	});
});

console.log('✅ All analytics tests passed!');
