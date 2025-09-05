# link.mackhaymond.co 🍌

A personal URL shortener built with Cloudflare Workers and React, featuring GitHub OAuth authentication and a beautiful management interface.

## 🚀 Features

- **Fast Redirects**: Powered by Cloudflare Workers for global edge performance
- **Secure Management**: GitHub OAuth authentication with user restrictions
- **Beautiful UI**: Modern React interface with Tailwind CSS
- **Analytics**: Click tracking and usage statistics
- **Custom Domain**: Professional short URLs on your own domain
- **Real-time Updates**: Live link management and editing

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Worker                          │
│           (link.mackhaymond.co)                         │
│                                                         │
│  • Handles redirects (/{shortcode})                     │
│  • Serves React admin panel (/admin/*)                  │
│  • Manages API endpoints (/api/*)                       │
│  • GitHub OAuth verification                            │
│  • Click analytics tracking                             │
│  • Static asset serving for admin UI                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│             Cloudflare D1 (SQLite)                      │
│                                                         │
│  • Links table (shortcode, url, metadata, status)       │
│  • Analytics tables (timeseries and breakdowns)         │
│    - analytics_day, analytics_agg, analytics_day_agg    │
│  • Global counters                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         Embedded Admin Interface                        │
│          (link.mackhaymond.co/admin)                    │
│                                                         │
│  • React + Tailwind CSS (embedded in worker)            │
│  • GitHub OAuth login (same-domain)                     │
│  • CRUD operations for links                            │
│  • Analytics dashboard                                  │
│  • No CORS issues - same domain                         │
└─────────────────────────────────────────────────────────┘
```

## 🌐 Live Deployment

- **Short URLs**: https://link.mackhaymond.co
- **Admin Panel**: https://link.mackhaymond.co/admin
- **Repository**: https://github.com/SpyicyDev/mack.link

## 📊 Usage Stats (Cloudflare Free Tier)

- **Redirects**: Up to 100,000 per day
- **New Links**: Up to 1,000 per day  
- **Storage**: 1GB (millions of links)
- **Management**: Unlimited usage

## 🔐 Security

- **User Authentication**: GitHub OAuth integration
- **Access Control**: Restricted to authorized users only
- **API Protection**: HttpOnly session cookies with server-side verification (Bearer tokens still supported for backward compatibility)
- **CORS Policy**: Configured for secure cross-origin requests

## 🛠 Tech Stack

**Backend (Cloudflare Worker):**
- Cloudflare Workers (Serverless)
- Cloudflare D1 (SQLite)
- GitHub OAuth API
- JavaScript/ES Modules

**Frontend (Admin Panel):**
- React 18
- Vite (Build tool)
- Tailwind CSS
- Lucide React (Icons)
- Served by Cloudflare Worker (/admin)

## 📁 Project Structure

```
mack.link/
├── worker/                 # Cloudflare Worker
│   ├── src/               # Worker modules (router, routes, auth, utils, config)
│   │   ├── routes/        # Route handlers (admin, api, redirect, oauth)
│   │   ├── admin-assets.js # Embedded React build files
│   │   └── index.js       # Worker entrypoint
│   ├── scripts/           # Build tools
│   │   └── build-admin.js # Embeds React build into worker
│   ├── wrangler.jsonc     # Worker configuration
│   └── package.json
├── admin/                 # React admin panel (builds to worker)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API & auth services
│   │   └── App.jsx        # Main application
│   ├── dist/              # Build output (embedded in worker)
│   └── package.json
├── docs/                  # Documentation
└── package.json          # Root build scripts
```

## 🚀 Quick Start

### Development (npm workspaces)
```bash
# Install all workspace dependencies (single lockfile)
npm ci

# Start both dev servers (Worker + Admin)
npm run dev

# Or run separately
npm run dev:worker      # Build admin assets and start wrangler dev (http://localhost:8787)
npm run dev:admin       # Vite dev server for admin (http://localhost:5173)
```

### Production Deployment
```bash
# Build everything and deploy (CI or local)
npm run deploy

# Or step by step
npm run build                  # Builds admin and worker via workspaces
npm -w worker run deploy       # Deploy worker with Wrangler
```

See [SETUP.md](./docs/SETUP.md) for detailed setup instructions. The admin panel is now served directly from the worker at `/admin` - no separate deployment needed!

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - Complete deployment instructions
- [API Documentation](./docs/API.md) - Worker API endpoints (includes pagination and analytics filters)  
- [Development Guide](./docs/DEVELOPMENT.md) - Local development setup
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment (OAuth callback at /admin/auth/callback)
- [GitHub Secrets](./docs/GITHUB_SECRETS.md) - CI/CD configuration (admin build env)
- [Architecture Decision](./docs/ADMIN_INTEGRATION.md) - Why we merged admin into worker

## 🤝 Contributing

This is a personal project, but feel free to fork it for your own use!

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ by SpyicyDev**

*Powered by Cloudflare Workers & React*
