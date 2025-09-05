# Setup Guide 🛠

Complete step-by-step guide to deploy your own instance of link.mackhaymond.co.

## Prerequisites

- Node.js 20.19+ installed
- GitHub account
- Cloudflare account (free tier works)
- Custom domain (optional but recommended)

## 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone it
git clone https://github.com/YOUR_USERNAME/mack.link.git
cd mack.link
```

## 2. Setup GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: `Your Domain Link Manager`
   - **Homepage URL**: `https://your-worker-domain.com/admin`
   - **Authorization callback URL**: `https://your-worker-domain.com/auth/callback`
4. Save the **Client ID** and **Client Secret**

## 3. Configure Cloudflare Worker

```bash
cd worker
npm install
```

Edit `wrangler.jsonc`:
```json
{
  "name": "your-worker-name",
  "vars": {
    "GITHUB_CLIENT_ID": "your_github_client_id",
    "AUTHORIZED_USER": "your_github_username",
    "SESSION_COOKIE_NAME": "__Host-link_session",
    "SESSION_MAX_AGE": "28800"
  }
}
```

Apply the D1 database schema:
```bash
# Local (uses in-memory D1)
cd worker && npm run db:apply:local

# Production (executes against bound D1 database)
cd worker && npm run db:apply
```

Add the GitHub client secret:
```bash
echo "your_github_client_secret" | npx wrangler secret put GITHUB_CLIENT_SECRET
```

Add a JWT secret for session cookies:
```bash
echo "your_random_jwt_secret" | npx wrangler secret put JWT_SECRET
```

Note: Because the admin UI is served from the same origin (`/admin`), a CORS allowlist is not required for the management UI.

## 4. Deploy Worker

```bash
npx wrangler deploy
```

Configure custom domain in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Add custom domain

## 5. Setup Management Panel

```bash
cd ../admin
npm install
```

**For CI/CD Deployment**: Environment variables are automatically handled by GitHub Actions. See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for required repository secrets.

**For Local Development**: Create `.env.local`:
```env
VITE_API_BASE=https://your-worker-domain.com
VITE_WORKER_DOMAIN=your-worker-domain.com
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

## 6. Deploy Worker (with embedded Admin)

The admin panel is embedded and served by the Worker at `/admin`. Deploy the Worker and you’re done:

```bash
# From the repo root
npm run build                  # Builds admin and embeds assets into the worker
npm -w worker run deploy       # Deploys the worker to Cloudflare Workers
```

Alternatively, deploy directly with Wrangler from the worker directory:

```bash
npx wrangler deploy --config worker/wrangler.jsonc
```

## 7. Configure DNS

If using a custom domain, point it to Cloudflare Workers. The admin UI will be available at `/admin` on the same domain.

## 8. Test Everything

1. Visit your admin panel
2. Sign in with GitHub
3. Create a test link
4. Test the redirect

## 🔧 Customization

### Change Authorized Users

Edit `worker/wrangler.jsonc`:
```json
{
  "vars": {
    "AUTHORIZED_USER": "new_username"
  }
}
```

Redeploy worker: `npx wrangler deploy`

### Custom Favicon

Replace `admin/public/favicon.jpg` with your image and redeploy.

### Styling

Edit Tailwind classes in React components or modify `admin/src/index.css`.

## 🚨 Security Notes

- Never commit secrets to Git
- Use Cloudflare's secret management for sensitive data
- Regularly rotate GitHub OAuth secrets
- Monitor usage in Cloudflare Dashboard

## 🆘 Troubleshooting

**Common Issues:**

1. **OAuth not working**: Check callback URLs match exactly
2. **Worker not deploying**: Ensure wrangler is authenticated
3. **D1 errors**: Verify database binding and schema are correct
4. **CORS issues**: Check API_BASE environment variable

**Getting Help:**

- Check Cloudflare Workers logs
- Inspect browser network requests
- Verify environment variables

## 📈 Monitoring

Use Cloudflare Dashboard to monitor:
- Request volume
- Error rates
- KV usage
- Performance metrics

---

*Need help? Check the other documentation files or open an issue.*