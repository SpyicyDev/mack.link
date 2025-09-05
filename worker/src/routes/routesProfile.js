import { withCors } from '../cors.js';
import { dbAll, dbGet, dbRun } from '../db.js';

export async function getProfile(env, request) {
  const row = await dbGet(env, `SELECT id, title, description, avatar_url, theme, background_type, background_value, is_active, custom_css FROM profile WHERE id = 1`);
  return withCors(env, new Response(JSON.stringify(row || {}), { headers: { 'Content-Type': 'application/json' } }), request);
}

export async function updateProfile(env, request) {
  const body = await request.json();
  const fields = ['title','description','avatar_url','theme','background_type','background_value','is_active','custom_css'];
  const updates = {};
  for (const k of fields) if (k in body) updates[k] = body[k];
  if (Object.keys(updates).length === 0) return withCors(env, new Response(JSON.stringify({ error: 'No updates provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const params = [...Object.values(updates), new Date().toISOString(), 1];
  await dbRun(env, `UPDATE profile SET ${setClauses}, updated_at = ? WHERE id = ?`, params);
  const row = await dbGet(env, `SELECT id, title, description, avatar_url, theme, background_type, background_value, is_active, custom_css FROM profile WHERE id = 1`);
  return withCors(env, new Response(JSON.stringify(row || {}), { headers: { 'Content-Type': 'application/json' } }), request);
}

export async function listProfileLinks(env, request) {
  const rows = await dbAll(env, `SELECT id, title, url, icon, order_index, is_visible, click_count, created_at, updated_at FROM profile_links ORDER BY order_index ASC`);
  return withCors(env, new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } }), request);
}

export async function createProfileLink(env, request) {
  const body = await request.json();
  const { title, url, icon = '', is_visible = 1 } = body || {};
  if (!title || !url) return withCors(env, new Response(JSON.stringify({ error: 'title and url are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
  const maxOrder = await dbGet(env, `SELECT COALESCE(MAX(order_index), 0) AS max_order FROM profile_links`);
  const orderIndex = (maxOrder?.max_order || 0) + 1;
  const now = new Date().toISOString();
  await dbRun(env, `INSERT INTO profile_links (title, url, icon, order_index, is_visible, click_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`, [title, url, icon, orderIndex, is_visible ? 1 : 0, now, now]);
  const row = await dbGet(env, `SELECT id, title, url, icon, order_index, is_visible, click_count, created_at, updated_at FROM profile_links WHERE order_index = ?`, [orderIndex]);
  return withCors(env, new Response(JSON.stringify(row), { status: 201, headers: { 'Content-Type': 'application/json' } }), request);
}

export async function updateProfileLink(env, request, id) {
  if (!id) return withCors(env, new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
  const body = await request.json();
  const allowed = ['title','url','icon','is_visible'];
  const updates = {};
  for (const k of allowed) if (k in body) updates[k] = k === 'is_visible' ? (body[k] ? 1 : 0) : body[k];
  if (Object.keys(updates).length === 0) return withCors(env, new Response(JSON.stringify({ error: 'No updates provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const params = [...Object.values(updates), new Date().toISOString(), id];
  await dbRun(env, `UPDATE profile_links SET ${setClauses}, updated_at = ? WHERE id = ?`, params);
  const row = await dbGet(env, `SELECT id, title, url, icon, order_index, is_visible, click_count, created_at, updated_at FROM profile_links WHERE id = ?`, [id]);
  return withCors(env, new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } }), request);
}

export async function deleteProfileLink(env, request, id) {
  if (!id) return withCors(env, new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
  await dbRun(env, `DELETE FROM profile_links WHERE id = ?`, [id]);
  return withCors(env, new Response(null, { status: 204 }), request);
}

export async function reorderProfileLinks(env, request) {
  const body = await request.json();
  const { order } = body || {};
  if (!Array.isArray(order) || order.length === 0) return withCors(env, new Response(JSON.stringify({ error: 'order must be a non-empty array of ids' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
  let idx = 1;
  for (const id of order) {
    await dbRun(env, `UPDATE profile_links SET order_index = ?, updated_at = datetime('now') WHERE id = ?`, [idx++, id]);
  }
  const rows = await dbAll(env, `SELECT id, title, url, icon, order_index, is_visible FROM profile_links ORDER BY order_index ASC`);
  return withCors(env, new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } }), request);
}
