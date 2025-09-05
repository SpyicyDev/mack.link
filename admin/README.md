# Admin (React)

This is the React admin UI for mack.link. Most development tasks should be run from the repository root using npm workspaces.

## Common tasks (from repo root)

- Install dependencies (all workspaces):
  - `npm ci`
- Start Admin dev server (http://localhost:5173):
  - `npm run dev:admin`
  - or start both Worker + Admin: `npm run dev`
- Build Admin:
  - `npm -w admin run build`
- Lint Admin:
  - `npm -w admin run lint`

## Environment Variables

### Local Development
Create `admin/.env.local` for local development:
```
VITE_API_BASE=http://localhost:8787
VITE_WORKER_DOMAIN=localhost:8787
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

### Production Deployment
- Environment variables are automatically injected by CI/CD during build
- See [../docs/GITHUB_SECRETS.md](../docs/GITHUB_SECRETS.md) for required repository secrets
- Production builds are embedded and served by the Worker at `/admin`
