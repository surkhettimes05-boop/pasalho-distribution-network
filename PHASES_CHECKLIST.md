# Project Phases Checklist

## Phase 1 — Basic app & data
- [x] DB schema, products, retailers, orders
- [x] SalesRep table and basic reps API

## Phase 2 — Auth, profile, order history (Completed)
- [x] Password hashing and seeding
- [x] Login endpoint (email/password)
- [x] JWT auth issuance (access & refresh)
- [x] Protect orders + profile endpoints
- [x] Refresh & logout with revocation (hashed tokens)
- [x] Rep profile page
- [x] Order history page

## Phase 3 — Data integrity & background processing
- [ ] Part 1 — Background Job Processing
- [ ] Part 2 — Inventory Sync & Reservation
- [ ] Part 3 — Reporting & Analytics Endpoints
- [ ] Part 4 — Role-Based Access Control (RBAC)
- [ ] Part 5 — Scale & DB Optimization

## Phase 4 — Offline & PWA
- [ ] Part 1 — PWA & Offline Support
- [ ] Part 2 — Local Storage Sync & Conflict Resolution
- [ ] Part 3 — Mobile UI Improvements
- [ ] Part 4 — Background Sync & Retry Logic
- [ ] Part 5 — Device & Data Export/Import
Progress: Basic PWA scaffolding added (`public/manifest.json`, `public/sw.js`, service worker registration).
Local sync helpers: `lib/localSync.ts` added.
Export/import API endpoints: `app/api/reps/export/route.ts` added.

## Phase 5 — Production readiness
- [ ] Part 1 — CI/CD and Automated Deployments
- [ ] Part 2 — Monitoring, Logging & Alerts
- [ ] Part 3 — Backups & Disaster Recovery
- [ ] Part 4 — Security Audit & Hardening
- [ ] Part 5 — Documentation & Handover

---
Last updated: 2026-07-02
