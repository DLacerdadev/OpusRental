# Opus Rental Capital - Investment Management Platform

## Overview

Opus Rental Capital is an investment management platform designed for trailer-backed investments. It enables investors to purchase shares (cotas) in physical cargo trailers, providing transparency through real-time tracking, comprehensive financial reporting, and compliance. Each share represents ownership of a trailer asset, distributing monthly returns to investors. The platform supports investors, managers, and administrators with features like portfolio management, GPS asset tracking, financial analytics, and compliance, aiming to capitalize on the asset-backed investment market with a secure and transparent solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and Wouter for routing. State management and API caching are handled by React Query. UI components leverage shadcn/ui (Radix UI) and Tailwind CSS for a responsive, mobile-first design. Key features include a protected route system, Recharts for data visualization, Leaflet for GPS tracking maps, jsPDF for report generation, and form validation using React Hook Form with Zod. Internationalization is supported via `react-i18next` for English and Brazilian Portuguese.

### Backend Architecture

The backend utilizes Express.js and TypeScript on Node.js, implementing a RESTful API design. It uses PostgreSQL (NeonDB serverless) with Drizzle ORM for type-safe database operations. Authentication is session-based with `express-session` and `bcrypt` for password hashing. Authorization is policy-based with a centralized permission map and role-based access control (investor, manager, admin), including ownership validation. Security features include audit logging, CSRF protection, rate limiting, and Helmet middleware.

### Data Architecture

Core database entities include Users, Trailers (with GPS, purchase, depreciation), Shares (linking users to trailers, allowing multiple shares per trailer), Payments, Tracking Data, Documents, Audit Logs, and Financial Records. Trailer status becomes "active" once all its shares are sold.

### Security Implementation

Security is enforced through policy-based authorization with dynamic route matching and context-aware pattern detection. An authorization middleware validates user roles and performs ownership checks. Session security uses HTTP-only cookies and session regeneration. CSRF protection, rate limiting, and Helmet middleware enhance security. Extensive audit logging captures access attempts and violations. Multi-tenancy is implemented with secure data isolation, utilizing `tenantId` in all entities and a 4-tier detection priority for tenant context, preventing cross-tenant access via session-tenant validation.

### Financial Engine

An idempotent payment service automatically generates 2% monthly returns for active shares. Administrative endpoints allow manual payment generation and retrieval of historical financial data. An automated cron job runs monthly for payment generation. Unique and performance indexes are used for financial records. Invoice automation includes monthly generation, overdue checks, and payment reminders via a robust email service with production SMTP and development mock modes.

### Asset Management

The platform includes a comprehensive broker dispatch management system for freight operations, allowing managers to list, create, update, and track dispatches with status workflows and full internationalization. An asset allocation system enables managers to assign trailers to specific investors or make them available for open quotation. Automatic share creation occurs for specific investor allocations. Trailer IDs are auto-generated sequentially by trailer type (e.g., TRS001 for Seco).

### Dashboard Analytics

An advanced analytics system provides insights into revenue trends, trailer ROI, performance comparison by trailer type, and revenue forecasts. The backend utilizes bulk queries to optimize performance, and the frontend presents data with professional Recharts visualizations, offering configurable timeframes and full internationalization.

### Stripe Payment Integration

A comprehensive payment processing system integrates Stripe for share purchases and invoice payments. Backend endpoints handle payment intent creation, webhook processing (for `payment_intent.succeeded` and `payment_intent.failed` events), and payment status retrieval. Frontend checkout pages provide a premium user experience for share purchases ($28,000 per share) and invoice payments, with secure Stripe Elements integration, CSP configuration, and robust error handling. A System Integrations configuration UI allows managers to manage Stripe and SMTP settings.

## External Dependencies

- **Database Service**: Neon Serverless PostgreSQL
- **Frontend Libraries**: React, Wouter, React Query, Recharts, Leaflet, date-fns, jsPDF, Radix UI, Tailwind CSS, Lucide React, react-i18next, @stripe/react-stripe-js, @stripe/stripe-js
- **Form & Validation**: React Hook Form, Zod, @hookform/resolvers
- **Backend Libraries**: Express.js, Drizzle ORM, bcrypt, express-session, node-cron, nodemailer, stripe
- **Development Tools**: TypeScript, Vite, ESBuild

## WhatsApp Integration

Multi-provider WhatsApp notification system for investor and manager alerts. Events: `payment_generated`, `invoice_issued`, `invoice_overdue`, `maintenance_due`, `geofence_alert`.

Provider selection via `WHATSAPP_PROVIDER` environment variable:
- `mock` (default) — logs messages to console, no external calls required
- `twilio` — requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- `meta` — requires `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`

Retry policy: 3 retries after initial attempt (4 total), exponential backoff 1s / 2s / 4s. All sends are logged to the `whatsapp_logs` table with tenant isolation enforced. Test endpoint: `POST /api/whatsapp/test` (admin only). Logs endpoint: `GET /api/whatsapp/logs?limit=N&offset=M` (manager/admin).

## Pending Configuration

⚠️ **Stripe Integration**: Currently disabled for development. Will be configured when implementing checkout functionality. The code is prepared to work with or without Stripe credentials.