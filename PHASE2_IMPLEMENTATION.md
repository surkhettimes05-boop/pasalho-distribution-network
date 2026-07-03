**Phase 2 — Implementation Plan (divided into 5 parts)**

Overview
- Goal: Secure rep authentication, protect APIs, add rep UX (profile + order history), and tests.
- Preconditions: hashed passwords, login endpoint, DB `password` column present (already completed).

Parts

Part 1 — JWT Authentication (Auth issuance)
- What: Replace/extend current `/api/reps/login` to issue a signed JWT access token (and optional refresh token). Add required env vars: `JWT_SECRET`, `JWT_EXPIRES_IN` (e.g. 15m), optionally `JWT_REFRESH_EXPIRES_IN`.
- Files to change: `app/api/reps/login/route.ts`, `lib/auth.ts` (new helper), `package.json` (add `jsonwebtoken`).
- Acceptance: Login returns `{ rep, token }`; token contains `repId` and `distributorId` claims.
- Estimate: 1–3 hours.

Part 2 — Protect API Routes (Auth middleware)
- What: Validate JWT on protected endpoints (orders POST, orders GET with rep scope, retailers/products modifications if any). Attach `currentRep` to request context.
- Files to change: `app/api/orders/route.ts`, `app/api/*` as needed, add `lib/middleware.ts` or small helper `lib/verifyToken.ts`.
- Acceptance: Protected routes reject requests without valid token (401) and allow authorized rep operations.
- Estimate: 1–3 hours.

Part 3 — Logout & Token Expiry / Refresh
- What: Implement client-side logout (remove token) and server-side refresh token flow (optional). For simple approach: short-lived access tokens + client re-login; for stronger approach: issue refresh tokens and a revocation list/table.
- Files to change: `app/api/reps/refresh/route.ts` (optional), client login/logout logic in `app/login/page.tsx` and `app/page.tsx` sign-out.
- Acceptance: Tokens expire; refresh endpoint issues new access tokens; logout clears client tokens and (if implemented) revokes refresh token.
- Estimate: 2–6 hours (simple to full refresh/revoke).

Part 4 — Rep Profile Page
- What: Create protected UI for `My Profile` allowing viewing/editing name, phone. API endpoints: `GET /api/reps/me`, `PUT /api/reps/me` (protected).
- Files to add/change: `app/reps/profile/page.tsx`, `app/api/reps/me/route.ts`.
- Acceptance: Profile page loads when signed in; changes persist in DB and reflect in UI.
- Estimate: 2–4 hours.

Part 5 — Order History & Filtering
- What: Add API and UI for a rep to view their orders: server filters orders by `repId` claim, supports date/status filters and pagination.
- Files to add/change: `app/api/orders/history/route.ts` (or extend `app/api/orders/route.ts`), `app/orders/history/page.tsx` or integrate into existing `app/page.tsx`.
- Acceptance: Rep can view a paginated list of their orders, filter by date/status, and view order details.
- Estimate: 4–8 hours.

Testing & Extras
- Add auth unit/integration tests (Jest + supertest) after Parts 1–3 are functional.
- Consider HTTPS and secure cookie (if storing refresh tokens in cookies) for production.

Next step suggestion
- Implement Part 1 (JWT issuance) first — it's the foundation for everything else.
