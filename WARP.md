# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Worker Development
```bash
# Start local development server
npm -w worker run dev

# Run tests
npm -w worker run test

# Run a single test by name
npm -w worker exec npx vitest -t "pattern"

# Deploy to production
npm -w worker run deploy

# Manage secrets
echo "secret_value" | npx wrangler secret put SECRET_NAME

# Tail worker logs
npx wrangler tail

# Apply D1 schema locally (once or after schema changes)
npm -w worker run db:apply:local

# Apply D1 schema to production
npm -w worker run db:apply

# Reconcile analytics data inconsistencies
npx wrangler d1 execute mack-link --file src/migrate-analytics.sql --remote

# Run basic analytics tests
node --test src/test-analytics.js
```

### Admin Panel Development
```bash
# Start development server (requires worker running)
npm -w admin run dev

# Build for production
npm -w admin run build

# Lint code
npm -w admin run lint

# Preview production build
npm -w admin run preview
```

### Full Stack Development
With npm workspaces, you can start both from the repo root:
```bash
# Terminal 1: Start worker (builds admin and runs wrangler dev)
npm -w worker run dev

# Terminal 2: Start admin (Vite)
npm -w admin run dev
```
Or start both in one terminal using:
```bash
npm run dev
```

Access:
- Worker API: http://localhost:8787
- Admin UI: http://localhost:5173
- Test redirects: http://localhost:8787/{shortcode}

## Architecture Overview

This project runs as a single Cloudflare Worker that also serves an embedded React admin panel:

### Core Components

**Cloudflare Worker** (`/worker/`)
- **Entry Point**: `src/index.js` - Main worker with request lifecycle management
- **Admin UI**: `src/routes/admin.js` serves the embedded React app at `/admin` using assets from `src/admin-assets.js`
- **Routing**: `src/routes.js` handles request dispatching between admin, redirects, and API
- **Authentication**: `src/auth.js` manages GitHub OAuth and session verification
- **Database**: `src/db.js` abstracts Cloudflare D1 operations for link storage
- **API Router**: `src/routes/routerApi.js` handles all `/api/*` endpoints
- **Redirect Handler**: `src/routes/redirect.js` processes shortcode redirects
- **Session Management**: `src/session.js` handles JWT-based session cookies

**React Admin Panel** (`/admin/`)
- **Main App**: `src/App.jsx` with tabbed interface (Links/Analytics)
- **Authentication Flow**: `src/components/AuthCallback.jsx` handles GitHub OAuth callback
- **Link Management**: `src/components/LinkList.jsx`, `src/components/CreateLinkForm.jsx`
- **Search & Filtering**: `src/components/LinkSearch.jsx` with real-time filtering
- **Analytics Dashboard**: `src/components/Analytics.jsx` with charts and metrics
- **API Client**: `src/services/api.js` handles all backend communication
- **React Query Integration**: `src/hooks/useLinks.js` for data fetching and caching

### Data Flow

1. **Redirect Flow**: `/{shortcode}` → Worker → D1 lookup → HTTP redirect
2. **API Flow**: Management UI → `/api/*` → Authentication → D1 operations → Response
3. **Auth Flow**: GitHub OAuth → Session JWT → HttpOnly cookie → API access

### Storage Strategy

- **Primary Storage**: Cloudflare D1 (SQLite) for link data and analytics
- **Session Storage**: JWT tokens in HttpOnly cookies
- **Caching**: React Query for frontend state management

### Key Configuration Files

- `worker/wrangler.jsonc`: Worker deployment config, environment variables, D1 binding
- `admin/vite.config.js`: Frontend build configuration
- `admin/tailwind.config.js`: Tailwind CSS customization

## Development Patterns

### Error Handling
- Worker uses structured logging via `src/logger.js`
- Frontend has ErrorBoundary components for graceful failures
- API responses follow consistent error format with proper HTTP status codes

### Authentication Architecture
- GitHub OAuth for user identity
- Server-side session management with JWT
- HttpOnly cookies for security (no client-side token exposure)
- Single authorized user restriction via `AUTHORIZED_USER` environment variable

### API Design
- RESTful endpoints under `/api/`
- CORS configured for cross-origin requests from management UI
- Bulk operations supported for efficiency (`/api/links/bulk`)
- Pagination support for large datasets

### Frontend State Management
- React Query for server state and caching
- Local React state for UI state
- Keyboard shortcuts via custom hook (`useKeyboardShortcuts`)
- **Real-time Analytics**: 15-second polling for overview, timeseries, and breakdown data when analytics tab is active
- **Real-time Links**: Synchronized polling with analytics (15s when analytics active, 10s otherwise)
- Background polling continues when tab is not focused for continuous real-time updates

### Performance Optimizations
- Edge-first architecture with Cloudflare Workers
- Efficient D1 queries with proper indexing
- Frontend code splitting and lazy loading
- Optimized bundle size with Vite

## Environment Setup

### Required Environment Variables (Worker)
- `GITHUB_CLIENT_ID`: OAuth application ID
- `GITHUB_CLIENT_SECRET`: OAuth application secret (via `wrangler secret put`)
- `JWT_SECRET`: Secret used to sign session JWT cookies (via `wrangler secret put`)
- `AUTHORIZED_USER`: GitHub username allowed to access the system
- `SESSION_COOKIE_NAME` (optional): Name of the session cookie (default `__Host-link_session`)
- `SESSION_MAX_AGE` (optional): Session lifetime in seconds (default `28800`)

Note: The admin UI is served from the same origin at `/admin`, so a dedicated `MANAGEMENT_ORIGIN` is no longer required.

### Required Environment Variables (Admin)
- `VITE_API_BASE`: Worker API base URL
- `VITE_WORKER_DOMAIN`: Domain for shortcode redirects

## Testing Strategy

- Worker tests use Vitest with Cloudflare Workers testing utilities
- Tests cover API endpoints, authentication logic, and database operations
- Manual testing checklist includes OAuth flow, CRUD operations, and redirect functionality
- Use `npx wrangler tail` for real-time log debugging
- Analytics unit tests in `src/test-analytics.js` verify UTM parsing and bot detection
- Migration script `src/migrate-analytics.sql` reconciles data inconsistencies

## Deployment Notes

- Worker deploys via `wrangler deploy` to Cloudflare Workers
- Management panel is embedded and served by the Worker at `/admin`
- D1 database migrations handled through Wrangler CLI
- Environment variables must be set in Cloudflare Dashboard for production

## Analytics Monitoring

### Error Monitoring
```bash
# Monitor analytics errors in real-time
npx wrangler tail --format pretty | grep -i "analytics"

# Check for specific error patterns
npx wrangler tail --format pretty | grep -E "(Analytics.*failed|statement.*failed)"
```

### Data Consistency Checks
```bash
# Check analytics counter consistency
npx wrangler d1 execute mack-link --remote --command "SELECT 
    'Links total' as source, SUM(clicks) as count FROM links WHERE archived=0
UNION ALL
    SELECT 'Analytics counter' as source, value as count FROM counters WHERE name='analytics:_all:totalClicks'
UNION ALL
    SELECT 'Analytics daily total' as source, SUM(clicks) as count FROM analytics_day WHERE scope='_all';"

# Verify UTM tracking is working
npx wrangler d1 execute mack-link --remote --command "SELECT dimension, key, clicks FROM analytics_agg WHERE dimension LIKE 'utm_%' ORDER BY clicks DESC LIMIT 10;"
```

### Performance Metrics
- Monitor `counters` table growth for traffic trends
- Check `analytics_day` for daily click patterns  
- Review `analytics_agg` for top referrers and UTM performance
- Use Cloudflare Analytics for worker request patterns and errors
