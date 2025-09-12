# Mack.link 🔗

A fast, secure, and modern URL shortener that you can deploy in minutes. Built with Cloudflare Workers for lightning-fast redirects and featuring a beautiful React management interface.

✨ **[Live Demo](https://link.mackhaymond.co)** | 🔧 **[Admin Panel](https://link.mackhaymond.co/admin)**

## ✨ Features

- 🚀 **Lightning Fast**: Global edge network redirects in <50ms
- 🔒 **Secure**: GitHub OAuth authentication + password-protected links
- 🎨 **Beautiful UI**: Modern React admin panel with dark/light themes
- 📊 **Analytics**: Click tracking, UTM parameters, device/browser insights
- 🌍 **Custom Domain**: Use your own domain for branded short URLs
- 💰 **Cost Effective**: Runs on Cloudflare's free tier (100K requests/day)
- ⚡ **Simple Deploy**: One-command deployment

## 🚀 Quick Start

### Try the Demo (1 minute)
Visit the [live demo](https://link.mackhaymond.co/admin) to see the interface in action.

### Deploy Your Own (10 minutes)
```bash
# 1. Fork this repository on GitHub
# 2. Clone and install
git clone https://github.com/YOUR_USERNAME/mack.link.git
cd mack.link && npm install

# 3. Deploy to Cloudflare Workers
npm run deploy
```

That's it! 🎉 Your URL shortener is live.

📖 **Need detailed setup help?** Follow our step-by-step [Setup Guide](./docs/SETUP.md).

## 🛠️ What You Get

- **Short URLs**: `https://yourdomain.com/abc123`
- **Admin Panel**: `https://yourdomain.com/admin` 
- **Analytics Dashboard**: Click tracking and insights
- **Password Protection**: Secure sensitive links
- **Scheduled Links**: Set activation and expiration dates
- **Bulk Operations**: Import/export links via CSV

## 🏗️ Architecture

Single Cloudflare Worker that handles everything:
- **Redirects** (`/{shortcode}`) with password protection
- **Admin UI** (`/admin`) - embedded React app  
- **API** (`/api/*`) for link management
- **Database** - Cloudflare D1 (serverless SQLite)

No complex microservices or multiple deployments needed.

## 📖 Documentation

**Getting Started:**
- 🚀 [Setup Guide](./docs/SETUP.md) - Deploy your own instance
- 📖 [User Guide](./docs/USER_GUIDE.md) - How to use the admin interface

**For Developers:**
- 🔧 [Development Guide](./docs/DEVELOPMENT.md) - Local development setup  
- 📡 [API Reference](./docs/API.md) - Complete API documentation
- 🚀 [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- 🔑 [GitHub Secrets](./docs/GITHUB_SECRETS.md) - CI/CD configuration

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

**Quick start for contributors:**
1. Fork the repository
2. Clone: `git clone https://github.com/YOUR_USERNAME/mack.link.git`
3. Install: `npm install`
4. Develop: `npm run dev`
5. Submit a pull request

## ❤️ Support

- ⭐ [Star this repository](https://github.com/SpyicyDev/mack.link) to show your support
- 🐛 [Report issues](https://github.com/SpyicyDev/mack.link/issues) or request features
- 💬 [Join discussions](https://github.com/SpyicyDev/mack.link/discussions) for help and ideas

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [SpyicyDev](https://github.com/SpyicyDev)**

[⭐ Star on GitHub](https://github.com/SpyicyDev/mack.link) • [🚀 Try Demo](https://link.mackhaymond.co/admin) • [📖 Docs](./docs/SETUP.md)

</div>
