// Analytics using Cloudflare D1 (replaces KV)
import { dbAll, dbGet, dbRun, dbBatch } from './db.js';

function formatDay(ts = Date.now()) {
	const d = new Date(ts);
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}${m}${day}`;
}

function parseDevice(userAgent = '') {
	const ua = userAgent.toLowerCase();
	if (/mobile|iphone|ipod|android(?!.*tablet)/.test(ua)) return 'mobile';
	if (/ipad|tablet/.test(ua)) return 'tablet';
	return 'desktop';
}

function parseBrowser(userAgent = '') {
	const ua = userAgent.toLowerCase();
	if (ua.includes('edg/')) return 'edge';
	if (ua.includes('chrome/') && !ua.includes('edg/')) return 'chrome';
	if (ua.includes('firefox/')) return 'firefox';
	if (ua.includes('safari/') && !ua.includes('chrome/')) return 'safari';
	if (ua.includes('opera/') || ua.includes('opr/')) return 'opera';
	return 'other';
}

function parseOS(userAgent = '') {
	const ua = userAgent.toLowerCase();
	if (ua.includes('windows nt')) return 'windows';
	if (ua.includes('mac os x') || ua.includes('macos')) return 'macos';
	if (ua.includes('linux')) return 'linux';
	if (ua.includes('android')) return 'android';
	if (ua.includes('iphone os') || ua.includes('ipad')) return 'ios';
	return 'other';
}

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

/**
 * Extract analytics context from a request
 */
function extractAnalyticsContext(request, shortcode) {
	const userAgent = request.headers.get('User-Agent') || '';
	const ref = request.headers.get('Referer') || '';
	let refHost = '';
	try {
		if (ref) refHost = new URL(ref).host;
	} catch {}

	// Enhanced analytics data from Cloudflare
	const country = (request.cf && request.cf.country) || '??';
	const city = (request.cf && request.cf.city) || '';
	const region = (request.cf && request.cf.region) || '';
	const timezone = (request.cf && request.cf.timezone) || '';

	const device = parseDevice(userAgent);
	const browser = parseBrowser(userAgent);
	const os = parseOS(userAgent);
	const utmParams = parseUTMParams(request.url);
	const day = formatDay();

	return {
		shortcode,
		userAgent,
		refHost,
		country,
		city,
		region,
		timezone,
		device,
		browser,
		os,
		utmParams,
		day,
	};
}

/**
 * Build analytics statements for a given request context
 * Consolidated builder used by both redirect handling and background processing
 */
function buildAnalyticsStatements(context) {
	const { shortcode, refHost, country, city, region, device, browser, os, timezone, utmParams, day } = context;
	const allKey = '_all';
	const statements = [];

	// SQL template for upserts
	const daySQL = `INSERT INTO analytics_day (scope, day, clicks) VALUES (?, ?, ?) ON CONFLICT(scope, day) DO UPDATE SET clicks = analytics_day.clicks + excluded.clicks`;
	const aggSQL = `INSERT INTO analytics_agg (scope, dimension, key, clicks) VALUES (?, ?, ?, ?) ON CONFLICT(scope, dimension, key) DO UPDATE SET clicks = analytics_agg.clicks + excluded.clicks`;
	const dayAggSQL = `INSERT INTO analytics_day_agg (scope, day, dimension, key, clicks) VALUES (?, ?, ?, ?, ?) ON CONFLICT(scope, day, dimension, key) DO UPDATE SET clicks = analytics_day_agg.clicks + excluded.clicks`;
	const counterSQL = `INSERT INTO counters (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = counters.value + excluded.value`;

	// Per-shortcode daily clicks
	statements.push({ sql: daySQL, bindings: [shortcode, day, 1] });

	// Per-shortcode aggregations
	if (refHost) statements.push({ sql: aggSQL, bindings: [shortcode, 'ref', refHost, 1] });
	statements.push({ sql: aggSQL, bindings: [shortcode, 'country', country, 1] });
	if (city) statements.push({ sql: aggSQL, bindings: [shortcode, 'city', `${city}, ${region || country}`, 1] });
	statements.push({ sql: aggSQL, bindings: [shortcode, 'device', device, 1] });
	statements.push({ sql: aggSQL, bindings: [shortcode, 'browser', browser, 1] });
	statements.push({ sql: aggSQL, bindings: [shortcode, 'os', os, 1] });
	if (timezone) statements.push({ sql: aggSQL, bindings: [shortcode, 'timezone', timezone, 1] });

	// UTM parameters
	if (utmParams.source) statements.push({ sql: aggSQL, bindings: [shortcode, 'utm_source', utmParams.source, 1] });
	if (utmParams.medium) statements.push({ sql: aggSQL, bindings: [shortcode, 'utm_medium', utmParams.medium, 1] });
	if (utmParams.campaign) statements.push({ sql: aggSQL, bindings: [shortcode, 'utm_campaign', utmParams.campaign, 1] });

	// Per-shortcode daily aggregations
	if (refHost) statements.push({ sql: dayAggSQL, bindings: [shortcode, day, 'ref', refHost, 1] });
	statements.push({ sql: dayAggSQL, bindings: [shortcode, day, 'country', country, 1] });
	statements.push({ sql: dayAggSQL, bindings: [shortcode, day, 'device', device, 1] });
	statements.push({ sql: dayAggSQL, bindings: [shortcode, day, 'browser', browser, 1] });
	statements.push({ sql: dayAggSQL, bindings: [shortcode, day, 'os', os, 1] });

	// Global daily clicks
	statements.push({ sql: daySQL, bindings: [allKey, day, 1] });

	// Global aggregations
	if (refHost) statements.push({ sql: aggSQL, bindings: [allKey, 'ref', refHost, 1] });
	statements.push({ sql: aggSQL, bindings: [allKey, 'country', country, 1] });
	if (city) statements.push({ sql: aggSQL, bindings: [allKey, 'city', `${city}, ${region || country}`, 1] });
	statements.push({ sql: aggSQL, bindings: [allKey, 'device', device, 1] });
	statements.push({ sql: aggSQL, bindings: [allKey, 'browser', browser, 1] });
	statements.push({ sql: aggSQL, bindings: [allKey, 'os', os, 1] });

	// Global UTM tracking
	if (utmParams.source) statements.push({ sql: aggSQL, bindings: [allKey, 'utm_source', utmParams.source, 1] });
	if (utmParams.medium) statements.push({ sql: aggSQL, bindings: [allKey, 'utm_medium', utmParams.medium, 1] });
	if (utmParams.campaign) statements.push({ sql: aggSQL, bindings: [allKey, 'utm_campaign', utmParams.campaign, 1] });

	// Global daily aggregations
	if (refHost) statements.push({ sql: dayAggSQL, bindings: [allKey, day, 'ref', refHost, 1] });
	statements.push({ sql: dayAggSQL, bindings: [allKey, day, 'country', country, 1] });
	statements.push({ sql: dayAggSQL, bindings: [allKey, day, 'device', device, 1] });
	statements.push({ sql: dayAggSQL, bindings: [allKey, day, 'browser', browser, 1] });
	statements.push({ sql: dayAggSQL, bindings: [allKey, day, 'os', os, 1] });

	// Global total counter
	statements.push({ sql: counterSQL, bindings: ['analytics:_all:totalClicks', 1] });

	return statements;
}

/**
 * Get analytics statements without executing them
 * This allows for transactional operations with other queries
 */
export async function getAnalyticsStatements(env, request, shortcode, destinationUrl = '', requestLogger) {
	try {
		const context = extractAnalyticsContext(request, shortcode);
		return buildAnalyticsStatements(context);
	} catch (error) {
		if (requestLogger) {
			requestLogger.error('Analytics statement generation failed', {
				shortcode,
				error: error.message,
			});
		}
		// Return empty array on error to prevent transaction failure
		return [];
	}
}

/**
 * Record a click event with full analytics tracking
 */
export async function recordClick(env, request, shortcode, destinationUrl = '', requestLogger) {
	try {
		const context = extractAnalyticsContext(request, shortcode);
		const statements = buildAnalyticsStatements(context);
		await dbBatch(env, statements);
	} catch (error) {
		if (requestLogger) {
			requestLogger.error('Analytics recording failed', {
				shortcode,
				error: error.message,
				statementCount: statements?.length || 0,
			});
		}
		// Re-throw to surface in waitUntil context for monitoring
		throw error;
	}
}

export async function getTimeseries(env, shortcode, fromISO, toISO) {
	const from = new Date(fromISO);
	const to = new Date(toISO);
	if (isNaN(from) || isNaN(to) || from > to) return { points: [] };
	const scKey = shortcode || '_all';
	const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
	const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
	const rows = await dbAll(env, `SELECT day, clicks FROM analytics_day WHERE scope = ? AND day >= ? AND day <= ? ORDER BY day ASC`, [
		scKey,
		start,
		end,
	]);
	const map = new Map(rows.map((r) => [r.day, r.clicks]));
	const points = [];
	for (
		let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
		d <= to;
		d.setUTCDate(d.getUTCDate() + 1)
	) {
		const k = formatDay(d.getTime());
		points.push({ date: d.toISOString().slice(0, 10), clicks: map.get(k) || 0 });
	}
	return { points };
}

// Returns time series per shortcode for the top N links in the date range
export async function getTimeseriesByLinks(env, fromISO, toISO, limit = 5) {
	const from = new Date(fromISO);
	const to = new Date(toISO);
	if (isNaN(from) || isNaN(to) || from > to) return { labels: [], series: [] };
	const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
	const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

	// Top N shortcodes by clicks in the window (exclude global scope)
	const topRows = await dbAll(
		env,
		`SELECT scope AS shortcode, SUM(clicks) AS total
		 FROM analytics_day
		 WHERE scope != '_all' AND day >= ? AND day <= ?
		 GROUP BY scope
		 ORDER BY total DESC
		 LIMIT ?`,
		[start, end, limit],
	);
	if (!topRows.length) return { labels: [], series: [] };
	const shortcodes = topRows.map((r) => r.shortcode);

	// Fetch all rows for these shortcodes in a single query
	const placeholders = shortcodes.map(() => '?').join(',');
	const rows = await dbAll(
		env,
		`SELECT scope AS shortcode, day, clicks
		 FROM analytics_day
		 WHERE scope IN (${placeholders}) AND day >= ? AND day <= ?
		 ORDER BY day ASC`,
		[...shortcodes, start, end],
	);

	// Build day labels
	const labels = [];
	for (
		let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
		d <= to;
		d.setUTCDate(d.getUTCDate() + 1)
	) {
		labels.push(d.toISOString().slice(0, 10));
	}

	// Index rows per shortcode/day
	const byShortcode = new Map(shortcodes.map((sc) => [sc, new Map()]));
	for (const r of rows) {
		const m = byShortcode.get(r.shortcode);
		if (m) m.set(r.day, r.clicks);
	}

	const series = shortcodes.map((sc) => {
		const m = byShortcode.get(sc) || new Map();
		const values = labels.map((iso) => m.get(iso.replace(/-/g, '')) || 0);
		const total = values.reduce((a, b) => a + b, 0);
		return { shortcode: sc, total, values };
	});

	return { labels, series };
}

export async function getBreakdown(env, shortcode, dimension, limit = 10, fromISO, toISO) {
	const scKey = shortcode || '_all';
	if (fromISO && toISO) {
		const from = new Date(fromISO);
		const to = new Date(toISO);
		if (!isNaN(from) && !isNaN(to) && from <= to) {
			const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
			const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
			const rows = await dbAll(
				env,
				`SELECT key, SUM(clicks) AS clicks
				 FROM analytics_day_agg
				 WHERE scope = ? AND dimension = ? AND day >= ? AND day <= ?
				 GROUP BY key
				 ORDER BY clicks DESC
				 LIMIT ?`,
				[scKey, dimension, start, end, limit],
			);
			return { items: rows.map((r) => ({ key: r.key, clicks: r.clicks || 0 })) };
		}
	}
	const rows = await dbAll(env, `SELECT key, clicks FROM analytics_agg WHERE scope = ? AND dimension = ? ORDER BY clicks DESC LIMIT ?`, [
		scKey,
		dimension,
		limit,
	]);
	return { items: rows.map((r) => ({ key: r.key, clicks: r.clicks || 0 })) };
}

export async function getOverview(env, shortcode) {
	// Per-shortcode: use stored clicks as total. Global: use running counter.
	let total = 0;
	if (shortcode) {
		const row = await dbGet(env, `SELECT clicks FROM links WHERE shortcode = ?`, [shortcode]);
		total = row?.clicks || 0;
	} else {
		const row = await dbGet(env, `SELECT value FROM counters WHERE name = ?`, ['analytics:_all:totalClicks']);
		total = parseInt(row?.value || '0', 10) || 0;
	}
	const scKey = shortcode || '_all';
	const todayRow = await dbGet(env, `SELECT clicks FROM analytics_day WHERE scope = ? AND day = ?`, [scKey, formatDay()]);
	const today = todayRow?.clicks || 0;

	// Calculate 7-day trend
	const sevenDaysAgo = formatDay(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const trendRows = await dbAll(env, `SELECT day, clicks FROM analytics_day WHERE scope = ? AND day >= ? ORDER BY day ASC`, [
		scKey,
		sevenDaysAgo,
	]);

	const weeklyTotal = trendRows.reduce((sum, row) => sum + row.clicks, 0);
	const averageDaily = weeklyTotal > 0 ? Math.round((weeklyTotal / 7) * 100) / 100 : 0;

	return {
		totalClicks: total,
		clicksToday: today,
		weeklyTotal,
		averageDaily,
		trend: trendRows,
	};
}

export async function exportAnalytics(env, shortcode, fromISO, toISO, format = 'json') {
	const scKey = shortcode || '_all';
	const from = new Date(fromISO);
	const to = new Date(toISO);

	if (isNaN(from) || isNaN(to) || from > to) {
		throw new Error('Invalid date range');
	}

	const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
	const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

	// Get timeseries data
	const timeseries = await getTimeseries(env, shortcode, fromISO, toISO);

	// Get breakdown data for multiple dimensions
	const dimensions = ['ref', 'country', 'device', 'browser', 'os', 'utm_source', 'utm_medium', 'utm_campaign'];
	const breakdowns = {};

	for (const dimension of dimensions) {
		breakdowns[dimension] = await getBreakdown(env, shortcode, dimension, 20, fromISO, toISO);
	}

	const overview = await getOverview(env, shortcode);

	const exportData = {
		scope: shortcode ? `shortcode:${shortcode}` : 'global',
		dateRange: { from: fromISO, to: toISO },
		overview,
		timeseries,
		breakdowns,
		exportedAt: new Date().toISOString(),
	};

	return exportData;
}
