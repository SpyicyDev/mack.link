# Mack.link - GitHub Copilot Agent Instructions

Always follow these instructions first and fallback to additional search and context gathering only when the information in these instructions is incomplete or found to be in error.

## 🤖 CRITICAL FOR AI AGENTS: Use AI-Optimized Development Mode

**If you are a Copilot agent doing ANY UI development work, ALWAYS use:**

```bash
npm run dev:ai
```

This command:
- Starts both worker and admin servers with authentication disabled
- Worker serves at http://localhost:8787 (backend + embedded admin)
- Admin Vite dev server serves at http://localhost:5173 (for UI development)
- Enables direct UI access without OAuth redirects  
- Is specifically designed for automated development and testing
- Avoids cross-origin issues that break agent workflows

**Never use `npm run dev` as an AI agent - it requires manual GitHub OAuth which agents cannot complete.**

## Working Effectively

### Critical: Use AI-Optimized Development Mode

**ALWAYS use `npm run dev:ai` for ANY UI development work as a Copilot agent.**

```
npm run dev:ai
```

This is the OAuth-disabled dev mode specifically designed for AI agents and automated UI development:

This starts the Worker with AUTH_DISABLED=true and the Admin with VITE_AUTH_DISABLED=true. Dev auth is controlled exclusively by AUTH_DISABLED on the Worker; client flags cannot enable it. In this mode:
- The Admin login button calls a dev-only endpoint: `POST /api/auth/dev/login` to issue a session cookie and return the mock user.
- If the endpoint fails (e.g., AUTH_DISABLED is not set), the Admin falls back to the normal GitHub OAuth redirect.
- Use this for Playwright E2E flows to avoid cross-origin OAuth redirects.

- Bootstrap, build, and test the repository:
  - `npm install` -- takes 25 seconds. NEVER CANCEL.
  - `npm run lint` -- takes 2 seconds. Always run before committing.
  - `npm run build` -- takes 9 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
  - `npm run validate:local` -- takes 1 second (requires dev server running).

- Run the application locally:
  - ALWAYS run the bootstrapping steps first.
  - **AI/Copilot agents**: ALWAYS use `npm run dev:ai` -- OAuth-disabled mode for automated UI development (worker at localhost:8787, admin UI at localhost:5173)
  - Full development (manual): `npm run dev` -- starts both worker (localhost:8787) and admin (localhost:5173) servers. Build takes 8-9 seconds first, then both servers start.
  - Worker only: `npm run dev:worker` -- starts worker with embedded admin at localhost:8787.
  - Worker fast mode: `npm run dev:worker:fast` -- skips admin rebuild, starts worker immediately at localhost:8787.
  - Admin only: `npm run dev:admin` -- starts React dev server at localhost:5173/admin/.

- Database operations:
  - `npm run db:apply:local` -- applies schema to local D1 database. Takes 1.2 seconds. NEVER CANCEL.
  - `npm run db:apply:prod` -- applies schema to production (requires Cloudflare auth).

## Validation

Dev-auth sanity checks (run when AUTH_DISABLED=true):
- `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8787/api/auth/dev/login` should return 200.
- Visiting http://localhost:5173/admin after the POST should land on the dashboard without redirects.

Production sanity checks (AUTH_DISABLED not set):
- `POST /api/auth/dev/login` should return 403.
- Visiting /admin shows GitHub OAuth button and requires normal authentication.

- ALWAYS manually validate any changes by running the complete application:
  1. **For AI/Copilot agents**: Run `npm run dev:ai` to start both servers with auth disabled.
  2. **For manual development**: Run `npm run dev` to start both servers.
  3. Open http://localhost:8787 in browser - verify homepage loads with "Sign in to Admin" button.
  4. **For admin UI development**: Open http://localhost:5173/admin - verify admin interface loads directly with auth disabled (AI mode) or shows login page (manual mode).
  5. **For embedded admin testing**: Open http://localhost:8787/admin - verify embedded admin login page loads.
  6. Run `npm run validate:local` - ALL 19 tests must pass.

- ALWAYS run `npm run lint` before committing. The pre-commit hook runs linting automatically.

- You can build and test the full application locally, but deployment requires Cloudflare authentication.

- Build validation timing expectations:
  - npm install: ~25 seconds - NEVER CANCEL
  - Build process: ~9 seconds - NEVER CANCEL
  - Lint: ~2 seconds - NEVER CANCEL
  - Validation: ~1 second - NEVER CANCEL
  - Dev server startup: ~10 seconds total - NEVER CANCEL

## Architecture Overview

Mack.link is a URL shortener using **npm workspaces** with two main components:

1. **Worker** (`/worker`): Cloudflare Worker serving redirects, API endpoints, and embedded React app
2. **Admin** (`/admin`): React admin panel that gets built and embedded into the worker

**Critical Build Process:**
1. Admin React app builds to `/admin/dist` (Vite build ~8 seconds)
2. Build script embeds admin assets into `/worker/src/admin-assets.js` (~1 second)
3. Worker serves everything: redirects, API, and embedded admin UI

## Common Tasks

### Development Commands
```bash
# Install and setup
npm install                    # 25 seconds - sets up workspaces
npm run db:apply:local        # 1.2 seconds - applies database schema

# Development
npm run dev:ai               # AI/Copilot agents: OAuth-disabled mode for automated UI development (admin UI at localhost:5173)
npm run dev                   # Manual development: Both worker + admin servers (admin UI at localhost:5173)
npm run dev:worker           # Worker only with embedded admin
npm run dev:worker:fast      # Worker only, skips admin rebuild
npm run dev:admin            # Admin dev server only

# Building
npm run build                # 9 seconds - full production build
npm run build:admin         # Admin build only
npm run build:worker        # Worker build (includes admin)

# Validation
npm run lint                 # 2 seconds - ESLint on admin code
npm run validate:local       # 1 second - test all endpoints (needs dev server)
npm run validate:prod        # Test production deployment

# Deployment (requires Cloudflare auth)
npm run deploy              # Build + deploy to Cloudflare Workers
```

### Key File Locations
```
mack.link/
├── worker/                    # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.js          # Main worker entry point
│   │   ├── routes/           # API and admin route handlers
│   │   ├── admin-assets.js   # Auto-generated embedded React app
│   │   └── schema.sql        # Database schema
│   └── wrangler.jsonc        # Worker configuration
├── admin/                     # React admin panel frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   └── App.jsx          # Main React app
│   └── package.json
└── package.json              # Root workspace config
```

### Node.js Version
- Requires Node.js 18+ (currently using v20.19.5)
- Uses npm workspaces for monorepo management

### Testing Scenarios
After making changes, ALWAYS test these scenarios:
1. **Homepage loads**: Visit http://localhost:8787, verify "Sign in to Admin" button appears
2. **Admin UI development**: Visit http://localhost:5173/admin for direct admin UI access during development
3. **Embedded admin loads**: Visit http://localhost:8787/admin, verify embedded admin interface appears  
4. **API accessibility**: Verify http://localhost:8787/api/links returns 401 (not 404)
5. **Asset serving**: Verify CSS/JS assets load from /admin/assets/ paths
6. **Validation passes**: Run `npm run validate:local` - must show "19 Passed, 0 Failed"

### Troubleshooting

**Build fails**: 
- Ensure Node.js 18+ is installed
- Run `npm install` first
- Check for missing dependencies

**Dev server won't start**:
- Kill existing processes on ports 8787 and 5173
- Run `npm run db:apply:local` to ensure database is set up
- For AI/Copilot agents: Use `npm run dev:ai` instead of `npm run dev`
- Network warnings about cloudflare.com are normal in sandboxed environments

**Validation fails**:
- Ensure dev server is running (`npm run dev:ai` for AI agents, `npm run dev` for manual)
- Check that both localhost:8787 and localhost:5173 are accessible
- For admin UI development, use http://localhost:5173/admin for direct access
- Look for JavaScript console errors in browser

**Deployment fails**:
- Expected without Cloudflare API token
- Build process will complete successfully up to the deployment step
- Error message will be: "it's necessary to set a CLOUDFLARE_API_TOKEN"

### Security Notes
- Never commit secrets to Git
- Husky pre-commit hook runs linting automatically
- Run `npm run security:audit` to check for vulnerabilities (takes 3 seconds)
- Uses GitHub OAuth for admin authentication
- Admin assets are embedded in worker for security

### Performance Expectations
- Total setup time: ~35 seconds (install + build)
- Development startup: ~10 seconds
- Validation suite: ~1 second for 19 tests
- The application loads quickly: homepage in <100ms, admin panel in <200ms

## Validation Requirements

When making any changes:

1. **Build successfully**: `npm run build` must complete without errors
2. **Pass linting**: `npm run lint` must pass with no errors
3. **Pass validation**: `npm run validate:local` must show 19/19 tests passing
4. **Manual verification**: Both homepage and admin panel must load and display correctly in browser
5. **Assets working**: CSS and JavaScript assets must load from /admin/assets/ paths

NEVER commit code that fails validation or cannot be built successfully.