import { withCors } from '../cors.js';
import { verifyPasswordHash, generateSessionToken } from '../password.js';
import { dbGet, dbRun } from '../db.js';

/**
 * Handle password verification for protected links
 */
export async function handlePasswordVerification(request, env) {
	if (request.method !== 'POST') {
		return withCors(env, new Response('Method not allowed', { status: 405 }), request);
	}

	try {
		const { shortcode, password } = await request.json();

		if (!shortcode || !password) {
			return withCors(
				env,
				new Response(JSON.stringify({ error: 'Shortcode and password are required' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}),
				request,
			);
		}

		// Get link data including password hash
		const link = await dbGet(
			env,
			`SELECT password_hash, password_enabled, url, archived, activates_at, expires_at FROM links WHERE shortcode = ?`,
			[shortcode],
		);

		if (!link) {
			return withCors(
				env,
				new Response(JSON.stringify({ error: 'Link not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				}),
				request,
			);
		}

		// Check if link is accessible
		if (link.archived) {
			return withCors(
				env,
				new Response(JSON.stringify({ error: 'Link is archived' }), {
					status: 410,
					headers: { 'Content-Type': 'application/json' },
				}),
				request,
			);
		}

		// Check activation time
		if (link.activates_at) {
			const activateTime = new Date(link.activates_at).getTime();
			if (!isNaN(activateTime) && Date.now() < activateTime) {
				return withCors(
					env,
					new Response(JSON.stringify({ error: 'Link is not yet active' }), {
						status: 403,
						headers: { 'Content-Type': 'application/json' },
					}),
					request,
				);
			}
		}

		// Check expiration time
		if (link.expires_at) {
			const expireTime = new Date(link.expires_at).getTime();
			if (!isNaN(expireTime) && Date.now() > expireTime) {
				return withCors(
					env,
					new Response(JSON.stringify({ error: 'Link has expired' }), {
						status: 410,
						headers: { 'Content-Type': 'application/json' },
					}),
					request,
				);
			}
		}

		// Check if password protection is enabled
		if (!link.password_enabled || !link.password_hash) {
			return withCors(
				env,
				new Response(JSON.stringify({ error: 'This link is not password protected' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}),
				request,
			);
		}

		// Verify password
		console.log('Verifying password for shortcode:', shortcode);
		const isValidPassword = await verifyPasswordHash(password, link.password_hash);

		if (!isValidPassword) {
			console.log('Password verification failed for shortcode:', shortcode);
			return withCors(
				env,
				new Response(JSON.stringify({ error: 'Invalid password' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				}),
				request,
			);
		}

		// Generate session token for this link
		const sessionToken = generateSessionToken();

		// Store session in D1 with 1 hour expiration
		const sessionKey = `pwd_session:${shortcode}:${sessionToken}`;
		const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
		await dbRun(env, `INSERT OR REPLACE INTO counters (name, value) VALUES (?, ?)`, [sessionKey, expiresAt]);

		console.log('Password verification successful', { shortcode, sessionToken, url: link.url });

		return withCors(
			env,
			new Response(
				JSON.stringify({
					success: true,
					sessionToken,
					url: link.url,
					message: 'Password verified successfully',
				}),
				{
					headers: { 'Content-Type': 'application/json' },
				},
			),
			request,
		);
	} catch (error) {
		console.error('Password verification error:', error);
		return withCors(
			env,
			new Response(JSON.stringify({ error: 'Invalid request format' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}),
			request,
		);
	}
}

/**
 * Verify if a session token is valid for a protected link
 */
export async function verifyPasswordSession(env, shortcode, sessionToken) {
	if (!shortcode || !sessionToken) {
		return false;
	}

	try {
		const sessionKey = `pwd_session:${shortcode}:${sessionToken}`;
		const session = await dbGet(env, `SELECT value FROM counters WHERE name = ?`, [sessionKey]);

		if (!session) {
			return false;
		}

		// Check if session has expired
		const expiresAt = new Date(session.value);
		if (Date.now() > expiresAt.getTime()) {
			// Clean up expired session
			await dbRun(env, `DELETE FROM counters WHERE name = ?`, [sessionKey]);
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Render password prompt page
 */
export function renderPasswordPrompt(shortcode, error = null) {
	const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Password Required • link.mackhaymond.co</title>
  <style>
    :root{--bg:#0b1220;--panel:rgba(17,24,39,.85);--muted:#9aa4b2;--text:#eef2f7;--accent:#2563eb;--accent-2:#60a5fa;--ring:rgba(96,165,250,.25);--error:#ef4444}
    *{box-sizing:border-box}
    body{margin:0;background:
      radial-gradient(1400px 900px at 70% -10%, rgba(32,99,235,.18), transparent 60%),
      radial-gradient(900px 600px at 0% 110%, rgba(96,165,250,.14), transparent 60%),
      conic-gradient(from 180deg at 50% 30%, rgba(96,165,250,.05), transparent 40%),
      var(--bg);
      color:var(--text);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial}
    .wrap{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:400px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.10);border-radius:18px;backdrop-filter:blur(12px);box-shadow:0 20px 60px rgba(0,0,0,.35)}
    .inner{padding:32px}
    .title{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px;margin:0 0 8px}
    .subtitle{margin:0 0 24px;color:var(--muted)}
    .badge{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:rgba(23,37,84,.55);color:#c7d2fe;border:1px solid rgba(99,102,241,.35);font-weight:700;font-size:12px;margin-bottom:16px}
    .form-group{margin-bottom:16px}
    .label{display:block;margin-bottom:8px;font-weight:600;color:var(--text)}
    .input{width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);border-radius:10px;font-size:16px;transition:.2s ease}
    .input:focus{outline:none;border-color:rgba(96,165,250,.7);box-shadow:0 0 0 4px var(--ring)}
    .btn{width:100%;appearance:none;border:1px solid rgba(96,165,250,.7);background:linear-gradient(180deg,rgba(96,165,250,.15),rgba(96,165,250,.08));color:var(--text);padding:12px 16px;border-radius:10px;cursor:pointer;font-weight:600;font-size:16px;transition:.2s ease}
    .btn:hover{border-color:rgba(96,165,250,.9);box-shadow:0 0 0 4px var(--ring)}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fecaca;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:14px}
    .logo{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#60a5fa,#2563eb);display:inline-block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
    .footer{margin-top:20px;text-align:center;color:var(--muted);font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="inner">
        <div class="badge"><span class="logo"></span><span>link.mackhaymond.co</span></div>
        <h1 class="title">🔒 Password Required</h1>
        <p class="subtitle">This link is password protected. Please enter the password to continue.</p>
        ${errorHtml}
        <form id="passwordForm" method="post">
          <div class="form-group">
            <label for="password" class="label">Password</label>
            <input type="password" id="password" name="password" class="input" placeholder="Enter password" required autofocus>
          </div>
          <button type="submit" class="btn" id="submitBtn">
            <span id="btnText">Continue</span>
          </button>
        </form>
        <div class="footer">
          Short link: <strong>/${escapeHtml(shortcode)}</strong>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      const btnText = document.getElementById('btnText');
      const passwordInput = document.getElementById('password');

      submitBtn.disabled = true;
      btnText.textContent = 'Verifying...';

      try {
        const response = await fetch('/api/password/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shortcode: '${escapeHtml(shortcode)}',
            password: passwordInput.value
          })
        });

        const result = await response.json();

        if (result.success) {
          // Store session token in sessionStorage
          sessionStorage.setItem('pwd_session_${escapeHtml(shortcode)}', result.sessionToken);
          // Redirect back to the short link with session token
          const redirectUrl = new URL('/${escapeHtml(shortcode)}', window.location.origin);
          redirectUrl.searchParams.set('session', result.sessionToken);
          window.location.href = redirectUrl.toString();
        } else {
          // Show error and reload page
          alert(result.error || 'Invalid password');
          window.location.reload();
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
        window.location.reload();
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
