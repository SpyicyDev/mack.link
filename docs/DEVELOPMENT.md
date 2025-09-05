# Development Guide 💻

Guide for local development and contributing to link.mackhaymond.co.

## Prerequisites

- Node.js 20.19+
- npm or yarn
- Git
- Cloudflare account (for D1 database)

## Initial Setup (Workspaces)

```bash
# Clone the repository
git clone https://github.com/SpyicyDev/mack.link.git
cd mack.link

# Install all workspace dependencies (single lockfile)
npm ci

# Apply D1 schema locally (required once or when schema changes)
npm -w worker run db:apply:local
```

## Environment Configuration

### Worker Environment

The worker uses `wrangler.jsonc` for configuration. For local development secrets:
```bash
# Set secrets via Wrangler (for local development)
echo "your_github_client_secret" | npx wrangler secret put GITHUB_CLIENT_SECRET
echo "your_random_jwt_secret" | npx wrangler secret put JWT_SECRET
```

Edit `worker/wrangler.jsonc` for public configuration (example):
```json
{
  "vars": {
    "GITHUB_CLIENT_ID": "your_github_client_id",
    "AUTHORIZED_USER": "your_github_username",
    "SESSION_COOKIE_NAME": "__Host-link_session",
    "SESSION_MAX_AGE": "28800"
  }
}
```
Note: If `SESSION_COOKIE_NAME` is omitted, the app defaults to `__Host-link_session`.

### Admin Panel Environment

Create `admin/.env.local` for local development:
```env
VITE_API_BASE=http://localhost:8787
VITE_WORKER_DOMAIN=localhost:8787
# VITE_GITHUB_CLIENT_ID is optional for the admin build; the server drives OAuth
# VITE_GITHUB_CLIENT_ID=your_oauth_client_id
```

## Local Development

### Option A: One command (recommended)

```bash
# From the repo root, start both Worker (wrangler dev) and Admin (Vite) concurrently
npm run dev
```

- Worker: http://localhost:8787 (builds admin assets first, then starts wrangler dev)
- Admin:  http://localhost:5173

### Option B: Start separately

#### Start the Worker

```bash
npm -w worker run dev
```

This starts the worker on `http://localhost:8787` with:
- Hot reload on file changes
- Local D1 database (Wrangler test environment)
- Full API endpoints available

#### Start the Admin Panel

```bash
npm -w admin run dev
```

This starts the React app on `http://localhost:5173` with:
- Hot reload on file changes
- Vite dev server
- Proxy to local worker API

### Test the Integration

1. Open `http://localhost:5173`
2. Click "Sign in with GitHub"
3. Complete OAuth flow
4. Create test links
5. Test redirects at `http://localhost:8787/{shortcode}`

## Project Structure (Workspaces)

```
mack.link/
├── worker/                     # Cloudflare Worker
│   ├── src/
│   │   ├── index.js            # Worker entry
│   │   ├── routes.js           # Router (admin/api/redirect dispatch)
│   │   ├── routes/
│   │   │   ├── admin.js        # Admin static serving (embedded assets)
│   │   │   ├── routerApi.js    # /api/* router
│   │   │   ├── routesLinks.js  # Link CRUD handlers
│   │   │   ├── routesOAuth.js  # GitHub OAuth handlers
│   │   │   ├── redirect.js     # Shortcode redirects
│   │   │   └── password.js     # Password verification endpoint
│   │   ├── analytics.js        # Analytics helpers (D1)
│   │   ├── auth.js             # Auth/session helpers
│   │   ├── session.js          # JWT cookie helpers
│   │   ├── db.js               # D1 helpers
│   │   ├── cors.js             # CORS helpers
│   │   ├── validation.js       # Input validation
│   │   └── logger.js           # Structured logging
│   ├── scripts/
│   │   └── build-admin.js      # Embed admin assets
│   ├── wrangler.jsonc          # Worker config
│   └── package.json
├── admin/                      # React admin panel
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── providers/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── vite.config.js
│   └── package.json
└── docs/                       # Documentation
```

## Code Style

### Worker (JavaScript)

- Use ES modules (`import`/`export`)
- Async/await for promises
- Descriptive function names
- Handle errors gracefully
- Follow Cloudflare Workers patterns

Example:
```javascript
async function handleRequest(request, env) {
  try {
    const url = new URL(request.url);
    // Handle request logic
    return new Response('Success');
  } catch (error) {
    console.error('Request failed:', error);
    return new Response('Error', { status: 500 });
  }
}
```

### Admin Panel (React)

- Functional components with hooks
- Tailwind CSS for styling
- Lucide React for icons
- Proper error boundaries
- Loading states for async operations

Example:
```jsx
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);
      // Async operation
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Component JSX */}
    </div>
  );
}
```

## Testing

- Deployment validation script:
  ```bash
  npm run validate:local
  ```

### Manual Testing Checklist

- [ ] OAuth login flow
- [ ] Link creation/editing/deletion
- [ ] Redirect functionality (including archived/scheduled)
- [ ] Password-protected link flow
- [ ] Analytics polling on Analytics tab
- [ ] Error handling
- [ ] Mobile responsiveness

## Debugging

### Worker Debugging

```bash
# View worker logs
npx wrangler tail

# Debug specific function
console.log('Debug info:', data);
```

### Admin Panel Debugging

- Use browser developer tools
- Check Network tab for API calls
- Inspect React components with React DevTools
- Check console for JavaScript errors

## Common Development Tasks

### Adding New API Endpoint

1. Add a handler in `worker/src/routes/routesLinks.js` (or a new file under `routes/`).
2. Register the route in `worker/src/routes/routerApi.js`.
3. Add a client method in `admin/src/services/api.js`.
4. Wire up a React Query hook in `admin/src/hooks/` if needed.

### Adding New UI Component

1. Create component in `admin/src/components/`
2. Import and use in parent component
3. Add appropriate props and styling
4. Handle loading/error states

### Updating Styles

- Modify Tailwind classes in components
- Add custom CSS to `admin/src/index.css`
- Use Tailwind's utility classes when possible

## Deployment Testing

Before deploying to production:

1. Test locally with production-like data
2. Verify all environment variables are set
3. Check that OAuth redirects work with production URLs (see Deployment docs)
4. Test on different browsers and devices
5. Monitor Cloudflare logs after deployment

## Performance Optimization

### Worker Optimization

- Minimize D1 database queries
- Use efficient SQL queries and indexing
- Implement proper caching headers
- Optimize redirect response time
- Batch database operations when possible

### Frontend Optimization

- Lazy load components when appropriate
- Optimize bundle size with Vite
- Use React.memo for expensive renders
- Implement proper loading states

## Security Considerations

- Never log sensitive data
- Validate all user inputs
- Use HTTPS in production
- Implement proper CORS policies
- Regular security audits of dependencies

---

*Happy coding! 🚀*
