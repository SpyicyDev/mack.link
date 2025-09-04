// Lightweight analytics aggregation stored in KV alongside links

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

async function incrementCounter(env, key, amount = 1) {
	try {
		const current = await env.LINKS.get(key);
		const next = (parseInt(current || '0', 10) || 0) + amount;
		await env.LINKS.put(key, String(next));
	} catch {}
}

async function incrementJsonMap(env, key, field, amount = 1) {
    try {
        const current = await env.LINKS.get(key);
        let map = {};
        if (current) {
            try { map = JSON.parse(current); } catch { map = {}; }
        }
        const prev = parseInt(map[field] || 0, 10) || 0;
        map[field] = prev + amount;
        await env.LINKS.put(key, JSON.stringify(map));
    } catch {}
}

export async function recordClick(env, request, shortcode) {
	try {
		const url = new URL(request.url);
		const ref = request.headers.get('Referer') || '';
		let refHost = '';
		try { if (ref) refHost = new URL(ref).host; } catch {}
		const country = (request.cf && request.cf.country) || '??';
		const device = parseDevice(request.headers.get('User-Agent') || '');
		const day = formatDay();
		const allKey = '_all';
		await Promise.all([
			// Per-shortcode counters
			incrementCounter(env, `analytics:${shortcode}:day:${day}`, 1),
			refHost ? incrementCounter(env, `analytics:${shortcode}:ref:${refHost}`, 1) : Promise.resolve(),
			incrementCounter(env, `analytics:${shortcode}:country:${country}`, 1),
			incrementCounter(env, `analytics:${shortcode}:device:${device}`, 1),
			// Per-shortcode day-scoped breakdowns for range queries
			refHost ? incrementCounter(env, `analytics:${shortcode}:refd:${day}:${refHost}`, 1) : Promise.resolve(),
			incrementCounter(env, `analytics:${shortcode}:countryd:${day}:${country}`, 1),
			incrementCounter(env, `analytics:${shortcode}:deviced:${day}:${device}`, 1),
			// Global counters (all links)
			incrementCounter(env, `analytics:${allKey}:day:${day}`, 1),
			refHost ? incrementCounter(env, `analytics:${allKey}:ref:${refHost}`, 1) : Promise.resolve(),
			incrementCounter(env, `analytics:${allKey}:country:${country}`, 1),
			incrementCounter(env, `analytics:${allKey}:device:${device}`, 1),
			// Global day-scoped breakdowns
			refHost ? incrementCounter(env, `analytics:${allKey}:refd:${day}:${refHost}`, 1) : Promise.resolve(),
			incrementCounter(env, `analytics:${allKey}:countryd:${day}:${country}`, 1),
			incrementCounter(env, `analytics:${allKey}:deviced:${day}:${device}`, 1),
			// Aggregated JSON maps to avoid list operations later
			// Global totals (for overview)
			incrementCounter(env, `analytics:${allKey}:totalClicks`, 1),
			// Overall breakdown aggregations
			refHost ? incrementJsonMap(env, `analytics:${shortcode}:ref:_agg`, refHost, 1) : Promise.resolve(),
			incrementJsonMap(env, `analytics:${shortcode}:country:_agg`, country, 1),
			incrementJsonMap(env, `analytics:${shortcode}:device:_agg`, device, 1),
			refHost ? incrementJsonMap(env, `analytics:${allKey}:ref:_agg`, refHost, 1) : Promise.resolve(),
			incrementJsonMap(env, `analytics:${allKey}:country:_agg`, country, 1),
			incrementJsonMap(env, `analytics:${allKey}:device:_agg`, device, 1),
			// Day-scoped breakdown aggregations
			refHost ? incrementJsonMap(env, `analytics:${shortcode}:refd:${day}:_agg`, refHost, 1) : Promise.resolve(),
			incrementJsonMap(env, `analytics:${shortcode}:countryd:${day}:_agg`, country, 1),
			incrementJsonMap(env, `analytics:${shortcode}:deviced:${day}:_agg`, device, 1),
			refHost ? incrementJsonMap(env, `analytics:${allKey}:refd:${day}:_agg`, refHost, 1) : Promise.resolve(),
			incrementJsonMap(env, `analytics:${allKey}:countryd:${day}:_agg`, country, 1),
			incrementJsonMap(env, `analytics:${allKey}:deviced:${day}:_agg`, device, 1)
		]);
	} catch {}
}

export async function getTimeseries(env, shortcode, fromISO, toISO) {
	const from = new Date(fromISO);
	const to = new Date(toISO);
	if (isNaN(from) || isNaN(to) || from > to) return { points: [] };
	const points = [];
	const scKey = shortcode || '_all';
	for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
		const key = `analytics:${scKey}:day:${formatDay(d.getTime())}`;
		const val = await env.LINKS.get(key);
		points.push({ date: d.toISOString().slice(0, 10), clicks: parseInt(val || '0', 10) || 0 });
	}
	return { points };
}

export async function getBreakdown(env, shortcode, dimension, limit = 10, fromISO, toISO) {
	const scKey = shortcode || '_all';
	const out = [];
	// If date range provided, aggregate per-day JSON maps
	if (fromISO && toISO) {
		const from = new Date(fromISO);
		const to = new Date(toISO);
		if (!isNaN(from) && !isNaN(to) && from <= to) {
			const map = new Map();
			for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
				const dayAggKey = `analytics:${scKey}:${dimension}d:${formatDay(d.getTime())}:_agg`;
				try {
					const json = await env.LINKS.get(dayAggKey);
					if (!json) continue;
					const obj = JSON.parse(json);
					for (const [k, v] of Object.entries(obj)) {
						const prev = map.get(k) || 0;
						map.set(k, prev + (parseInt(v, 10) || 0));
					}
				} catch {}
			}
			for (const [k, v] of map.entries()) out.push({ key: k, clicks: v });
		}
	} else {
		// Use overall aggregation map
		const aggKey = `analytics:${scKey}:${dimension}:_agg`;
		try {
			const json = await env.LINKS.get(aggKey);
			if (json) {
				const obj = JSON.parse(json);
				for (const [k, v] of Object.entries(obj)) {
					out.push({ key: k, clicks: parseInt(v, 10) || 0 });
				}
			}
		} catch {}
	}
	out.sort((a, b) => b.clicks - a.clicks);
	return { items: out.slice(0, limit) };
}

export async function getOverview(env, shortcode) {
	// Per-shortcode: use stored clicks as total. Global: use running counter.
	let total = 0;
	if (shortcode) {
		const link = await env.LINKS.get(shortcode);
		try { total = JSON.parse(link || '{}').clicks || 0; } catch {}
	} else {
		const globalTotal = await env.LINKS.get('analytics:_all:totalClicks');
		total = parseInt(globalTotal || '0', 10) || 0;
	}
	const scKey = shortcode || '_all';
	const todayKey = `analytics:${scKey}:day:${formatDay()}`;
	const today = parseInt((await env.LINKS.get(todayKey)) || '0', 10) || 0;
	return { totalClicks: total, clicksToday: today };
}


