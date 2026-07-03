# Pasalho DNP — Product Requirements Document
**Field Sales Order Capture Platform for FMCG Distributors**
Pilot customer: Pramod's father's wholesale distribution business
Stack: NestJS · Next.js · PostgreSQL · Prisma

---

## Governing Rule: Anti-Khaacho

Khaacho died because it never crossed a real external transaction. Every phase below has one job: get closer to real money moving through the system, entered by a real person who is not you. If a phase doesn't move that needle, it doesn't get built yet — no matter how "obviously needed" it feels.

**Hard rule:** You cannot start Phase N+1 until Phase N's exit criteria is true in reality, not in your head, not "basically done."

---

## Phase 1 — First Real Order (Weeks 1–2)

**Goal:** One real order, entered independently by your father, with zero help from you, that reflects an actual sale.

**In scope:**
- Admin dashboard: login, add/edit product (name, price, unit), add/edit retailer (name, location, phone)
- Order entry screen: select retailer → add line items → quantity → save
- Order list view: see orders placed, status (pending/confirmed)
- One user role: admin (your father). No sales rep app yet.

**Explicitly out of scope:**
- Mobile field app
- Multiple sales reps
- Inventory tracking
- Payments/invoicing
- Analytics, dashboards, AI anything
- Multi-distributor support

**Exit criteria (binary, not vibes):**
Your father opens the dashboard himself, on his own device, with no one standing next to him, and places one order that corresponds to a real retailer and real goods moving. You did not enter it. You did not walk him through it live.

**Failure definition:** If after 2 weeks he hasn't done this unprompted, the problem isn't features — it's usability, trust, or workflow fit. Stop building. Go sit with him and watch him try to use it. Do not add more screens to compensate.

---

## Phase 2 — Real Usage, Not Just Real Capability (Weeks 3–5)

**Goal:** Your father uses the dashboard as *his default way* of recording orders for at least 2 consecutive weeks, replacing (not supplementing) whatever he does today — notebook, phone calls, memory.

**In scope:**
- Sales rep mobile-friendly order entry (if he has reps who take orders in the field — only build this if Phase 1 proved the desktop flow works and reps are the actual bottleneck)
- Basic retailer order history (so he can see "what did this shop order last time" — this is usually the #1 real request from distributors)
- Order editing/cancellation (real businesses have mistakes and returns)
- Simple order status flow: pending → confirmed → delivered

**Explicitly out of scope:**
- Payment collection features
- Inventory/stock management
- Any second distributor as a customer
- Reporting/analytics beyond a basic order list

**Exit criteria:**
10+ real orders in the system in a 2-week window, entered without your involvement, where your father would be annoyed if you took the tool away.

**Failure definition:** If usage drops off after the novelty wears off, that's signal the tool isn't solving his actual daily pain — not a bug list to fix.

---

## Phase 3 — Distributor Operations Layer (Weeks 6–9)

**Only start this once Phase 2's exit criteria is real.**

**Goal:** The system becomes useful for running the business, not just logging orders — inventory awareness and basic payment tracking, because this is what turns "order logger" into "something he'd pay for."

**In scope:**
- Stock/inventory: current quantity per product, manual stock-in entry
- Low-stock flags
- Payment status per order (paid / partial / credit outstanding) — critical for FMCG wholesale where credit terms are the norm
- Basic retailer ledger: how much a retailer owes across orders
- Simple invoice/receipt generation (PDF) per order

**Explicitly out of scope:**
- Automated reordering
- Supplier-side integration
- Multi-warehouse logic
- AI forecasting

**Exit criteria:**
Your father uses the credit/ledger feature to actually decide whether to extend a retailer more goods on credit — i.e., the system influences a real business decision, not just records history.

**Failure definition:** If he keeps the ledger in his head or a separate notebook and only uses your system for orders, the ops layer isn't earning its keep — don't expand it, investigate why.

---

## Phase 4 — Second Distributor (Weeks 10–14)

**Only start this once Phase 3 is proven with one distributor.**

**Goal:** Prove Pasalho DNP works for someone who isn't your father — someone with no personal obligation to be patient with you.

**In scope:**
- Multi-tenant support (data isolation per distributor)
- Onboarding flow that doesn't require you to hand-hold every step
- Whatever configuration differences a second real distributor actually needs (don't guess — find the second customer first, then build for their specific gaps)
- Basic pricing: is this free, or are you charging? Decide before onboarding, not after.

**Explicitly out of scope:**
- Building for hypothetical "distributors in general" — build for the specific second customer you land
- Any AI/intelligence features
- White-labeling, franchise features, anything speculative

**Exit criteria:**
A second, unrelated distributor is using the system for real orders, paying (even a token amount) or clearly on a path to paying, with support effort from you that's sustainable — not you personally debugging their account daily.

**Failure definition:** If you can't find a second real distributor willing to try it, that's the most important data point in this entire PRD. It means Phase 1–3 built something your father tolerates because he's your father, not something the market wants. Do not go to Phase 5. Go find out why.

---

## Phase 5 — Intelligence & Scale (Only after 2+ paying/committed distributors)

**Goal:** Now, and only now, does the "AI-powered supply chain" ambition get a foothold — because you have real data and real users to build it for, instead of guessing.

**In scope (pick based on what real distributors ask for, not what's exciting to build):**
- Basic analytics: top products, retailer order frequency, revenue trends
- Reorder suggestions based on historical patterns (this is where the earlier "Pasalho Brain" concept belongs — as a feature inside DNP, not a separate product)
- Multi-distributor benchmarking (if useful and privacy-safe)
- API/integration layer if a distributor's other tools demand it

**Explicitly out of scope until proven needed:**
- Anything you can't point to a specific requesting user for
- Full agentic AI systems
- Speculative features from the earlier over-scoped supply-chain PRD

**Exit criteria:**
Not applicable as a gate — this phase is ongoing, driven by paying customer requests. This is the only phase where you're allowed to build ahead of explicit demand, because by now you have proof the core product works.

---

## What This PRD Deliberately Refuses To Do

- No AI features before Phase 5. None. Not a chatbot, not a forecasting model, not an "insights" panel.
- No multi-distributor architecture before you have a second distributor. Building for scale you don't have is exactly the Khaacho pattern.
- No feature gets added because it's "probably needed eventually." Every addition traces to a phase exit criteria or a specific user request.
- Each phase's failure definition is not a suggestion — it's a stop sign. If you hit one, the next step is a conversation with your father or a retailer, not a sprint.

---

## Quick Reference: Exit Criteria Summary

| Phase | Exit Criteria (one line) |
|---|---|
| 1 | Father places 1 real order, unassisted |
| 2 | 10+ real orders in 2 weeks, unprompted usage |
| 3 | Ledger feature actually drives a real credit decision |
| 4 | Second real distributor using it, paying or committed |
| 5 | Ongoing — driven by real customer requests only |
