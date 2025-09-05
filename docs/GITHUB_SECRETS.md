# Required GitHub Repository Secrets

This document outlines the secrets that need to be configured in your GitHub repository for the CI/CD pipeline to work properly.

## Repository Secrets Setup

Navigate to your repository → Settings → Secrets and variables → Actions → Repository secrets

### Required Secrets

#### Existing Secrets (already configured)
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token for deployment
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `JWT_SECRET` - Secret key for signing JWT tokens
- `OAUTH_CLIENT_SECRET` - GitHub OAuth application client secret

#### New Secret Required
- `OAUTH_CLIENT_ID` - Your GitHub OAuth application client ID

### Setting up OAUTH_CLIENT_ID

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Find your OAuth App for this project
3. Copy the "Client ID" value
4. Add it as a repository secret named `OAUTH_CLIENT_ID`

## Environment Configuration

The CI/CD pipeline will automatically create the following environment configurations:

### For Testing (validation job)
```
VITE_API_BASE=http://localhost:8787
VITE_WORKER_DOMAIN=localhost:8787
VITE_GITHUB_CLIENT_ID=test_client_id
```

### For Production (deploy job)
```
VITE_API_BASE=https://link.mackhaymond.co
VITE_WORKER_DOMAIN=link.mackhaymond.co
VITE_GITHUB_CLIENT_ID=${secrets.OAUTH_CLIENT_ID}
```

## Local Development

For local development, create an `admin/.env.local` file with appropriate values:

```bash
# For local development with local worker
VITE_API_BASE=http://localhost:8787
VITE_WORKER_DOMAIN=localhost:8787
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id

# OR for local development with production API
VITE_API_BASE=https://link.mackhaymond.co
VITE_WORKER_DOMAIN=link.mackhaymond.co
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

The `.env.local` file is git-ignored and will not be committed to the repository.
