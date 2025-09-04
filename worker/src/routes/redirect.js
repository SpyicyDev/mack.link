import { logger } from '../logger.js';
import { withCors } from '../cors.js';
import { recordClick } from '../analytics.js';
import { dbGet, dbRun } from '../db.js';
import { verifyPasswordSession, renderPasswordPrompt } from './password.js';

export async function handleRedirect(request, env, requestLogger = logger, ctx) {
	const url = new URL(request.url);
	const shortcode = url.pathname.slice(1);
	if (!shortcode || shortcode.startsWith('api/')) return null;
	const row = await dbGet(
		env,
		`SELECT url, description, redirect_type, archived, activates_at, expires_at, clicks, password_enabled, password_hash FROM links WHERE shortcode = ?`,
		[shortcode],
	);
	if (!row) {
		requestLogger.info('Link not found', { shortcode });
		return htmlError(env, request, 404, 'Link not found', 'The short link you requested does not exist.');
	}
	const link = {
		url: row.url,
		description: row.description,
		redirectType: row.redirect_type || 301,
		archived: !!row.archived,
		activatesAt: row.activates_at,
		expiresAt: row.expires_at,
		clicks: row.clicks || 0,
		passwordEnabled: !!row.password_enabled,
		passwordHash: row.password_hash,
	};
	// Enforce activation/expiration and archive
	if (link.archived) {
		return htmlError(env, request, 404, 'Link archived', 'This link has been archived and is no longer available.');
	}
	if (link.activatesAt) {
		const start = new Date(link.activatesAt).getTime();
		if (!isNaN(start) && Date.now() < start) {
			return htmlError(env, request, 404, 'Link not yet active', 'This link will activate soon. Please try again later.');
		}
	}
	if (link.expiresAt) {
		const end = new Date(link.expiresAt).getTime();
		if (!isNaN(end) && Date.now() > end) {
			return htmlError(env, request, 410, 'Link expired', 'This link has expired and is no longer available.');
		}
	}

	// Check for password protection
	if (link.passwordEnabled && link.passwordHash) {
		const url = new URL(request.url);
		const sessionToken = url.searchParams.get('session');

		// Check if valid session token provided
		if (sessionToken) {
			const isValidSession = await verifyPasswordSession(env, shortcode, sessionToken);
			if (!isValidSession) {
				return new Response(renderPasswordPrompt(shortcode, 'Session expired. Please enter password again.'), {
					status: 401,
					headers: { 'Content-Type': 'text/html; charset=utf-8' },
				});
			}
		} else {
			// No session token, show password prompt
			return new Response(renderPasswordPrompt(shortcode), {
				status: 401,
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		}
	}
	// Skip counting for bots, crawlers, and prefetch/HEAD
	const ua = request.headers.get('User-Agent') || '';
	const method = request.method || 'GET';
	const isBot =
		/(bot|spider|crawler|preview|facebookexternalhit|slackbot|discordbot|twitterbot|linkedinbot|embedly|quora link|whatsapp|skypeuripreview)/i.test(
			ua,
		);
	const isHead = method === 'HEAD';
	if (!isBot && !isHead) {
		const now = new Date().toISOString();
		await dbRun(env, `UPDATE links SET clicks = COALESCE(clicks,0) + 1, last_clicked = ? WHERE shortcode = ?`, [now, shortcode]);
		// Record analytics breakdowns
		const recordPromise = recordClick(env, request, shortcode, link.url);
		// If runtime context available, run in background
		try {
			ctx && typeof ctx.waitUntil === 'function' ? ctx.waitUntil(recordPromise) : await recordPromise;
		} catch {}
	}
	requestLogger.info('Link redirected', {
		shortcode,
		destination: link.url,
		redirectType: link.redirectType || 301,
		previousClicks: link.clicks || 0,
	});
	return Response.redirect(link.url, link.redirectType || 301);
}

function htmlError(env, request, status, title, subtitle) {
	const html = renderErrorHtml({ status, title, subtitle });
	return withCors(env, new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }), request);
}

function renderErrorHtml({ status, title, subtitle }) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(String(status))} • link.mackhaymond.co</title>
  <style>
    :root{--bg:#0b1220;--panel:rgba(17,24,39,.85);--muted:#9aa4b2;--text:#eef2f7;--accent:#2563eb;--accent-2:#60a5fa;--ring:rgba(96,165,250,.25)}
    *{box-sizing:border-box}
    body{margin:0;background:
      radial-gradient(1400px 900px at 70% -10%, rgba(32,99,235,.18), transparent 60%),
      radial-gradient(900px 600px at 0% 110%, rgba(96,165,250,.14), transparent 60%),
      conic-gradient(from 180deg at 50% 30%, rgba(96,165,250,.05), transparent 40%),
      var(--bg);
      color:var(--text);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
    .wrap{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:700px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.10);border-radius:18px;backdrop-filter:blur(12px);box-shadow:0 20px 60px rgba(0,0,0,.35)}
    .inner{padding:32px}
    .title{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px;margin:0 0 8px}
    .subtitle{margin:0 0 18px;color:var(--muted)}
    .badge{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:rgba(23,37,84,.55);color:#c7d2fe;border:1px solid rgba(99,102,241,.35);font-weight:700;font-size:12px}
    .row{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}
    .btn{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:10px 14px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.2s ease}
    .btn:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring)}
    code.k{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:2px 6px;border-radius:6px}
    .footer{margin-top:22px;color:#9aa4b2;font-size:12px}
    .logo{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#60a5fa,#2563eb);display:inline-block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="inner">
        <div class="badge"><span class="logo"></span><span>link.mackhaymond.co</span></div>
        <h1 class="title">${escapeHtml(String(title))}</h1>
        <p class="subtitle">${escapeHtml(String(subtitle))}</p>
        <div class="row">
          <a class="btn" href="https://link-management.mackhaymond.co/">Open Management</a>
          <a class="btn" href="/">Go Home</a>
        </div>
        <div class="footer">Error ${escapeHtml(String(status))} • Press <code class="k">⌘</code>/<code class="k">Ctrl</code> + <code class="k">L</code> to try another link</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
