import { withCors } from '../cors.js';
import { dbGet } from '../db.js';

function parseJsonSafe(text, fallback) {
	try { return JSON.parse(text); } catch { return fallback; }
}

async function fetchWorkersUsage(env) {
	const accountId = env.CF_ACCOUNT_ID;
	const token = env.CF_API_TOKEN;
	if (!accountId || !token) {
		return { available: false, message: 'Set CF_ACCOUNT_ID and CF_API_TOKEN to enable Workers usage.' };
	}
	const since = new Date(Date.now() - 24*60*60*1000).toISOString();
	const until = new Date().toISOString();
	const query = `{
		viewer { accounts(filter: { accountTag: "${accountId}" }) {
			workersInvocationsAdaptive(
				limit: 10000
				filter: { datetime_geq: "${since}", datetime_leq: "${until}" }
			) { sum { requests subrequests cpuMs wallTimeMs } }
		} }
	}`;
	try {
		const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		});
		const data = await res.json();
		const acct = data?.data?.viewer?.accounts?.[0];
		const sums = acct?.workersInvocationsAdaptive?.[0]?.sum || {};
		return {
			available: true,
			daily: { requests: sums.requests || 0, subrequests: sums.subrequests || 0, cpuMs: sums.cpuMs || 0, wallTimeMs: sums.wallTimeMs || 0 }
		};
	} catch (e) {
		return { available: false, message: 'Failed to fetch Workers usage.' };
	}
}

export async function getUsage(env, request) {
	// Limits can be supplied via USAGE_LIMITS JSON env var (optional)
	const limits = env.USAGE_LIMITS ? parseJsonSafe(env.USAGE_LIMITS, {}) : {};

	// D1 approximations via row counts
	const linksCountRow = await dbGet(env, 'SELECT COUNT(*) AS c FROM links');
	const aDayRow = await dbGet(env, 'SELECT COUNT(*) AS c FROM analytics_day');
	const aAggRow = await dbGet(env, 'SELECT COUNT(*) AS c FROM analytics_agg');
	const aDayAggRow = await dbGet(env, 'SELECT COUNT(*) AS c FROM analytics_day_agg');

	const workers = await fetchWorkersUsage(env);

	const body = {
		limits,
		workers,
		d1: {
			linksCount: linksCountRow?.c || 0,
			analyticsDayCount: aDayRow?.c || 0,
			analyticsAggCount: aAggRow?.c || 0,
			analyticsDayAggCount: aDayAggRow?.c || 0
		}
	};
	return withCors(env, new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }), request);
}


