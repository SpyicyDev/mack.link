# Deployment Guide 🚀

Production deployment guide for link.mackhaymond.co on Cloudflare.

## Overview

The system consists of a single Cloudflare Worker that:
1. **Handles redirects** - Short URL to destination redirects
2. **Serves the API** - RESTful endpoints for link management
3. **Hosts the admin UI** - React admin panel served from `/admin`
4. **Manages authentication** - GitHub OAuth integration
5. **Stores data** - Cloudflare D1 (SQLite) database

## Prerequisites

- Cloudflare account
- Custom domain (optional but recommended)  
- GitHub repository with your code
- GitHub OAuth app configured
- GitHub repository secrets configured (see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md))

## 1. Automated Deployment (Recommended)

The project includes GitHub Actions for automated CI/CD deployment:

1. **Configure Repository Secrets** - See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
2. **Push to main branch** - Triggers automatic deployment
3. **Monitor in Actions tab** - View build and deployment status

The CI automatically:
- Builds the admin UI with production environment variables
- Embeds the admin assets into the worker
- Deploys to Cloudflare Workers
- Runs smoke tests

## 2. Manual Deployment

### Setup Wrangler CLI

```bash
# Install via npm workspaces (preferred)
npm ci

# Or install globally
npm install -g wrangler@latest

# Authenticate with Cloudflare
npx wrangler login
```

### Configure Worker

Edit `worker/wrangler.jsonc`:
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mack-link",
  "main": "src/index.js",
  "compatibility_date": "2024-12-23",
  "observability": {
    "enabled": true
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "mack-link",
      "database_id": "your_d1_database_id"
    }
  ],
  "vars": {
    "GITHUB_CLIENT_ID": "your_github_client_id",
    "AUTHORIZED_USER": "your_github_username",
    "MANAGEMENT_ORIGIN": "http://localhost:5173"
  }
}
```

### Create D1 Database

```bash
cd worker

# Create D1 database
npx wrangler d1 create mack-link

# Copy the returned database ID to wrangler.jsonc
# Apply schema
npm run db:apply
```

For local development:
```bash
# Apply schema to local development database
npm run db:apply:local
```

### Set Secrets

```bash
# Set GitHub OAuth client secret
echo "your_github_client_secret" | npx wrangler secret put OAUTH_CLIENT_SECRET

# Set JWT secret for session cookies
echo "your_random_jwt_secret" | npx wrangler secret put JWT_SECRET
```

Note: The GitHub Client ID is set as a public environment variable in `wrangler.jsonc`.

### Build and Deploy Worker

```bash
# Build admin UI and embed in worker
npm run build

# Deploy worker with embedded admin
npx wrangler deploy --config wrangler.jsonc
```

Or use the workspace command from project root:
```bash
# Deploy everything
npm run deploy
```

### Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers
4. Add Custom Domain
5. Enter your domain (e.g., `link.mackhaymond.co`)

The admin UI will be available at `https://your-domain.com/admin`

## 3. DNS Configuration

If using custom domains, configure DNS in Cloudflare:

### For Your Short URL Domain
```
Type: AAAA
Name: link (or @ for root domain)
Content: 100:: (Cloudflare proxy)
Proxy: Enabled
```

## 4. GitHub OAuth Configuration

Update your GitHub OAuth app settings:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth app
3. Update URLs:
   - **Homepage URL**: `https://link.mackhaymond.co/admin`
   - **Authorization callback URL**: `https://link.mackhaymond.co/auth/callback`

Note: The admin interface is served from the same domain as your worker at `/admin`

## 5. SSL/HTTPS Configuration

Cloudflare automatically provides SSL certificates:

1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Configure HSTS if desired

## 6. Performance Optimization

### Caching Strategy

The worker automatically implements caching:
- **Short URL redirects**: Cached at edge for fast redirects
- **Static assets**: Admin UI assets cached with appropriate headers
- **API responses**: Configured per endpoint

### Admin UI Optimization

The build process includes optimizations:
- Code splitting for vendor libraries
- Asset compression and minification
- Optimal chunk sizes for Cloudflare Workers

See `admin/vite.config.js` for current configuration.

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

### GitHub Actions (Automated)

The repository includes CI/CD pipeline:

1. **Push to `main` branch** triggers deployment
2. **Validation job** runs tests and linting
3. **Deploy job** builds and deploys to Cloudflare Workers
4. **Smoke tests** verify deployment health

View deployment status in the **Actions** tab of your GitHub repository.

### Manual Deployment

```bash
# From project root
npm run deploy

# Or step by step
npm run build
npm -w worker run deploy
```

## 9. Environment Management

### Production Secrets

Set via Wrangler CLI:
```bash
npx wrangler secret put OAUTH_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

### GitHub Repository Secrets

Required for CI/CD (see [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `JWT_SECRET`

### Development vs Production

**Development:**
- Worker: `http://localhost:8787`
- Admin: `http://localhost:8787/admin` or `http://localhost:5173`
- OAuth callback: `http://localhost:8787/auth/callback`

**Production:**
- Worker: `https://link.mackhaymond.co`
- Admin: `https://link.mackhaymond.co/admin`
- OAuth callback: `https://link.mackhaymond.co/auth/callback`

## 10. Data Management

### Database Schema

Apply schema updates:
```bash
# Production
npm -w worker run db:apply

# Local development
npm -w worker run db:apply:local
```

### Data Backup

D1 databases are automatically replicated by Cloudflare. For manual backups:
```bash
# Export data (when available)
npx wrangler d1 export mack-link --output=backup.sql
```

## 11. Scaling Considerations

### Free Tier Limits

Monitor usage in Cloudflare Dashboard:
- **Worker requests**: 100,000/day
- **D1 operations**: 5M reads, 100K writes/day (free tier)
- **D1 storage**: 1GB

### Upgrading

If you exceed free tier:
- **Workers Paid**: $5/month for 10M requests
- **D1 Paid**: Usage-based pricing for additional operations

## 12. Troubleshooting

### Common Issues

**Worker not deploying:**
```bash
# Check authentication
npx wrangler whoami

# Check configuration
npx wrangler deploy --dry-run

# View detailed logs
npx wrangler tail
```

**OAuth not working:**
- Verify callback URLs match exactly: `https://yourdomain.com/auth/callback`
- Check client ID/secret are correct
- Ensure HTTPS in production
- Check `AUTHORIZED_USER` environment variable

**Admin UI showing localhost URLs:**
- Ensure `OAUTH_CLIENT_ID` repository secret is set
- Check CI/CD environment variable injection
- Verify build process includes environment variables

**Database errors:**
- Ensure D1 database is created and bound
- Run schema migration: `npm -w worker run db:apply`
- Check database ID in `wrangler.jsonc`

### Debugging Tools

```bash
# View worker logs in real-time
npx wrangler tail

# Test worker locally
npx wrangler dev

# Check D1 database
npx wrangler d1 execute mack-link --local --command="SELECT * FROM links LIMIT 5"

# View CI/CD logs
# Check GitHub Actions tab in your repository
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