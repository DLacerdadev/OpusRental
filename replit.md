# Opus Rental Capital - Investment Management Platform

## Overview

Opus Rental Capital is an investment management platform for trailer-backed investments. It allows investors to purchase shares (cotas) backed by physical cargo trailers, offering transparency through real-time tracking, financial reporting, and compliance. Each share represents ownership of one trailer asset, with monthly returns distributed to investors. The platform supports investors, managers, and administrators with features like portfolio management, GPS asset tracking, financial analytics, and compliance. The project aims to capitalize on the growing asset-backed investment market by providing a secure and transparent platform for trailer investments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and Wouter for routing. State management and API caching are handled by React Query. UI components leverage shadcn/ui (built on Radix UI) and Tailwind CSS for styling, with a responsive, mobile-first design. Key features include a protected route system, Recharts for data visualization, Leaflet for GPS tracking maps, jsPDF for report generation, and form validation using React Hook Form with Zod. The application supports internationalization using `react-i18next` with comprehensive translation coverage across all major pages for English and Brazilian Portuguese.

### Backend Architecture

The backend is developed with Express.js and TypeScript on Node.js, following a RESTful API design. It uses PostgreSQL (NeonDB serverless) as the database with Drizzle ORM for type-safe operations. Authentication is session-based with `express-session` and `bcrypt` for password hashing. Authorization is policy-based with a centralized permission map and role-based access control (investor, manager, admin). Ownership validation ensures investors only access their resources. The system includes comprehensive audit logging, CSRF protection, rate limiting, and Helmet middleware for security.

### Data Architecture

Core database entities include Users, Trailers (with GPS, purchase, depreciation), Shares (linking users to trailers), Payments, Tracking Data, Documents, Audit Logs, and Financial Records. Key relationships include many-to-one between shares and trailers/users, allowing multiple shares per trailer. Each trailer can now have multiple shares (`totalShares` field), and its status changes to "active" only when all shares are sold.

### API Structure

The API includes authentication endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/user`), RESTful endpoints for CRUD operations on all entities, and aggregated endpoints for dashboard statistics and financial reporting.

### Security Implementation

Security is enforced through policy-based authorization (`server/policies.ts`) with dynamic route matching and context-aware pattern detection. An authorization middleware validates user roles and performs ownership checks. Session security uses HTTP-only cookies, session regeneration on login, and secure storage. CSRF protection, rate limiting, and Helmet middleware enhance security. Extensive audit logging captures access attempts and violations.

### Financial Engine

An idempotent payment service (`server/services/finance.service.ts`) automatically generates 2% monthly returns for active shares, preventing duplicates via database constraints. Administrative endpoints allow manual payment generation (`POST /api/financial/generate/:month`) and retrieval of historical financial data (`GET /api/financial/records`). An automated cron job runs monthly to generate payments. Database optimizations include unique and performance indexes for `payments` and `financial_records`.

## External Dependencies

- **Database Service**: Neon Serverless PostgreSQL
- **Frontend Libraries**: React, Wouter, React Query, Recharts, Leaflet, date-fns, jsPDF, Radix UI, Tailwind CSS, Lucide React, react-i18next
- **Form & Validation**: React Hook Form, Zod, @hookform/resolvers
- **Backend Libraries**: Express.js, Drizzle ORM, bcrypt, express-session, node-cron
- **Development Tools**: TypeScript, Vite, ESBuild

## Development Credentials

**⚠️ FOR DEVELOPMENT ENVIRONMENT ONLY - NEVER USE IN PRODUCTION**

The database has been populated with test data. Use these credentials to log in:

### Manager Account (Full Access)
- **Email:** manager@example.com
- **Password:** manager123
- **Role:** manager
- **Username:** manager1
- **Permissions:** Full platform access, can manage trailers, investors, financial records, etc.

### Investor Accounts (Portfolio View Only)
- **Account 1:**
  - Email: investor@example.com
  - Password: investor123
  - Role: investor
  - Username: investor1
  - Shares: 4 active shares (TR001, TR002, TR003, TRuxPq)

- **Account 2:**
  - Email: investor2@example.com
  - Password: investor123
  - Role: investor
  - Username: investor2
  - Shares: None

### Test Data Summary
- **Users:** 3 (1 manager, 2 investors)
- **Trailers:** 10 assets in fleet
- **Shares:** 4 active shares (all owned by investor1)
- **Payments:** 12 payment records
- **Audit Logs:** 141 activity records

### Password Reset
To reset development passwords, run:
```bash
tsx scripts/reset-dev-passwords.ts
```

## Recent Changes

### Broker Dispatch System - COMPLETE (November 6, 2025)

Implemented comprehensive broker dispatch management system for freight broker operations:

**Backend Implementation (5 endpoints):**
- `GET /api/broker-dispatches` - List all dispatches (manager-only)
- `GET /api/broker-dispatches/:id` - Get dispatch details with 404 handling
- `GET /api/broker-dispatches/trailer/:trailerId` - Get dispatch history by trailer
- `POST /api/broker-dispatches` - Create dispatch with auto-generated number (DISPATCH-001, DISPATCH-002...)
- `PUT /api/broker-dispatches/:id` - Update dispatch with audit logging

**Frontend Implementation (882 lines, 82 data-testids):**
- Complete `/broker` page with 4 stats cards (Total, Pending, In Transit, Delivered)
- Responsive table with status badges and load type display
- Create dialog with 11 form fields (trailer selection, broker info, pickup/delivery locations and dates, load type, instructions)
- Edit dialog with same fields pre-populated
- Form validation using Zod + React Hook Form with fully translated error messages
- Query/mutation management with React Query + cache invalidation
- Mobile-responsive design (1-col mobile → 2-col tablet → 3-col desktop)

**Internationalization:**
- Full EN/PT-BR support with 77 new translation keys
- Translated validation messages using `getBrokerDispatchFormSchema(t)` pattern
- All UI text, form labels, errors, and status messages fully translated

**Business Logic:**
- Auto-generated sequential dispatch numbers
- Status workflow: pending → dispatched → in_transit → delivered → cancelled
- Load types: full_load, partial_load, empty
- Broker contact information (name, email, phone)
- Pickup and delivery tracking with dates
- Special instructions and notes fields
- Complete audit logging of all operations

**Testing:**
- 82 unique data-testid attributes for E2E testing
- Pattern: `{action}-{target}` for interactive elements, `{type}-{content}` for display
- Dynamic IDs for list items: `{type}-{description}-{id}`

### Asset Allocation System (November 2025)

Implemented comprehensive asset allocation functionality allowing managers to assign trailers to specific investors or open quotation for all:

**Backend Features:**
- New endpoint `/api/investors` to list all investors (manager/admin only)
- Modified trailer creation to support allocation types:
  - **Open Quotation**: Asset available for all investors to purchase
  - **Specific Investor**: Asset automatically assigned to selected investor
- Automatic share creation when asset is allocated to specific investor
- Trailer status automatically changes to "active" when share is created
- Audit logging includes allocation details

**Frontend Features:**
- Dynamic allocation type selector with visual hints
- Conditional investor dropdown (shows only when "Specific Investor" selected)
- Investor list displays full name and email for easy identification
- Real-time form validation and error handling
- Full internationalization support (EN/PT-BR)

**Business Logic:**
- When allocation type is "specific" + investor selected → share created automatically
- When allocation type is "open" → asset stays in stock status for manual allocation later
- Share creation includes 2% monthly return and active status
- Purchase value and date inherited from trailer

### Automatic Trailer ID Generation (November 2025)

Implemented intelligent sequential ID generation system by trailer type:
- **TRS001, TRS002...** for Seco (Dry Van)
- **TRC001, TRC002...** for Climatizado (Refrigerated)
- **TRL001, TRL002...** for Lonado (Flatbed)
- Each type maintains independent sequential numbering
- IDs auto-generated on backend, eliminating manual entry errors
- User-friendly hint in creation form explaining ID pattern

### Table Column Enhancement (November 2025)

Added "Tipo" (Type) column to Assets Management table:
- Visual badge display for trailer types
- Positioned between ID and Model columns
- Fully translated (Seco/Dry Van, Climatizado/Refrigerated, Lonado/Flatbed)
- Consistent with existing badge design system

### Mobile Responsiveness + Dark Mode Fix (October 2025)

Completed comprehensive mobile-first responsive redesign across all 9 platform pages with full dark mode support:

**Responsive Design:**
- Mobile (1-col) → Tablet (2-col) → Desktop (3-4 col) adaptive grids
- Responsive padding pattern: p-3 → sm:p-4 → md:p-6 → lg:p-8
- Touch-optimized with 44px minimum targets on all interactive elements
- Dialogs/modals scale from 95vw (mobile) to max-w-4xl (desktop)

**Navigation:**
- Hamburger menu with Sheet drawer on mobile (< 1024px breakpoint)
- Drawer auto-closes on page navigation
- Sidebar always expanded within drawer for better UX

**Dark Mode:**
- Implemented `useTheme` hook with localStorage persistence
- Added dark variants to all hard-coded colors (green-600 → dark:green-400)
- Proper contrast ratios for accessibility
- Automatic system theme detection

**Bug Fixes:**
- Fixed z-index issue where Leaflet map overlapped Sheet drawer on mobile tracking page
- Added CSS rules to prevent map controls from interfering with modals (z-index: 1 for panes, 10 for controls)

### Professional Landing Page with Full Internationalization (October 2025)

Created a sophisticated, security-focused landing page with complete translation support (EN/PT):

**Premium Navigation Bar:**
- **Top Trust Bar**: SEC Registered, Bank-Level Security, FDIC Insured badges
- **Main Navigation**: Professional branding with company logo, "Investment Grade Asset Management" tagline
- **Clean CTAs**: "Client Portal" and "Open Account" with premium styling
- **Utilities**: Theme toggle (dark/light) and language switcher (EN/PT)

**Hero Section - Professional Style:**
- **Trust Badge**: "SEC-Registered • FINRA Member • FDIC Insured"
- **Headline**: "Professional-Grade Asset Management" (EN) / "Gestão de Ativos Nível Profissional" (PT)
- **Value Proposition**: Bank-level security, 2% monthly returns, complete transparency
- **Professional CTAs**: "Open Your Account" and "Existing Client Login"
- **Certification Bar**: SEC Registered, FINRA Member, FDIC Insured, SOC 2 Type II

**Stats Showcase (4 Metrics):**
- $50M+ Assets Under Management
- 2,500+ Active Trailers
- 99.9% Uptime Guaranteed
- 5,000+ Professional & Retail Investors

**Bank-Level Security Section (6 Features):**
- End-to-End Encryption (AES-256, Military-grade)
- Multi-Factor Authentication (2FA with biometrics)
- Redundant Infrastructure (99.9% SLA)
- Regulatory Compliance (SEC Compliant)
- Security Operations Center (SOC 2 Type II, 24/7)
- Insured Custody (FDIC Insured + $250M coverage)

**Investment Performance (4 Features):**
- Consistent Returns (2% monthly)
- Tangible Assets ($50M+ in trailers)
- GPS Tracking (24/7 real-time tracking)
- Total Transparency (100% visibility)

**Premium CTA Section:**
- Gradient blue background (professional fintech style)
- "Ready to Start Investing?" headline
- Trust indicators: FDIC Insured, 256-bit Encryption, SEC Registered, SOC 2 Certified

**Professional Footer:**
- Company branding with logo
- Legal, Company, Support sections
- Member FINRA/SIPC, FDIC Insured disclaimers

**Design Characteristics:**
- **US fintech aesthetic** (Robinhood, Fidelity, Chase): Clean, professional, trustworthy - NOT investment bank style
- **Security-first messaging**: Emphasizes bank-level protection throughout
- **Professional color palette**: Navy primary, blue accent with professional gradients
- **Premium animations**: Subtle, professional hover effects with Framer Motion
- **Full dark mode support**: Professional dark theme
- **Mobile-first responsive**: All sections adapt perfectly across devices
- **Trust signals everywhere**: Certifications, badges, security features prominently displayed
- **Complete i18n support**: All 814 lines fully translated (EN/PT) using react-i18next

**Translation System:**
- All landing page content in `client/src/locales/en-US.json` and `pt-BR.json`
- Dynamic language switching via top navigation button
- No hardcoded text - all uses `t('landing.section.key')`
- Professional terminology (NOT "institutional") - uses "professional-grade", "professional-level"

**Route Structure:**
- `/` - Public professional landing page (new homepage)
- `/login` - Client login page
- `/register` - Account opening page
- `/dashboard` - Protected client dashboard (previously `/`)

### Invoice Automation System - COMPLETE (November 7, 2025)

Implemented comprehensive automated invoice generation and payment reminder system with professional email delivery:

**EmailService (server/services/email.service.ts):**
- **Production SMTP**: Real email delivery via nodemailer with environment-based configuration
- **Development Mock**: Console logging for testing without sending real emails
- **Connection Management**: Cached SMTP transporter with connection verification
- **Professional Templates**: HTML/text email templates for invoices and payment reminders
- **Error Handling**: Proper error propagation with detailed logging

**InvoiceAutomationService (server/services/invoice-automation.service.ts):**
- **Monthly Generation**: Auto-generates invoices on 1st of month at 00:01 (cron: `1 0 1 * *`)
- **Overdue Checks**: Daily checks at 09:00 for overdue invoices (cron: `0 9 * * *`)
- **Payment Reminders**: Sends reminders every 7 days for overdue invoices
- **Due Date Reminders**: Notifies clients 3 days before due date
- **Email Logging**: Complete audit trail of all email attempts (sent/failed with error details)
- **Resilient Processing**: Continues workflow even if individual emails fail

**Frontend Dashboard (client/src/pages/invoice-automation.tsx):**
- **Email Logs Table**: Searchable history of all email deliveries with status, timestamps, and error messages
- **Manual Triggers**: Buttons to manually run monthly generation or overdue checks
- **Stats Cards**: Real-time automation statistics (total sent, failed, success rate)
- **Email Type Filtering**: Filter logs by type (invoice, payment_reminder, due_reminder)
- **Status Badges**: Visual indicators for sent/failed status
- **Mobile Responsive**: Fully responsive design with proper table overflow handling

**API Endpoints:**
- `GET /api/email-logs` - Retrieve complete email log history
- `POST /api/invoices/generate-monthly` - Manually trigger monthly invoice generation
- `POST /api/invoices/check-overdue` - Manually trigger overdue invoice check

**Database Schema:**
- `emailLogs` table - Complete audit trail (recipient, subject, type, status, error, timestamp)
- `emailSettings` table - Future configuration storage
- `rentalContracts.autoGenerateInvoices` - Toggle automatic invoice generation per contract

**Production SMTP Configuration:**

Required environment variables for production email delivery:
```bash
SMTP_HOST=smtp.example.com          # SMTP server hostname
SMTP_PORT=587                        # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@example.com    # SMTP username
SMTP_PASS=your-smtp-password        # SMTP password
SMTP_FROM=noreply@opusrentalcapital.com  # From address
NODE_ENV=production                  # Enables real SMTP (defaults to mock in development)
```

**Email Modes:**
- **Development** (`NODE_ENV !== "production"`): Mock mode logs to console, no real emails sent
- **Production** (`NODE_ENV === "production"`): Real SMTP delivery with validation and error handling

**Security:**
- SMTP credentials only from environment variables (never hardcoded)
- No credential exposure in logs or error messages
- Graceful degradation if SMTP not configured
- Connection verification on initialization

**Cron Schedule:**
- **Monthly Generation**: 1st of month at 00:01 - Generates invoices for all active contracts with auto-generation enabled
- **Overdue Checks**: Daily at 09:00 - Updates invoice status and sends reminders (every 7 days)
- **Due Reminders**: Daily at 09:00 - Sends friendly reminders 3 days before due date

**Testing & Monitoring:**
- Email logs table provides complete visibility into delivery status
- Manual triggers allow testing automation without waiting for cron schedule
- Error messages captured and logged for troubleshooting
- Development mock mode enables safe testing without sending real emails

### Advanced Dashboard Analytics - COMPLETE (November 7, 2025)

Implemented comprehensive analytics system with configurable timeframes and professional data visualizations:

**Backend Analytics Endpoints (server/storage.ts):**
1. **Revenue Trend** (`getRevenueTrend`) - Line 605-649:
   - Bulk fetches payments and invoices to avoid N+1 queries
   - Groups data by month with revenue and payment counts
   - Returns chronologically sorted results
   - Accepts configurable timeframe parameter (months)

2. **Trailer ROI Analysis** (`getTrailerROI`) - Line 651-707:
   - Bulk fetches all data (trailers, contracts, shares, payments) in 4 queries
   - Calculates ROI respecting contract lifecycle (skips pending, uses end dates for terminated)
   - Returns results sorted by ROI descending for accurate "top performer" display
   - Includes revenue, investor payouts, net profit per trailer

3. **Performance Comparison** (`getPerformanceComparison`) - Line 711-766:
   - Aggregates trailers by type (Seco, Climatizado, Lonado)
   - Calculates average ROI and total revenue per type
   - Respects contract status and end dates in calculations

4. **Revenue Forecast** (`getRevenueForecast`) - Line 768-810:
   - Generates 6-month forward-looking projections
   - Uses historical averages with declining confidence over time
   - Provides forecast basis for transparency

**Frontend Dashboard (client/src/pages/analytics.tsx):**
- **4 Analytics Tabs**:
  - Revenue Trend: Area chart with timeframe selector (3/6/12 months)
  - Trailer ROI: Bar chart with top performer card highlight
  - Performance Comparison: Radar chart comparing trailer types
  - Revenue Forecast: Line chart with projected vs actual revenue
- **Professional Recharts visualizations** with responsive design
- **Query parameter integration**: Timeframe selections sent as `?months=${value}`
- **Loading states**: Skeleton loaders during data fetch
- **Mobile responsive**: Adapts from 1-col to 2-col layouts

**Performance Optimizations:**
- **Bulk Query Strategy**: 4 database queries total instead of O(N) per trailer
- **In-Memory Filtering**: All aggregations done in application layer after bulk fetch
- **No N+1 Patterns**: Direct `db.select().from(trailers)` instead of `getAllTrailers()` to avoid nested share queries
- **Efficient Sorting**: ROI results sorted once before return (line 706)

**Internationalization:**
- Full EN/PT-BR support for all analytics labels, tooltips, and messages
- Translated chart axes, legends, and data labels

**API Endpoints:**
- `GET /api/analytics/revenue-trend?months=6` - Revenue trend with configurable timeframe
- `GET /api/analytics/trailer-roi?months=12` - ROI analysis sorted by performance
- `GET /api/analytics/performance-comparison` - Type-based aggregation
- `GET /api/analytics/revenue-forecast?months=6` - Forward-looking projections

### Stripe Payment Integration - COMPLETE (November 7, 2025)

Implemented comprehensive payment processing system using Stripe for share purchases and invoice payments:

**Stripe Integration Setup:**
- **API Version**: 2025-10-29.clover (latest)
- **Environment Variables**:
  - `STRIPE_SECRET_KEY` - Server-side secret key (required)
  - `VITE_STRIPE_PUBLIC_KEY` - Frontend publishable key (required)
  - `STRIPE_WEBHOOK_SECRET` - Webhook signature verification (optional for dev)
- **Package**: Stripe Node SDK v17+ with full TypeScript support

**Backend Payment Endpoints (server/routes.ts):**

1. **Share Purchase** (`POST /api/stripe/create-share-payment`):
   - Fixed amount: $28,000 per share (2,800,000 cents)
   - Validates share availability before payment intent creation
   - Metadata includes: shareId, investorUserId, trailerId, type: "share_purchase"
   - Audit logging with payment intent ID tracking

2. **Invoice Payment** (`POST /api/stripe/create-invoice-payment`):
   - Variable amount based on invoice.amount
   - Validates invoice exists and is not already paid
   - Metadata includes: invoiceId, contractId, type: "invoice_payment"
   - Returns invoice number for confirmation UI

3. **Webhook Handler** (`POST /api/stripe/webhook`):
   - Handles `payment_intent.succeeded` events
   - Signature verification using STRIPE_WEBHOOK_SECRET (optional in dev)
   - **Share Purchase Success**:
     - Updates share status to "sold"
     - Links share to investor (userId field)
     - Sets purchaseDate to payment timestamp
     - Creates financial record with $28,000 revenue
   - **Invoice Payment Success**:
     - Updates invoice status to "paid"
     - Sets paidDate to payment timestamp
     - No separate payment record (invoice status is source of truth)
   - Handles `payment_intent.payment_failed` with error logging

4. **Payment Status** (`GET /api/stripe/payment-status/:paymentIntentId`):
   - Retrieves current payment intent status from Stripe
   - Returns status, amount, currency, metadata
   - Used for real-time payment verification

**Frontend Checkout Pages:**

1. **Share Checkout** (`/checkout/share`):
   - Premium investment summary card with ROI breakdown
   - Displays: $28,000 price, $560/month return (2%), $6,720/year (24%)
   - Stripe Elements integration with PaymentElement
   - Query parameters: shareId, investorUserId, trailerId, trailerInfo
   - Return URL: `/shares` after successful payment
   - Professional loading states and error handling

2. **Invoice Checkout** (`/checkout/invoice`):
   - Professional invoice summary card
   - Displays: invoice number, amount due, due date, reference month
   - Stripe Elements integration with PaymentElement
   - Query parameter: invoiceId (fetches amount from backend)
   - Return URL: `/invoices` after successful payment
   - Responsive design with proper mobile formatting

**Stripe Elements Configuration:**
- Uses `@stripe/react-stripe-js` and `@stripe/stripe-js` packages
- Lazy loading of Stripe.js with `loadStripe()` outside component
- `<Elements>` wrapper with clientSecret options
- `<PaymentElement>` for payment method collection
- Built-in PCI compliance and card validation

**Security Features:**
- Client secrets expire after successful payment
- Payment intents created server-side only
- No sensitive data stored in frontend
- Webhook signature verification prevents spoofing
- Audit logging tracks all payment attempts
- Rate limiting on payment endpoints (100 req/15min)

**User Flow:**

1. **Share Purchase**:
   ```
   User selects share → Redirected to /checkout/share?shareId=X&investorUserId=Y
   → Backend creates $28,000 payment intent → User enters card details
   → Stripe processes payment → Webhook updates share status to "sold"
   → User redirected to /shares with success message
   ```

2. **Invoice Payment**:
   ```
   User clicks "Pay Invoice" → Redirected to /checkout/invoice?invoiceId=X
   → Backend creates payment intent with invoice.amount → User enters card details
   → Stripe processes payment → Webhook updates invoice status to "paid"
   → User redirected to /invoices with success message
   ```

**Financial Record Tracking:**
- Share purchases create financial records with:
  - month: Current month (YYYY-MM format)
  - totalRevenue: $28,000
  - investorPayouts: $0 (future monthly returns)
  - operationalCosts: $0
  - companyMargin: $28,000
- Invoice payments update invoice status only (no separate payment record)

**Error Handling:**
- Payment failures display Stripe error messages to user
- Backend errors return descriptive messages
- Missing shares/invoices return 404 with clear messages
- Invalid payment states (already paid, not available) return 400
- Webhook errors logged but don't disrupt user experience

**Testing Notes:**
- Development mode accepts webhooks without signature verification
- Production requires STRIPE_WEBHOOK_SECRET for security
- Use Stripe test cards for development testing
- Test mode keys (pk_test_, sk_test_) prevent real charges

**Integration Status:**
- ✅ Backend endpoints functional
- ✅ Webhook handler operational
- ✅ Frontend checkout pages created
- ✅ Routes registered in App.tsx
- ✅ Zero LSP errors
- ✅ Workflow running successfully
- ⚠️ Frontend integration with existing pages (Shares, Invoices) pending
- ⚠️ Webhook endpoint registration with Stripe dashboard required for production