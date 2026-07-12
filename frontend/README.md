# Burger Club Frontend

React + TypeScript frontend for Burger Club. The root
[`README.md`](../README.md) is the main project overview; this file only covers
frontend-specific development notes.

## Local Development

Install dependencies and start the CRA dev server:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). In development, relative
`/api` requests are proxied to `http://localhost:5001` through the `proxy`
setting in `package.json`.

## Scripts

```bash
npm start
npm run typecheck
npm run lint
npm run format
npm run format:check
CI=true npm test -- --watchAll=false
npm run build
```

## Frontend Notes

- Access tokens are stored in memory through the auth provider; refresh tokens
  stay in HttpOnly cookies managed by the backend.
- The API wrapper handles request timeouts, CSRF headers, refresh retries, and
  auth-session events.
- Cart quote validation is debounced and always uses backend-calculated AUD
  cents before checkout.
- Admin, profile, order details, OAuth callback, reset password, and staff
  invite routes are lazy-loaded at route boundaries.
- Production routing and API rewrites are configured in `vercel.json`.

## Architecture Conventions

### Hooks Placement

Use these rules for new hooks. Existing files can move incrementally when a
nearby feature changes.

1. `store/<domain>/hooks/` for hooks bound to one domain context or store.
   Examples: `useAuth`, cart persistence, cart quote hooks.
2. `features/<domain>/hooks/` for feature-level behavior, such as request
   orchestration or checkout flows. If a feature tree does not exist yet, keep
   the hook near the page or in `src/hooks` until that feature is introduced.
3. `src/hooks/` for generic reusable hooks with no domain ownership. Examples:
   debounce, local storage, or intersection observer helpers.

The goal is to keep store wiring, feature behavior, and generic utilities from
collapsing into one catch-all hooks directory.
