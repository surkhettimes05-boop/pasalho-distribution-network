# Pasalho DNP — Documentation

This `docs/` folder contains runbooks and developer guides.

Quick start:

1. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, optionally `REDIS_URL`.
2. Install dependencies: `npm install`.
3. Prepare DB: run scripts under `scripts/` (create refresh table, indexes, etc.).
4. Start Redis (if using background jobs): `redis-server`.
5. Start worker: `node scripts/worker.js`.
6. Run Next app: `npm run dev`.

Contact: development team.
