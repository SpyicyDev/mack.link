# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Worker Development
```bash
# Start local development server
cd worker && npm run dev

# Run tests
cd worker && npm test

# Deploy to production
cd worker && npm run deploy

# Manage secrets
echo "secret_value" | npx wrangler secret put SECRET_NAME

# Tail worker logs
npx wrangler tail

# Create KV namespace
npx wrangler kv namespace create LINKS
```

### Management Panel Development
```bash
# Start development server (requires worker running)
cd management && npm run dev

# Build for production
cd management && npm run build

# Lint code
cd management && npm run lint

# Preview production build
cd management && npm run preview
```

### Full Stack Development
Start both services for complete local development:
```bash
# Terminal 1: Start worker
cd worker && npm run dev

# Terminal 2: Start management panel
cd management && npm run dev
```

Access:
- Worker API: http://localhost:8787
- Management UI: http://localhost:5173
- Test redirects: http://localhost:8787/{shortcode}

## Architecture Overview

This is a two-part URL shortener system built on Cloudflare's edge platform:

### Core Components

**Cloudflare Worker** (`/worker/`)
- **Entry Point**: `src/index.js` - Main worker with request lifecycle management
- **Routing**: `src/routes.js` handles request dispatching between redirects and API
- **Authentication**: `src/auth.js` manages GitHub OAuth and session verification
- **Database**: `src/db.js` abstracts Cloudflare D1 operations for link storage
- **API Router**: `src/routes/routerApi.js` handles all `/api/*` endpoints
- **Redirect Handler**: `src/routes/redirect.js` processes shortcode redirects
- **Session Management**: `src/session.js` handles JWT-based session cookies

**React Management Panel** (`/management/`)
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
- `management/vite.config.js`: Frontend build configuration
- `management/tailwind.config.js`: Tailwind CSS customization

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
- Real-time updates with configurable polling intervals

### Performance Optimizations
- Edge-first architecture with Cloudflare Workers
- Efficient D1 queries with proper indexing
- Frontend code splitting and lazy loading
- Optimized bundle size with Vite

## Environment Setup

### Required Environment Variables (Worker)
- `GITHUB_CLIENT_ID`: OAuth application ID
- `GITHUB_CLIENT_SECRET`: OAuth application secret (via `wrangler secret put`)
- `AUTHORIZED_USER`: GitHub username allowed to access the system
- `MANAGEMENT_ORIGIN`: CORS allowlist for management UI origins

### Required Environment Variables (Management)
- `VITE_API_BASE`: Worker API base URL
- `VITE_WORKER_DOMAIN`: Domain for shortcode redirects

## Testing Strategy

- Worker tests use Vitest with Cloudflare Workers testing utilities
- Tests cover API endpoints, authentication logic, and database operations
- Manual testing checklist includes OAuth flow, CRUD operations, and redirect functionality
- Use `npx wrangler tail` for real-time log debugging

## Deployment Notes

- Worker deploys via `wrangler deploy` to Cloudflare Workers
- Management panel deploys to Cloudflare Pages
- D1 database migrations handled through Wrangler CLI
- Environment variables must be set in Cloudflare Dashboard for production
