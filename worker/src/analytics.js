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

export async function recordClick(env, request, shortcode) {
	try {
		const url = new URL(request.url);
		const ref = request.headers.get('Referer') || '';
		let refHost = '';
		try { if (ref) refHost = new URL(ref).host; } catch {}
		const country = (request.cf && request.cf.country) || '??';
		const device = parseDevice(request.headers.get('User-Agent') || '');
		const day = formatDay();
		await Promise.all([
			incrementCounter(env, `analytics:${shortcode}:day:${day}`, 1),
			refHost ? incrementCounter(env, `analytics:${shortcode}:ref:${refHost}`, 1) : Promise.resolve(),
			incrementCounter(env, `analytics:${shortcode}:country:${country}`, 1),
			incrementCounter(env, `analytics:${shortcode}:device:${device}`, 1)
		]);
	} catch {}
}

export async function getTimeseries(env, shortcode, fromISO, toISO) {
	const from = new Date(fromISO);
	const to = new Date(toISO);
	if (isNaN(from) || isNaN(to) || from > to) return { points: [] };
	const points = [];
	for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
		const key = `analytics:${shortcode}:day:${formatDay(d.getTime())}`;
		const val = await env.LINKS.get(key);
		points.push({ date: d.toISOString().slice(0, 10), clicks: parseInt(val || '0', 10) || 0 });
	}
	return { points };
}

export async function getBreakdown(env, shortcode, dimension, limit = 10) {
	const prefix = `analytics:${shortcode}:${dimension}:`;
	const out = [];
	let cursor;
	do {
		const res = await env.LINKS.list({ prefix, cursor, limit: 1000 });
		for (const k of res.keys) {
			const val = parseInt((await env.LINKS.get(k.name)) || '0', 10) || 0;
			out.push({ key: k.name.slice(prefix.length), clicks: val });
		}
		cursor = res.list_complete ? undefined : res.cursor;
	} while (cursor);
	out.sort((a, b) => b.clicks - a.clicks);
	return { items: out.slice(0, limit) };
}

export async function getOverview(env, shortcode) {
	// Use link stored clicks as total, and today's clicks from day counter
	const link = await env.LINKS.get(shortcode);
	let total = 0;
	try { total = JSON.parse(link || '{}').clicks || 0; } catch {}
	const todayKey = `analytics:${shortcode}:day:${formatDay()}`;
	const today = parseInt((await env.LINKS.get(todayKey)) || '0', 10) || 0;
	return { totalClicks: total, clicksToday: today };
}


