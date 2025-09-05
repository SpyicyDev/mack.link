import { withCors } from '../cors.js';
import { dbAll, dbGet, dbRun } from '../db.js';

export async function handleLinktree(request, env, logger) {
  try {
    const profile = await dbGet(env, `SELECT id, title, description, avatar_url, theme, background_type, background_value, is_active, custom_css FROM profile WHERE id = 1`);
const links = await dbAll(env, `SELECT id, title, subtitle, url, icon, type, image_url, image_alt FROM profile_links WHERE is_visible = 1 ORDER BY order_index ASC`);

    const html = renderLinktreeHtml({ profile, links });
    return withCors(env, new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }), request);
  } catch (err) {
    logger?.error('Failed to render linktree', { error: String(err) });
    return withCors(env, new Response('Unable to render page', { status: 500 }), request);
  }
}

export async function handleProfileClick(request, env) {
  // Route: /profile/c/:id → increments click_count then 302 to target URL
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const id = Number(parts[3] || 0);
  if (!id) return new Response('Bad Request', { status: 400 });

  const row = await dbGet(env, `SELECT url FROM profile_links WHERE id = ?`, [id]);
  if (!row) return new Response('Not Found', { status: 404 });

  // Fire-and-forget increment
  await dbRun(env, `UPDATE profile_links SET click_count = click_count + 1, updated_at = datetime('now') WHERE id = ?`, [id]);

  return new Response(null, { status: 302, headers: { Location: row.url } });
}

function renderLinktreeHtml({ profile, links }) {
  const title = profile?.title || 'Links';
  const desc = profile?.description || '';
  const avatar = profile?.avatar_url || '';
  const bgType = profile?.background_type || 'gradient';
  const bgValue = profile?.background_value || 'blue-purple';
  const customCss = profile?.custom_css || '';

  const bgStyle = backgroundStyle(bgType, bgValue);
  const ogImage = avatar || (links.find(l => l.image_url)?.image_url || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} • link.mackhaymond.co</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="theme-color" content="#0b1220" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  ${ogImage ? `<meta property=\"og:image\" content=\"${escapeHtml(ogImage)}\" />` : ''}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
  <style>
    :root{--bg:#0b1220;--muted:#9aa4b2;--text:#eef2f7;--ring:rgba(96,165,250,.25)}
    *{box-sizing:border-box}
    body{margin:0;${bgStyle} color:var(--text);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
    .wrap{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:720px;text-align:center}
    .hdr{position:fixed;top:16px;right:16px;display:flex;gap:10px}
    a.btn-ghost{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:8px 12px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.2s ease}
    a.btn-ghost:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring)}
    .avatar{width:96px;height:96px;border-radius:50%;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);object-fit:cover}
    h1{font-size:28px;margin:16px 0 6px}
    p.sub{margin:0;color:var(--muted)}
    .list{display:flex;flex-direction:column;gap:14px;margin-top:22px}
    a.link-card{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:0;border-radius:16px;cursor:pointer;text-decoration:none;display:block;overflow:hidden;transition:.2s ease}
    a.link-card:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring);transform:translateY(-1px)}
    .thumb{width:100%;display:block;max-height:240px;object-fit:cover;border-bottom:1px solid rgba(255,255,255,.12)}
    .content{padding:14px 16px}
    .title{font-weight:600;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}
    .icon{opacity:.9}
    .desc{margin-top:6px;font-size:13px;color:var(--muted)}
    .foot{margin-top:22px;color:#9aa4b2;font-size:12px}
    ${customCss}
  </style>
</head>
<body>
  <div class="hdr">
    <a class="btn-ghost" href="/admin" aria-label="Sign in to Admin">Admin</a>
    <a class="btn-ghost" href="https://github.com/SpyicyDev/mack.link" target="_blank" rel="noopener">Source</a>
  </div>
  <div class="wrap">
    <main class="card">
      ${avatar ? `<img class="avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(title)}" />` : ''}
      <h1>${escapeHtml(title)}</h1>
      ${desc ? `<p class="sub">${escapeHtml(desc)}</p>` : ''}
      <div class="list">
        ${links.map(l => renderLink(l)).join('')}
      </div>
      <div class="foot">Built with Cloudflare Workers</div>
    </main>
  </div>
</body>
</html>`;
}

function renderLink(l) {
  const href = `/profile/c/${l.id}`;
  const hasImage = !!(l.image_url);
  const title = escapeHtml(l.title || '');
  const desc = l.subtitle ? `<div class=\"desc\">${escapeHtml(l.subtitle)}</div>` : '';
  const icon = l.icon ? `<span class=\"icon\">${escapeHtml(l.icon)}</span>` : '';
  const image = hasImage ? `<img class=\"thumb\" src=\"${escapeHtml(l.image_url)}\" alt=\"${escapeHtml(l.image_alt || l.title || '')}\" />` : '';
  return `
    <a class="link-card" href="${href}">
      ${image}
      <div class="content">
        <div class="title">${icon}${title}</div>
        ${desc}
      </div>
    </a>
  `;
}

function backgroundStyle(type, value) {
  if (type === 'solid') return `background:${cssColor(value)}`;
  if (type === 'image') return `background:url(${cssUrl(value)}) center/cover no-repeat fixed`;
  // default gradient presets
  if (value === 'blue-purple') {
    return `background:
      radial-gradient(1400px 900px at 70% -10%, rgba(32,99,235,.18), transparent 60%),
      radial-gradient(900px 600px at 0% 110%, rgba(168,85,247,.14), transparent 60%),
      conic-gradient(from 180deg at 50% 30%, rgba(96,165,250,.06), transparent 40%),
      #0b1220;`;
  }
  return `background: #0b1220`;
}

function cssColor(x) { return String(x).replace(/[^#a-zA-Z0-9(),.\s-]/g, ''); }
function cssUrl(x) { return String(x).replace(/["'()]/g, ''); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
