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
   - **Homepage URL**: `https://your-management-domain.com`
   - **Authorization callback URL**: `https://your-management-domain.com/auth/callback`
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
    "AUTHORIZED_USER": "your_github_username"
  }
}
```

Create KV namespace:
```bash
npx wrangler kv namespace create LINKS
```

Update `wrangler.jsonc` with the returned namespace ID.

Add the GitHub client secret:
```bash
echo "your_github_client_secret" | npx wrangler secret put GITHUB_CLIENT_SECRET
```

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
cd ../management
npm install
```

Create `.env`:
```env
VITE_API_BASE=https://your-worker-domain.com
VITE_WORKER_DOMAIN=your-worker-domain.com
```

## 6. Deploy Management Panel

### Option A: Cloudflare Pages (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages → "Connect to Git"
3. Select your repository
4. Configure:
   - **Framework**: React
   - **Build command**: `npm run build`
   - **Build directory**: `dist`
   - **Root directory**: `management`
5. Add environment variables:
   - `VITE_API_BASE=https://your-worker-domain.com`
6. Deploy!

### Option B: Manual Deploy

```bash
npm run build
npx wrangler pages deploy dist
```

## 7. Configure DNS

If using custom domains:
1. Point your short domain to Cloudflare Workers
2. Point your management domain to Cloudflare Pages

## 8. Test Everything

1. Visit your management panel
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

Replace `management/public/favicon.jpg` with your image and redeploy.

### Styling

Edit Tailwind classes in React components or modify `management/src/index.css`.

## 🚨 Security Notes

- Never commit secrets to Git
- Use Cloudflare's secret management for sensitive data
- Regularly rotate GitHub OAuth secrets
- Monitor usage in Cloudflare Dashboard

## 🆘 Troubleshooting

**Common Issues:**

1. **OAuth not working**: Check callback URLs match exactly
2. **Worker not deploying**: Ensure wrangler is authenticated
3. **KV errors**: Verify namespace binding is correct
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