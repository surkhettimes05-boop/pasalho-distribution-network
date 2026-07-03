**Phase 3 — Implementation Plan (divided into 5 parts)**

Overview
- Goal: Improve data integrity, scalability, background processing, reporting, and role-based access.

Parts

Part 1 — Background Job Processing
- What: Introduce a job queue (BullMQ or node-resque) for long-running tasks (order processing, inventory adjustments, email notifications).
- Files/areas: `lib/queue.ts` (new), worker scripts in `scripts/worker.js`, adapt order creation to enqueue jobs.
- Acceptance: Orders enqueue jobs; worker processes jobs reliably; retry handling in place.
- Estimate: 4–8 hours.

Part 2 — Inventory Sync & Reservation
- What: Implement transactional reservation of inventory on order creation and async reconciliation jobs to sync stock levels.
- Files/areas: `app/api/orders/route.ts`, `lib/inventory.ts`, background worker jobs.
- Acceptance: Orders reduce available stock atomically; low-stock alerts created.
- Estimate: 4–8 hours.

Progress: Implemented atomic reservation in `app/api/orders/route.ts`. On order creation the endpoint now locks inventory rows (`FOR UPDATE`), checks stock, decrements `stockOnHand`, and inserts `OrderItem`s. Worker enqueues handle background processing.

Part 3 — Reporting & Analytics Endpoints
- What: Add endpoints for sales reports, top products, rep performance; consider aggregated materialized views or cached results for performance.
- Files/areas: `app/api/reports/*`, DB views, cron job to refresh summaries.
- Acceptance: Reports return correct aggregated metrics within acceptable latency.
- Estimate: 4–8 hours.

Part 4 — Role-Based Access Control (RBAC)
- What: Add roles (admin, distributor, rep) and enforce permissions on APIs and UI. Extend `SalesRep` or create `User`/`Role` models as needed.
- Files/areas: DB migration, `lib/permissions.ts`, protect admin routes.
- Acceptance: Only authorized roles can perform sensitive actions (e.g., create products, seed data).
- Estimate: 3–6 hours.

Part 5 — Scale & DB Optimization
- What: Add indices, optimize queries, add pagination, and implement connection pool tuning. Prepare for read replicas if needed.
- Files/areas: DB migrations (indexes), query refactors, `lib/db.ts` tuning.
- Acceptance: Key endpoints show reduced latency and correct pagination under load.
- Estimate: 4–12 hours (depending on profiling depth).
