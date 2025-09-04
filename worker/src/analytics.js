// Analytics using Cloudflare D1 (replaces KV)
import { dbAll, dbGet, dbRun } from './db.js';

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

async function upsertDayClicks(env, scope, day, amount = 1) {
	await dbRun(env,
		`INSERT INTO analytics_day (scope, day, clicks) VALUES (?, ?, ?)
		 ON CONFLICT(scope, day) DO UPDATE SET clicks = analytics_day.clicks + excluded.clicks`,
		[scope, day, amount]
	);
}

async function upsertAgg(env, scope, dimension, key, amount = 1) {
	await dbRun(env,
		`INSERT INTO analytics_agg (scope, dimension, key, clicks) VALUES (?, ?, ?, ?)
		 ON CONFLICT(scope, dimension, key) DO UPDATE SET clicks = analytics_agg.clicks + excluded.clicks`,
		[scope, dimension, key, amount]
	);
}

async function upsertDayAgg(env, scope, day, dimension, key, amount = 1) {
	await dbRun(env,
		`INSERT INTO analytics_day_agg (scope, day, dimension, key, clicks) VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(scope, day, dimension, key) DO UPDATE SET clicks = analytics_day_agg.clicks + excluded.clicks`,
		[scope, day, dimension, key, amount]
	);
}

async function incrementCounter(env, name, amount = 1) {
	await dbRun(env,
		`INSERT INTO counters (name, value) VALUES (?, ?)
		 ON CONFLICT(name) DO UPDATE SET value = counters.value + excluded.value`,
		[name, amount]
	);
}

export async function recordClick(env, request, shortcode) {
	try {
		const ref = request.headers.get('Referer') || '';
		let refHost = '';
		try { if (ref) refHost = new URL(ref).host; } catch {}
		const country = (request.cf && request.cf.country) || '??';
		const device = parseDevice(request.headers.get('User-Agent') || '');
		const day = formatDay();
		const allKey = '_all';
		await Promise.all([
			// Per-shortcode counters and breakdowns
			upsertDayClicks(env, shortcode, day, 1),
			refHost ? upsertAgg(env, shortcode, 'ref', refHost, 1) : Promise.resolve(),
			upsertAgg(env, shortcode, 'country', country, 1),
			upsertAgg(env, shortcode, 'device', device, 1),
			refHost ? upsertDayAgg(env, shortcode, day, 'ref', refHost, 1) : Promise.resolve(),
			upsertDayAgg(env, shortcode, day, 'country', country, 1),
			upsertDayAgg(env, shortcode, day, 'device', device, 1),
			// Global counters and breakdowns
			upsertDayClicks(env, allKey, day, 1),
			refHost ? upsertAgg(env, allKey, 'ref', refHost, 1) : Promise.resolve(),
			upsertAgg(env, allKey, 'country', country, 1),
			upsertAgg(env, allKey, 'device', device, 1),
			refHost ? upsertDayAgg(env, allKey, day, 'ref', refHost, 1) : Promise.resolve(),
			upsertDayAgg(env, allKey, day, 'country', country, 1),
			upsertDayAgg(env, allKey, day, 'device', device, 1),
			// Global total counter
			incrementCounter(env, 'analytics:_all:totalClicks', 1)
		]);
	} catch {}
}

export async function getTimeseries(env, shortcode, fromISO, toISO) {
	const from = new Date(fromISO);
	const to = new Date(toISO);
	if (isNaN(from) || isNaN(to) || from > to) return { points: [] };
	const scKey = shortcode || '_all';
	const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
	const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
	const rows = await dbAll(env,
		`SELECT day, clicks FROM analytics_day WHERE scope = ? AND day >= ? AND day <= ? ORDER BY day ASC`,
		[scKey, start, end]
	);
	const map = new Map(rows.map(r => [r.day, r.clicks]));
	const points = [];
	for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
		const k = formatDay(d.getTime());
		points.push({ date: d.toISOString().slice(0, 10), clicks: map.get(k) || 0 });
	}
	return { points };
}

export async function getBreakdown(env, shortcode, dimension, limit = 10, fromISO, toISO) {
	const scKey = shortcode || '_all';
	if (fromISO && toISO) {
		const from = new Date(fromISO);
		const to = new Date(toISO);
		if (!isNaN(from) && !isNaN(to) && from <= to) {
			const start = formatDay(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
			const end = formatDay(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
			const rows = await dbAll(env,
				`SELECT key, SUM(clicks) AS clicks
				 FROM analytics_day_agg
				 WHERE scope = ? AND dimension = ? AND day >= ? AND day <= ?
				 GROUP BY key
				 ORDER BY clicks DESC
				 LIMIT ?`,
				[scKey, dimension, start, end, limit]
			);
			return { items: rows.map(r => ({ key: r.key, clicks: r.clicks || 0 })) };
		}
	}
	const rows = await dbAll(env,
		`SELECT key, clicks FROM analytics_agg WHERE scope = ? AND dimension = ? ORDER BY clicks DESC LIMIT ?`,
		[scKey, dimension, limit]
	);
	return { items: rows.map(r => ({ key: r.key, clicks: r.clicks || 0 })) };
}

export async function getOverview(env, shortcode) {
	// Per-shortcode: use stored clicks as total. Global: use running counter.
	let total = 0;
	if (shortcode) {
		const row = await dbGet(env, `SELECT clicks FROM links WHERE shortcode = ?`, [shortcode]);
		total = (row?.clicks || 0);
	} else {
		const row = await dbGet(env, `SELECT value FROM counters WHERE name = ?`, ['analytics:_all:totalClicks']);
		total = parseInt(row?.value || '0', 10) || 0;
	}
	const scKey = shortcode || '_all';
	const todayRow = await dbGet(env, `SELECT clicks FROM analytics_day WHERE scope = ? AND day = ?`, [scKey, formatDay()]);
	const today = todayRow?.clicks || 0;
	return { totalClicks: total, clicksToday: today };
}


