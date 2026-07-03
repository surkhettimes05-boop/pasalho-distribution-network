# Pasalho DNP Implementation Plan

## 1. Goal
Build the first version of Pasalho DNP as a simple, trustworthy order capture system for the pilot distributor, with the explicit goal of getting to a real order entered by the end user without assistance.

## 2. Guiding Principles
- Follow the PRD’s anti-khaacho rule: do not build beyond the current phase unless the previous phase’s exit criteria is proven in real use.
- Prioritize workflows that move real money through the system.
- Keep the first release simple, fast to learn, and usable on the pilot user’s device.
- Validate each phase with real user behavior, not assumptions.

## 3. Proposed Solution Architecture
### Frontend
- Next.js for the admin dashboard and order workflow UI.
- Responsive design so the system works well on desktop first, with mobile-friendly behavior as needed later.

### Backend
- NestJS REST API for business logic and data access.
- Prisma ORM with PostgreSQL for persistence.
- Authentication for a single admin user initially.

### Core Data Model
- User / Admin
- Product
- Retailer
- Order
- OrderItem
- OrderStatus
- Optional later: Inventory, Payment, Ledger, Receipt

## 4. Phase-by-Phase Implementation Plan

### Phase 1 — First Real Order
Duration: Weeks 1–2

#### Objective
Enable the pilot user to create one real order independently.

#### Deliverables
- Authentication and protected admin dashboard
- Product management
  - Add/edit product
  - Name, price, unit
- Retailer management
  - Add/edit retailer
  - Name, location, phone
- Order entry flow
  - Select retailer
  - Add line items
  - Enter quantity
  - Save order
- Order list view
  - Show all orders
  - Show order status: pending / confirmed

#### Technical Tasks
1. Set up project structure for Next.js + NestJS + Prisma + PostgreSQL.
2. Create database schema for users, products, retailers, orders, and order items.
3. Implement backend CRUD APIs for products, retailers, and orders.
4. Implement frontend pages for dashboard, products, retailers, order entry, and order list.
5. Add basic validation and error handling.
6. Add simple seed data for pilot testing.

#### Exit Criteria Check
- The pilot user can log in on their own device.
- They can create a retailer, add products, and save an order without assistance.

---

### Phase 2 — Real Usage, Not Just Real Capability
Duration: Weeks 3–5

#### Objective
Make the tool the default way the distributor records orders.

#### Deliverables
- Mobile-friendly order entry if field reps are a real bottleneck
- Retailer order history
- Edit and cancel orders
- Order lifecycle flow: pending → confirmed → delivered

#### Technical Tasks
1. Add order history per retailer.
2. Add order edit and cancellation workflow.
3. Improve the UI for faster repeated ordering.
4. Add status transitions and audit-friendly order state handling.
5. Add basic filters and search for order history.

#### Exit Criteria Check
- At least 10 real orders are entered in a 2-week window.
- The pilot user uses the system without prompting.

---

### Phase 3 — Distributor Operations Layer
Duration: Weeks 6–9

#### Objective
Turn the system into an operational tool, not just an order logger.

#### Deliverables
- Inventory management
  - Current quantity per product
  - Manual stock-in entry
- Low-stock flags
- Payment status per order
  - Paid
  - Partial
  - Credit outstanding
- Retailer ledger
- Simple PDF receipt/invoice generation per order

#### Technical Tasks
1. Add inventory table and stock movement records.
2. Implement stock-in workflow and low-stock alerts.
3. Add payment status to orders.
4. Build retailer ledger aggregation logic.
5. Generate simple PDF documents for order receipts.

#### Exit Criteria Check
- The pilot user uses the ledger/payment data in a real credit decision.

---

### Phase 4 — Second Distributor
Duration: Weeks 10–14

#### Objective
Prove the product works for another real distributor, not just the pilot user.

#### Deliverables
- Multi-tenant data isolation
- Basic onboarding flow
- Clear pricing and commercial approach
- Minimal configuration for a second distributor

#### Technical Tasks
1. Introduce distributor/tenant model and data isolation.
2. Refactor auth and business logic to support multiple tenants.
3. Add onboarding and setup screens.
4. Decide pricing model and billing approach.
5. Document support and onboarding process.

#### Exit Criteria Check
- A second distributor uses the system for real orders and is willing to pay or commit.

---

### Phase 5 — Intelligence and Scale
Duration: Ongoing after proven demand

#### Objective
Add analytics and intelligent features only when real users request them.

#### Deliverables
- Basic analytics
- Reorder suggestions based on real usage patterns
- API/integration layer if needed

#### Technical Tasks
1. Add basic reporting dashboards.
2. Introduce analytics endpoints for sales trends and top products.
3. Only add AI or forecasting features when explicitly requested by paying users.

---

## 5. Recommended Implementation Sequence
### Sprint 1
- Project setup
- Authentication
- Database schema
- Product CRUD
- Retailer CRUD

### Sprint 2
- Order creation flow
- Order list view
- Basic status handling
- First user testing with the pilot customer

### Sprint 3
- Order history
- Edit/cancel
- Mobile-friendly improvements
- Usability fixes from real feedback

### Sprint 4
- Inventory + stock-in
- Payment status
- Ledger view
- PDF receipts

## 6. Definition of Done for the MVP
The MVP is ready when:
- A real distributor can log in and use the system independently.
- Orders can be created, viewed, and updated.
- The workflow is simple enough that the pilot user does not need hand-holding.
- The solution is stable enough for daily use.

## 7. Risks and Mitigations
- Risk: the workflow is too complex for the pilot user.
  - Mitigation: keep the first release minimal and test with real usage early.
- Risk: the system adds features before proving usefulness.
  - Mitigation: strictly follow the phase gates and exit criteria.
- Risk: mobile experience becomes a blocker later.
  - Mitigation: defer mobile optimization until evidence shows it is necessary.

## 8. Suggested Next Steps
1. Create the base backend and database schema.
2. Build the product and retailer management screens.
3. Implement the first order entry flow.
4. Test with the pilot user immediately and iterate based on real behavior.
