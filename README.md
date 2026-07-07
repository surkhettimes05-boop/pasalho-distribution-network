# Pasalho Distribution Network (DNP)

Pasalho DNP is a high-performance Progressive Web App (PWA) built to enable field sales representatives to capture orders from retailers. It features a robust offline-first architecture, background syncing, role-based access control, and a sleek mobile-friendly UI.

## Features
- **Offline First**: PWA with IndexedDB and Background Sync API ensures orders can be placed even without network connectivity.
- **Role-Based Access Control**: Strict access boundaries separating `admin` and `rep` roles.
- **Optimized Reporting**: Fast analytics powered by PostgreSQL Materialized Views and background concurrent refreshes.
- **Production Ready**: Integrated CI/CD workflows, structured logging, secure headers, and automated DB backups to Google Drive.

## Tech Stack
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Offline Engine**: Service Worker + IndexedDB + Background Sync API
- **Monitoring**: Custom Structured Logger (`lib/monitoring.ts`)
- **Hosting**: Vercel (Web), Heroku/Railway (Database)

## Quick Start (Local Development)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/pasalho"
   JWT_SECRET="your_development_secret"
   ```

3. **Initialize Database**
   Apply Prisma migrations and generate the client:
   ```bash
   npx prisma generate
   # Note: Prisma migrate should be used for future schema updates
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Deployment to Vercel

This project is fully configured for seamless deployment on Vercel.

1. Connect your GitHub repository to Vercel.
2. In the Vercel project settings, add the required Environment Variables (`DATABASE_URL`, `JWT_SECRET`, etc.).
3. Vercel will automatically build the project using the standard Next.js build command (`npm run build`).
4. The `.github/workflows/ci.yml` pipeline will run TypeScript checks and build validations on every Pull Request before allowing merges.

## Runbooks & Operations

For disaster recovery, database restorations, and backup configurations, please refer to:
- [Disaster Recovery Runbook](docs/RUNBOOK.md)

## License
Proprietary - All rights reserved.
