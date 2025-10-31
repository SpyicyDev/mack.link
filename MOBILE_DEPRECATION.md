# Mobile Package Deprecation Notice

**Date:** October 31, 2025

## Summary

The `mobile/` workspace has been removed from this project as part of a technical hardening initiative. The project is now focused on a single, high-quality web admin interface that works excellently on mobile browsers.

## Rationale

- **Reduced maintenance burden:** Maintaining a separate Ionic/Capacitor mobile app added complexity without significant benefits
- **Modern web capabilities:** The admin interface is fully responsive and provides excellent mobile browser experience
- **Simplified architecture:** Consolidating to a single UI codebase reduces code duplication and drift
- **Better alignment:** Focus engineering resources on the core web-based admin experience

## Migration Path

If you were using the mobile package:

1. **Access via mobile browser:** The admin interface at `/admin` is fully responsive and works on all mobile devices
2. **Progressive Web App:** Consider adding PWA capabilities to the admin interface for app-like experience
3. **Archived code:** The mobile package code is preserved in git history at commit `[commit-hash]` if needed for reference

## Alternatives

- Use the responsive web admin interface on mobile browsers
- Consider browser bookmarks or "Add to Home Screen" for quick access
- For native app needs, the API remains fully functional for custom integrations

## Questions?

For questions or concerns about this change, please open an issue in the GitHub repository.

