# Worker (Cloudflare Worker)

This is the Cloudflare Worker for mack.link. Most development tasks should be run from the repository root using npm workspaces.

## Common tasks (from repo root)

- Install dependencies (all workspaces):
  - `npm ci`
- Start Worker in dev (builds admin assets and runs wrangler dev):
  - `npm run dev:worker`
  - or start both Worker + Admin: `npm run dev`
- Build only the Worker (after building admin):
  - `npm -w worker run build`
- Deploy to production (builds admin + worker, then deploys):
  - `npm run deploy`
- Apply D1 schema locally:
  - `npm -w worker run db:apply:local`
- Apply D1 schema to production:
  - `npm -w worker run db:apply`
- Run tests:
  - `npm -w worker run test`

## Notes
- The admin UI is embedded into the Worker during the build: `npm -w worker run build:admin`.
- The generated file `worker/src/admin-assets.js` is ignored by git and will be recreated by the build step.

