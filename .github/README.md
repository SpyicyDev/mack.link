# CI/CD Documentation for mack.link

This document describes the automated deployment and maintenance workflows for the mack.link URL shortener with integrated admin panel.

## 🏗️ Architecture Overview

The CI/CD pipeline supports the unified architecture where:
- React admin panel is embedded into the Cloudflare Worker
- Single deployment target (no separate Pages deployment)
- Automated testing, building, and deployment
- Continuous monitoring and maintenance

## 📋 Workflows

### 1. Production Deployment (`deploy-worker.yml`)

**Triggers:**
- Push to `main` branch
- Manual dispatch via GitHub UI

**Process:**
1. **Validation** - Code linting, testing, change detection
2. **Build** - React app → Worker embedding → Unified bundle
3. **Deploy** - Deploy to Cloudflare Workers
4. **Validation** - Post-deployment health checks

**Environment Variables Required:**
```
CLOUDFLARE_API_TOKEN     # Cloudflare API access
CLOUDFLARE_ACCOUNT_ID    # Your Cloudflare account ID
JWT_SECRET               # Session encryption key
GITHUB_CLIENT_SECRET     # OAuth integration
```

### 2. Staging Deployment (`deploy-staging.yml`)

**Triggers:**
- Push to `develop` or `staging` branches
- Pull requests to `main`

**Features:**
- Deploys to separate staging worker
- Runs comprehensive integration tests
- Comments deployment URL on PRs
- Automatic cleanup for closed PRs

### 3. Maintenance & Health Checks (`maintenance.yml`)

**Schedule:**
- Daily health checks (2 AM UTC)
- Weekly dependency audits (Monday 6 AM UTC)

**Tasks:**
- Production endpoint monitoring
- Security vulnerability scanning
- Performance benchmarking
- Dependency updates
- Artifact cleanup

## 🚀 Deployment Process

### Manual Production Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy Unified URL Shortener**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

### Automatic Production Deployment

Simply push to the `main` branch:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

### Staging Deployment

Push to staging branch:

```bash
git checkout staging
git merge develop
git push origin staging
```

## 🔧 Setup Instructions

### 1. Repository Secrets

Configure these secrets in GitHub Settings → Secrets:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | Cloudflare Dashboard sidebar |
| `JWT_SECRET` | Random secure string | `openssl rand -base64 32` |
| `GITHUB_CLIENT_SECRET` | OAuth app secret | [GitHub Developer Settings](https://github.com/settings/developers) |

### 2. Staging Secrets (Optional)

For staging environment, add these with `STAGING_` prefix:

- `STAGING_JWT_SECRET`
- `STAGING_GITHUB_CLIENT_SECRET`

### 3. Cloudflare Workers Configuration

Ensure your `wrangler.jsonc` is properly configured:

```jsonc
{
  "name": "worker",
  "main": "src/index.js",
  "compatibility_date": "2025-09-03",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "mack-link",
      "database_id": "your-database-id"
    }
  ],
  "vars": {
    "GITHUB_CLIENT_ID": "your-github-client-id",
    "AUTHORIZED_USER": "your-github-username",
    "SESSION_MAX_AGE": "28800",
    "SESSION_COOKIE_NAME": "link_session"
  }
}
```

## 🧪 Testing

### Local Testing

```bash
# Install all dependencies
npm run install:all

# Run tests
npm run test

# Build and validate locally
npm run build
npm run validate:local
```

### Staging Testing

After staging deployment, test these URLs:
- `https://staging-worker.spyicydev.workers.dev` - Main site
- `https://staging-worker.spyicydev.workers.dev/admin` - Admin panel
- `https://staging-worker.spyicydev.workers.dev/api/links` - API (should return 401)

## 📊 Monitoring

### Health Checks

The maintenance workflow monitors:
- **Endpoint availability** - All critical URLs respond correctly
- **Authentication flow** - GitHub OAuth integration working
- **API functionality** - Protected endpoints secure
- **Performance** - Response times under 2 seconds
- **Security** - Headers and vulnerability scanning

### Alerts

Issues are automatically reported via:
- Failed workflow notifications
- GitHub issues for critical failures
- Artifact reports for investigation

## 🔒 Security

### Automated Security Measures

- **CodeQL Analysis** - Static code security scanning
- **Dependency Auditing** - Weekly vulnerability checks
- **Security Header Validation** - HTTPS, CSP, etc.
- **Sensitive Data Scanning** - Prevents secret exposure

### Manual Security Checklist

Before major deployments:

- [ ] Update dependencies with security patches
- [ ] Rotate JWT_SECRET if compromised
- [ ] Review GitHub OAuth app permissions
- [ ] Check Cloudflare security settings
- [ ] Validate CORS configuration

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails with "Authentication Error"**
- Check `CLOUDFLARE_API_TOKEN` has correct permissions
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct

**Admin Panel Shows "Failed to fetch"**
- Ensure `JWT_SECRET` is set in worker secrets
- Check `GITHUB_CLIENT_SECRET` for OAuth
- Verify Cloudflare D1 database binding

**Tests Fail in CI**
- Check if new dependencies need installation
- Verify test environment has required bindings
- Review Node.js version compatibility

**Build Size Too Large**
- Check bundle analysis in workflow logs
- Consider code splitting for large dependencies
- Review embedded assets size

### Emergency Rollback

If deployment fails and needs immediate rollback:

1. Go to Cloudflare Workers Dashboard
2. Find the worker deployment history
3. Rollback to previous working version
4. Or redeploy from last known good commit:

```bash
git checkout main
git reset --hard <last-good-commit>
git push --force-with-lease origin main
```

### Debugging Deployment

View detailed logs:
1. Go to Actions → Failed workflow
2. Expand each step to see detailed output
3. Download artifacts for offline analysis
4. Check Cloudflare Workers logs for runtime issues

## 📈 Performance Optimization

### Build Optimization

The CI automatically optimizes:
- **Code splitting** - Separates vendor, charts, and app code
- **Tree shaking** - Removes unused code
- **Minification** - Compresses all assets
- **Bundle analysis** - Monitors size growth

### Deployment Optimization

- **Artifact caching** - Speeds up repeated builds
- **Parallel jobs** - Validation and building run concurrently
- **Smart deployments** - Only deploys when necessary changes detected

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Project Architecture Guide](../docs/ADMIN_INTEGRATION.md)

## 🤝 Contributing

When contributing to the CI/CD pipeline:

1. Test changes in a fork first
2. Update this documentation for significant changes  
3. Test both staging and production workflows
4. Consider impact on existing deployments

---

**Last Updated:** September 2025  
**Maintainer:** SpyicyDev  
**Status:** ✅ Production Ready