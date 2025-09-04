# Admin (React)

This is the React admin UI for mack.link. Most development tasks should be run from the repository root using npm workspaces.

## Common tasks (from repo root)

- Install dependencies (all workspaces):
  - `npm ci`
- Start Admin dev server (http://localhost:5173):
  - `npm run dev:management`
  - or start both Worker + Admin: `npm run dev`
- Build Admin:
  - `npm -w management run build`
- Lint Admin:
  - `npm -w management run lint`

## Environment
- Local development uses:
  - `VITE_API_BASE=http://localhost:8787` (default in docs)
  - `VITE_WORKER_DOMAIN=localhost:8787`
- Production builds are embedded and served by the Worker at `/admin`.
