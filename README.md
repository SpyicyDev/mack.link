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
│  • Handles redirects                                    │
│  • Manages API endpoints                                │
│  • GitHub OAuth verification                            │
│  • Click analytics tracking                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│             Cloudflare KV                               │
│                                                         │
│  • Stores link mappings                                 │
│  • Click counts & timestamps                            │
│  • Link metadata                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            Management Interface                         │
│        (link-management.mackhaymond.co)                 │
│                                                         │
│  • React + Tailwind CSS                                 │
│  • GitHub OAuth login                                   │
│  • CRUD operations for links                            │
│  • Analytics dashboard                                  │
└─────────────────────────────────────────────────────────┘
```

## 🌐 Live Deployment

- **Short URLs**: https://link.mackhaymond.co
- **Management Panel**: https://link-management.mackhaymond.co
- **Repository**: https://github.com/SpyicyDev/mack.link

## 📊 Usage Stats (Cloudflare Free Tier)

- **Redirects**: Up to 100,000 per day
- **New Links**: Up to 1,000 per day  
- **Storage**: 1GB (millions of links)
- **Management**: Unlimited usage

## 🔐 Security

- **User Authentication**: GitHub OAuth integration
- **Access Control**: Restricted to authorized users only
- **API Protection**: Bearer token verification on all endpoints
- **CORS Policy**: Configured for secure cross-origin requests

## 🛠 Tech Stack

**Backend (Cloudflare Worker):**
- Cloudflare Workers (Serverless)
- Cloudflare KV (Storage)
- GitHub OAuth API
- JavaScript/ES Modules

**Frontend (Management Panel):**
- React 18
- Vite (Build tool)
- Tailwind CSS
- Lucide React (Icons)
- Cloudflare Pages (Hosting)

## 📁 Project Structure

```
mack.link/
├── worker/                 # Cloudflare Worker
│   ├── src/index.js       # Main worker script
│   ├── wrangler.jsonc     # Worker configuration
│   └── package.json
├── management/            # React management panel
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API & auth services
│   │   └── App.jsx        # Main application
│   ├── public/
│   │   └── favicon.jpg    # Custom banana favicon
│   └── package.json
└── docs/                  # Documentation
```

## 🚀 Quick Start

See [SETUP.md](./docs/SETUP.md) for detailed setup instructions.

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - Complete deployment instructions
- [API Documentation](./docs/API.md) - Worker API endpoints
- [Development Guide](./docs/DEVELOPMENT.md) - Local development setup
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

This is a personal project, but feel free to fork it for your own use!

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ by SpyicyDev**

*Powered by Cloudflare Workers & React*
