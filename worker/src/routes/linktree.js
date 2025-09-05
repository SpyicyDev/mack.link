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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} • link.mackhaymond.co</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <style>
    :root{--bg:#0b1220;--muted:#9aa4b2;--text:#eef2f7;--ring:rgba(96,165,250,.25)}
    *{box-sizing:border-box}
    body{margin:0;${bgStyle} color:var(--text);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
    .wrap{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:680px;text-align:center}
    .hdr{position:fixed;top:16px;right:16px;display:flex;gap:10px}
    a.btn-ghost{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:8px 12px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:.2s ease}
    a.btn-ghost:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring)}
    .avatar{width:84px;height:84px;border-radius:50%;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);object-fit:cover}
    h1{font-size:28px;margin:16px 0 6px}
    p.sub{margin:0;color:var(--muted)}
    .list{display:flex;flex-direction:column;gap:12px;margin-top:22px}
    a.link{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);padding:14px 16px;border-radius:14px;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;transition:.2s ease}
    a.link:hover{border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring);transform:translateY(-1px)}
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
  if ((l.type || 'button') === 'image' && l.image_url) {
    const alt = l.image_alt ? escapeHtml(l.image_alt) : escapeHtml(l.title || '');
    return `<a class="link" href="${href}" aria-label="${alt}"><img src="${escapeHtml(l.image_url)}" alt="${alt}" style="max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.14)" />${l.title ? `<div style="margin-top:6px;color:#9aa4b2;font-size:12px">${escapeHtml(l.title)}</div>` : ''}</a>`;
  }
  const title = escapeHtml(l.title || '');
  const subtitle = l.subtitle ? `<div style="font-size:12px;color:#9aa4b2;">${escapeHtml(l.subtitle)}</div>` : '';
  return `<a class="link" href="${href}">${title}${subtitle}</a>`;
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
