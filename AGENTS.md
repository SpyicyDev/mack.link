# Agents Guide

This repository supports AI agents working locally with a zero-click dev authentication flow for the Admin UI and clear operational guidelines.

## Quick Start (Local)

- Start dev servers:
  - `npm run dev:ai`
  - Worker: http://localhost:8787
  - Admin: http://localhost:5173/admin
- Open the Admin UI; it will auto-authenticate without redirects or cookies.
- Look for the badge “Auth disabled (dev)” in the header.

## How dev auth works

- Admin runs with `VITE_AUTH_DISABLED=true` and sends `x-dev-auth: 1` on API requests.
- Worker accepts this header only for `Host: localhost` / `127.0.0.1` and returns a mock user.
- Authorized-user enforcement is skipped in this local mode.
- Cookies are not required; no OAuth roundtrip.

Troubleshooting:
- `/api/user` 403 → ensure request includes `x-dev-auth: 1` and Host is `localhost:8787`.
- `/api/user` 401 → dev bypass not applied; ensure `npm run dev:ai` is running and Admin has `VITE_AUTH_DISABLED=true`.

## Safe operation in Warp

- Long-running commands: describe what you need tested before running. Example: “Start `npm run dev:ai`. Then, open `/admin`, create `test1 → https://example.com`, verify redirect at `http://localhost:8787/test1`.” Wait for user approval (“continue”).
- Use local logs when debugging: `npm run logs:tail`.
- Version control: commit in logical chunks, prefer rebase over merge, push when a feature is complete.

## Typical agent tasks

- Implement a UI feature: run `npm run dev:ai`, make code edits, refresh browser, and validate.
- API changes: edit Worker files in `worker/src/`, verify via curl or browser, then update Admin service files.
- Database migrations: modify `worker/src/schema.sql`, apply locally with `npm run db:apply:local`.

## Verification checklist

- Admin loads without manual sign-in in dev mode
- Creating, updating, and deleting links works
- Redirects function (test shortcodes)
- Analytics endpoints respond (overview, breakdown, timeseries)

## Notes

- The local-only header bypass is ignored in production.
- Do not depend on third-party cookies during Admin dev.
- For CI or headless tests, POST `/api/auth/dev/login` with `x-dev-auth: 1` if needed.