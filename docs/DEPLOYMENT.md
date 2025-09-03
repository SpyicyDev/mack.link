# Deployment Guide 🚀

Production deployment guide for link.mackhaymond.co on Cloudflare.

## Overview

The system consists of two main components:
1. **Cloudflare Worker** - Handles redirects and API
2. **React Management Panel** - Hosted on Cloudflare Pages

## Prerequisites

- Cloudflare account
- Custom domain (optional but recommended)  
- GitHub repository with your code
- GitHub OAuth app configured

## 1. Cloudflare Worker Deployment

### Setup Wrangler CLI

```bash
# Install globally
npm install -g wrangler

# Authenticate with Cloudflare
npx wrangler login
```

### Configure Worker

Edit `worker/wrangler.jsonc`:
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "link-shortener",
  "main": "src/index.js",
  "compatibility_date": "2025-09-03",
  "observability": {
    "enabled": true
  },
  "kv_namespaces": [
    {
      "binding": "LINKS",
      "id": "your_kv_namespace_id"
    }
  ],
  "vars": {
    "GITHUB_CLIENT_ID": "your_github_client_id",
    "AUTHORIZED_USER": "your_github_username",
    "MANAGEMENT_ORIGIN": "https://link-management.example.com"
  }
}
```

### Create KV Namespace

```bash
cd worker
npx wrangler kv namespace create LINKS
```

Copy the returned namespace ID to `wrangler.jsonc`.

### Set Secrets

```bash
# Set GitHub client secret
echo "your_github_client_secret" | npx wrangler secret put GITHUB_CLIENT_SECRET

# Set CORS allowlist for management (single or multiple origins, comma-separated)
echo "https://link-management.example.com" | npx wrangler secret put MANAGEMENT_ORIGIN
```

### Deploy Worker

```bash
npx wrangler deploy
```

### Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers
4. Add Custom Domain
5. Enter your domain (e.g., `link.mackhaymond.co`)

## 2. Management Panel Deployment

### Cloudflare Pages Setup

#### Option A: Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages → Create
3. Click "Connect to Git"
4. Select your GitHub repository
5. Configure build settings:

```yaml
Framework preset: React
Build command: npm run build
Build output directory: dist
Root directory: management
```

6. Environment variables:
```
VITE_API_BASE=https://your-worker-domain.com
VITE_WORKER_DOMAIN=your-worker-domain.com
```

7. Click "Save and Deploy"

#### Option B: Wrangler CLI

```bash
cd management

# Build the app
npm run build

# Deploy to Pages
npx wrangler pages deploy dist --project-name=link-management
```

### Custom Domain for Management Panel

1. In Cloudflare Dashboard → Workers & Pages
2. Select your Pages project
3. Go to Custom domains
4. Add domain (e.g., `link-management.mackhaymond.co`)

## 3. DNS Configuration

If using custom domains, configure DNS in Cloudflare:

### For Worker Domain
```
Type: AAAA
Name: link
Content: 100:: (Cloudflare proxy)
Proxy: Enabled
```

### For Management Domain
```
Type: CNAME
Name: link-management  
Content: your-pages-project.pages.dev
Proxy: Enabled
```

## 4. GitHub OAuth Configuration

Update your GitHub OAuth app settings:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth app
3. Update URLs:
   - **Homepage URL**: `https://link-management.mackhaymond.co`
   - **Authorization callback URL**: `https://link-management.mackhaymond.co/auth/callback`

## 5. SSL/HTTPS Configuration

Cloudflare automatically provides SSL certificates:

1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Configure HSTS if desired

## 6. Performance Optimization

### Worker Optimization

Add caching headers in your worker:
```javascript
const response = new Response(content, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
    'Content-Type': 'text/html'
  }
});
```

### Pages Optimization

Configure build optimizations in `management/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
});
```

## 7. Monitoring and Analytics

### Enable Analytics

1. Go to Analytics & Logs in Cloudflare Dashboard
2. Enable Web Analytics for your domains
3. Configure alerts for error rates

### Worker Monitoring

```javascript
// Add to your worker for custom metrics
export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    
    try {
      const response = await handleRequest(request, env);
      
      // Log success metrics
      console.log(`Request completed in ${Date.now() - start}ms`);
      
      return response;
    } catch (error) {
      // Log error metrics
      console.error('Request failed:', error);
      throw error;
    }
  }
};
```

## 8. Continuous Deployment

### Automatic Deployments

Cloudflare Pages automatically deploys when you push to GitHub:

1. Any push to `main` branch triggers deployment
2. Build logs are available in Pages dashboard
3. Failed builds prevent deployment

### Manual Deployment

```bash
# Worker
cd worker
npx wrangler deploy

# Management panel
cd management
npm run build
npx wrangler pages deploy dist
```

## 9. Environment Management

### Production Environment Variables

**Worker Secrets:**
```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
```

**Pages Environment Variables:**
Set in Cloudflare Dashboard → Pages → Settings → Environment variables

### Development vs Production

Use different OAuth apps and domains for development:

**Development:**
- Worker: `localhost:8787`
- Management: `localhost:5173`
- OAuth callback: `http://localhost:5173/auth/callback`

**Production:**
- Worker: `link.mackhaymond.co`
- Management: `link-management.mackhaymond.co`  
- OAuth callback: `https://link-management.mackhaymond.co/auth/callback`
- Worker CORS allowlist: `MANAGEMENT_ORIGIN=https://link-management.mackhaymond.co`

## 10. Backup and Recovery

### Data Backup

KV data is automatically replicated, but consider:

```bash
# Export all links (manual backup)
npx wrangler kv key list --namespace-id=your_namespace_id > backup.json
```

### Configuration Backup

Keep your configuration files in version control:
- `wrangler.jsonc` (without secrets)
- `package.json` files
- Environment variable documentation

## 11. Scaling Considerations

### Free Tier Limits

Monitor usage in Cloudflare Dashboard:
- **Worker requests**: 100,000/day
- **KV operations**: 100,000 reads, 1,000 writes/day
- **Pages requests**: Unlimited

### Upgrading

If you exceed free tier:
- **Workers Paid**: $5/month for 10M requests
- **KV**: $0.50/GB storage + $0.50/million operations

## 12. Troubleshooting

### Common Issues

**Worker not deploying:**
```bash
# Check authentication
npx wrangler whoami

# Check configuration
npx wrangler deploy --dry-run
```

**OAuth not working:**
- Verify callback URLs match exactly
- Check client ID/secret are correct
- Ensure HTTPS in production

**CORS errors:**
- Check VITE_API_BASE environment variable
- Verify worker CORS headers

### Debugging Tools

```bash
# View worker logs
npx wrangler tail

# Test worker locally
npx wrangler dev

# Check KV data
npx wrangler kv key list --namespace-id=your_id
```

## 13. Security Checklist

- [ ] HTTPS enabled everywhere
- [ ] Secrets stored securely (not in code)
- [ ] OAuth app restricted to production domains
- [ ] User authorization implemented
- [ ] CORS configured properly
- [ ] Error handling doesn't expose sensitive data

---

**Your URL shortener is now live! 🎉**

Monitor the Cloudflare Dashboard for performance and usage metrics.