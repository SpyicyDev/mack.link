import { withCors, preflight } from './cors.js';
import { json } from './utils.js';
import { handleRedirect } from './routes/redirect.js';
import { handleAPI } from './routes/routerApi.js';
import { handleAdmin } from './routes/admin.js';
import { handleLinktree, handleProfileClick } from './routes/linktree.js';

export async function handleRequest(request, env, requestLogger, ctx) {
	const url = new URL(request.url);

	if (request.method === 'OPTIONS') {
		return preflight(env, request);
	}

	if (url.pathname.startsWith('/api/')) {
		return await handleAPI(request, env, requestLogger);
	}

	// Handle admin panel routes
	if (url.pathname.startsWith('/admin')) {
		return await handleAdmin(request, env, requestLogger);
	}

	// Linktree tracked clicks
	if (url.pathname.startsWith('/profile/c/')) {
		return await handleProfileClick(request, env);
	}

	// Root route: serve linktree page
	if (url.pathname === '/' || url.pathname === '') {
		return await handleLinktree(request, env, requestLogger);
	}

	const redirectResponse = await handleRedirect(request, env, requestLogger, ctx);
	if (redirectResponse) return redirectResponse;
	return await handleLinktree(request, env, requestLogger);
}

function renderHomeHtml() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>link.mackhaymond.co • Fast personal short links</title>
  <style>
    :root{--bg:#0b1220;--muted:#9aa4b2;--text:#eef2f7;--ring:rgba(96,165,250,.25)}
    *{box-sizing:border-box}
    body{margin:0;background:
      radial-gradient(1400px 900px at 70% -10%, rgba(32,99,235,.18), transparent 60%),
      radial-gradient(900px 600px at 0% 110%, rgba(96,165,250,.14), transparent 60%),
      conic-gradient(from 180deg at 50% 30%, rgba(96,165,250,.05), transparent 40%),
      var(--bg);
      color:var(--text);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
    .wrap{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}
    .hero{width:100%;max-width:880px;text-align:center}
    .logo{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#60a5fa,#2563eb);display:inline-block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);vertical-align:middle}
    h1{font-size:32px;margin:14px 0 8px}
    p.sub{margin:0;color:var(--muted)}
    .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px}
    a.btn{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:12px 16px;border-radius:12px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.2s ease}
    a.btn:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring)}
    .kbd{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:2px 6px;border-radius:6px}
    .foot{margin-top:20px;color:#9aa4b2;font-size:12px}
    code{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <div class="wrap">
    <main class="hero">
      <div class="logo"></div>
      <h1>link.mackhaymond.co</h1>
      <p class="sub">Fast personal URL shortener on Cloudflare Workers. Secure. Simple. Beautiful.</p>
      <div class="row">
        <a class="btn" href="/admin">Sign in to Admin</a>
        <a class="btn" href="https://github.com/SpyicyDev/mack.link">View Source</a>
      </div>
      <div class="foot">Tip: paste a shortcode after the domain to jump to a destination, e.g. <code>/github</code></div>
    </main>
  </div>
</body>
</html>`;
}
