import { getConfig } from './config.js';

function getPrimaryManagementOrigin(env) {
	const { managementOrigin } = getConfig(env);
	if (!managementOrigin || managementOrigin === '*') return null;
	const parts = String(managementOrigin).split(',').map(s => s.trim()).filter(Boolean);
	return parts[0] || null;
}

export function renderErrorPage(env, { status = 404, title = 'Link not found', message = 'The short link you requested does not exist.', shortcode }) {
	const management = getPrimaryManagementOrigin(env);
	const safeShortcode = shortcode ? String(shortcode).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
	const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} • link.mackhaymond.co</title>
  <style>
    :root { --bg:#0f172a; --card:#111827; --muted:#6b7280; --text:#e5e7eb; --primary:#2563eb; --accent:#60a5fa; --warn:#f59e0b; }
    *{box-sizing:border-box} body{margin:0; background: radial-gradient(1200px 800px at 20% -10%, #1f2937 0%, rgba(17,24,39,0) 70%), radial-gradient(1000px 600px at 80% 110%, #111827 20%, rgba(17,24,39,0) 70%), var(--bg); color:var(--text); font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"}
    .wrap{min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px}
    .card{width:100%; max-width:720px; background:linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03)), #0b1220; border:1px solid rgba(148,163,184,0.15); border-radius:16px; box-shadow: 0 10px 30px rgba(2,6,23,0.5); padding:28px}
    .row{display:flex; align-items:center; justify-content:space-between; gap:16px}
    .title{font-weight:800; font-size:28px; letter-spacing:0.2px}
    .subtitle{margin-top:6px; color:var(--muted)}
    .badge{display:inline-flex; align-items:center; gap:8px; font-weight:600; font-size:12px; color:#fca5a5; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); padding:6px 10px; border-radius:999px}
    .code{display:inline-flex; background:rgba(37,99,235,0.12); color:#bfdbfe; border:1px solid rgba(37,99,235,0.35); padding:6px 10px; border-radius:8px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;}
    .actions{margin-top:22px; display:flex; flex-wrap:wrap; gap:12px}
    .btn{appearance:none; border:none; cursor:pointer; padding:10px 14px; border-radius:10px; font-weight:600; transition: transform .05s ease, background .2s ease}
    .btn:active{transform: translateY(1px)}
    .btn-primary{background:linear-gradient(180deg, var(--accent), var(--primary)); color:white}
    .btn-secondary{background:rgba(255,255,255,0.06); color:var(--text); border:1px solid rgba(148,163,184,0.2)}
    .hint{margin-top:16px; color:var(--muted); font-size:13px}
    .footer{margin-top:32px; color:#94a3b8; font-size:12px; text-align:center}
    @media (max-width: 520px){ .row{flex-direction:column; align-items:flex-start} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="row">
        <div>
          <div class="badge">${status} • Error</div>
          <div class="title" style="margin-top:10px">${title}</div>
          <div class="subtitle">${message}</div>
        </div>
        ${safeShortcode ? `<div class="code">${locationHost()}/${safeShortcode}</div>` : ''}
      </div>
      <div class="actions">
        <a class="btn btn-primary" href="/" rel="nofollow">Go to Homepage</a>
        ${management ? `<a class="btn btn-secondary" href="${management}" rel="noopener">Open Management</a>` : ''}
      </div>
      <div class="hint">If you believe this is an error, contact the link owner or try again later.</div>
      <div class="footer">link.mackhaymond.co • Powered by Cloudflare Workers</div>
    </div>
  </div>
  <script>
    function locationHost(){ try{ return new URL(window.location.href).host } catch { return 'link.mackhaymond.co' } }
  </script>
</body>
</html>`;
	return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export function renderNotFound(env, shortcode) {
	return renderErrorPage(env, { status: 404, title: 'Link not found', message: 'The short link you requested does not exist.', shortcode });
}

export function renderNotActive(env, shortcode) {
	return renderErrorPage(env, { status: 404, title: 'Link not active yet', message: 'This short link will be available soon. Please try again later.', shortcode });
}

export function renderExpired(env, shortcode) {
	return renderErrorPage(env, { status: 410, title: 'Link expired', message: 'This short link is no longer available.', shortcode });
}

export function renderArchived(env, shortcode) {
	return renderErrorPage(env, { status: 404, title: 'Link archived', message: 'This short link has been archived by its owner.', shortcode });
}


