# Opus Rental Capital - Investment Management Platform

## Overview

Opus Rental Capital is a comprehensive investment management platform for trailer-backed investments. The system enables investors to purchase shares (cotas) backed by physical cargo trailers, providing transparency through real-time tracking, financial reporting, and compliance documentation. Each share represents ownership of one complete trailer asset, with monthly returns calculated and distributed to investors.

The platform serves multiple user roles including investors, managers, and administrators, offering portfolio management, asset tracking via GPS, financial analytics, and comprehensive compliance features.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

### Internationalization Implementation (October 2025)
- **i18n Pages Converted**: Implemented useTranslation hook in all main pages
  - Reports page: All hardcoded text converted to translation keys
  - Investor Shares page: Complete translation support for table headers, status badges, and messages
  - Approvals page: Translated pending requests, buttons, and statistics
  - Settings page: Full i18n for user profile, notifications, security, and preferences sections
  - Assets page: Complete translation including dialogs, forms, table headers, status badges, and export functionality
  - Tracking page: GPS tracking interface with map, status indicators, and location details fully translated
  - Financial page: Complete financial dashboard with cards, charts, and cash flow section translated
  
- **Translation Files Updated**:
  - `pt-BR.json`: Added comprehensive translations for all pages (reports, investorShares, approvals, settings, assets, tracking, financial)
  - `en-US.json`: Parallel English translations for all sections
  - Translation structure follows pattern: `t('section.key')` for organized namespace
  
- **Translation Coverage**:
  - Reports: 16 keys (titles, descriptions, export messages)
  - InvestorShares: 17 keys (stats, table headers, status labels, search)
  - Approvals: 11 keys (workflow stages, actions, statistics)
  - Settings: 21 keys (profile, notifications, security, preferences, dark mode)
  - Assets: 57 keys (page title, forms, dialogs, table headers, status translations, export, toast messages)
  - Tracking: 10 keys (title, subtitle, buttons, status labels, table headers)
  - Financial: 14 keys (title, cards, chart titles, cash flow items)
  - **Total: 146 translation keys** across 7 pages in both languages

### Trailer Model Field (October 2025)
- **Model Field Added**: Each trailer now has a required model field
  - Added `model` text field to trailers table with default "Dry Van 53ft"
  - Field appears in trailer creation form after ID field
  - Existing trailers populated with default model value
  - Model examples: "Dry Van 53ft", "Refrigerado 48ft", "Flatbed 53ft"

### Multi-Share System Implementation
- **Trailer Multi-Share Support**: Each trailer can now have multiple shares (cotas)
  - Added `totalShares` field to trailers table (integer, default: 1)
  - Existing trailers without specification default to 1 share
  - Trailer status changes to "active" only when ALL shares are sold
  - Share availability calculated as: totalShares - soldShares
  
- **Purchase Validation**:
  - Removed restriction of "one share per trailer"
  - Validates available shares count before purchase (availableShares > 0)
  - Returns error if no shares are available for a trailer
  - Multiple investors can purchase shares of the same trailer
  
- **Backend Implementation**:
  - `getAvailableTrailers()` enhanced to return share availability data
  - Calculates soldShares and availableShares for each trailer
  - Filters to show only trailers with available shares > 0
  - Purchase route checks totalShares vs sold count
  
- **Frontend Display**:
  - Shows "X cotas disponíveis" badge on available trailers
  - Displays total shares info when > 1
  - Responsive design with proper text wrapping and overflow handling

### Role-Based Dashboard Implementation
- **Manager Dashboard**: Displays company-wide statistics and business overview
  - Total fleet value and trailer count (active/total)
  - Total shares sold across all investors
  - Company revenue and margin (last 6 months aggregated)
  - Revenue performance chart (company-wide)
  - Recent system activity (all payments processed)
  - No personal portfolio or "Minha Carteira" tab (managers don't own shares)
  
- **Investor Dashboard**: Shows personal investment portfolio
  - Personal wallet total value
  - Active shares count
  - Monthly return and next payment projection
  - Personal performance chart (last 6 months)
  - Recent payment activity
  - Status of owned assets

- **Backend Implementation**: 
  - `getCompanyStats()` method in storage for manager/admin statistics
  - `getDashboardStats(userId)` method for investor personal statistics
  - Route logic checks user role and calls appropriate method
  
- **Frontend Implementation**:
  - Conditional rendering based on `user.role` 
  - Manager/Admin see company-wide view with business metrics
  - Investors see personal portfolio view
  - "Minha Carteira" tab removed from manager navigation (frontend + backend policies)

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Query (@tanstack/react-query) for server state management and API caching

**UI Component Library**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Responsive design with mobile-first approach

**Key Frontend Features**
- Protected route system with authentication middleware
- Dashboard with performance charts using Recharts
- Interactive maps using Leaflet for GPS tracking
- Export functionality (PDF/CSV) for reports using jsPDF
- Form validation using React Hook Form with Zod schemas

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Session-based authentication using express-session
- RESTful API design pattern
- Middleware chain for logging, JSON parsing, and authentication

**Database & ORM**
- PostgreSQL database (NeonDB serverless)
- Drizzle ORM for type-safe database operations
- WebSocket connection pool for serverless compatibility
- Schema-first design with TypeScript types generated from Drizzle schema

**Authentication & Security**
- bcrypt for password hashing
- Session-based authentication with HTTP-only cookies
- Policy-based authorization with centralized permission map (server/policies.ts)
- Role-based access control (investor, manager, admin)
- Ownership validation for investor resources (shares, payments)
- CSRF protection via secure sessions
- Rate limiting on authentication and admin endpoints
- Helmet middleware with CSP headers for production
- Session regeneration on login (anti-fixation)
- Comprehensive audit logging (401/403 attempts, ownership violations)
- Secure session storage with configurable secrets

### Data Architecture

**Core Database Entities**
- **Users**: Authentication and profile information with role-based permissions
- **Trailers**: Asset registry with GPS coordinates, purchase values, depreciation tracking
- **Shares**: Investment ownership linking users to specific trailer assets
- **Payments**: Monthly return distribution records
- **Tracking Data**: Real-time GPS location history
- **Documents**: Compliance documentation storage with version control
- **Audit Logs**: System activity tracking for compliance
- **Financial Records**: Aggregated monthly financial performance data

**Key Relationships**
- Many-to-one mapping between shares and trailers (multiple shares can reference one trailer)
- Many-to-one relationship between shares and users (investor portfolios)
- Each trailer can have N shares (defined by totalShares field, default: 1)
- Historical tracking of payments, locations, and audit events

### API Structure

**Authentication Endpoints**
- POST /api/auth/login - User authentication
- POST /api/auth/logout - Session termination
- GET /api/auth/user - Current user session retrieval

**Data Access Patterns**
- RESTful endpoints for CRUD operations on all entities
- Aggregated dashboard statistics endpoints
- Portfolio summaries with calculated projections
- Financial reporting with monthly rollups

### External Dependencies

**Database Service**
- Neon Serverless PostgreSQL for managed database hosting
- WebSocket-based connection pooling for serverless environments

**Development Tools**
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime error modal)
- TypeScript for end-to-end type safety
- ESBuild for production bundling

**Frontend Libraries**
- Recharts for data visualization (line charts, bar charts)
- Leaflet for interactive mapping
- date-fns for date formatting and calculations
- jsPDF with autoTable for PDF report generation

**UI Dependencies**
- Radix UI component primitives (40+ components)
- Tailwind CSS with PostCSS for styling
- Lucide React for iconography

**Form & Validation**
- React Hook Form for form state management
- Zod for runtime schema validation
- @hookform/resolvers for integration

## Security Implementation

### Policy-Based Authorization (October 2025)

**Centralized Permission Map** (`server/policies.ts`)
- All routes defined in single Policy object with allowed roles
- Dynamic route matching with pattern normalization (/:id, /:shareId, /:trailerId)
- Context-aware pattern detection (e.g., /api/payments/{uuid} → /:shareId)

**Authorization Middleware** (`server/middleware/auth.ts`)
- `authorize()`: Validates user role against Policy map for each route
- `checkOwnership()`: Ensures investors can only access their own resources
- `logAccess()`: Comprehensive logging of all API access (user, role, path, method, status)

**Ownership Validation**
- Investor resources: shares, payments require ownership check
- Manager/admin: bypass ownership checks (full access)
- Returns 403 with audit log on ownership violation
- Validates share.userId === req.session.user.id for investor role

**Session Security**
- Stores complete user object: {id, email, role}
- Never trusts client-side role information
- Session regeneration on login (prevents fixation attacks)
- Secure cookies: httpOnly, sameSite: 'lax', secure: true in production

**CSRF & Rate Limiting**
- CSRF protection via secure session validation
- Rate limiters: 5 req/15min on login, 100 req/15min on admin routes
- Helmet middleware with CSP headers for production hardening

**Audit Logging**
- Logs all 401/403 attempts with IP, user, role, path, method
- Special action types: "access_denied", "ownership_violation"
- Anonymous user audit logs (userId: null) for failed auth attempts

**Frontend Protection**
- ProtectedRoute component with role-based guards
- Centralized 403 handling in queryClient with toast notifications
- Automatic redirect to login on 401 responses

### Testing Coverage
- ✅ E2E: 401 unauthorized access
- ✅ E2E: 403 insufficient permissions (role-based)
- ✅ E2E: Cross-user ownership validation
- ✅ CSRF protection on mutations

## Financial Engine (October 2025)

### Automated Payment Generation

**Idempotent Payment Service** (`server/services/finance.service.ts`)
- Generates 2% monthly returns for all active shares
- Database-level idempotency using `ON CONFLICT DO NOTHING`
- Unique constraint on `(share_id, reference_month)` prevents duplicates
- Consolidates monthly financial records with upsert pattern

**Administrative Endpoints**
- `POST /api/financial/generate/:month` - Manual payment generation (manager/admin)
  - Month as URL path parameter (format: YYYY-MM)
  - Protected with authorize() middleware
  - Returns: {success, message, data: {sharesProcessed, investorPayouts, totalRevenue}}
- `GET /api/financial/records` - Historical financial data (manager/admin)
  - Returns last 12 months ordered by month DESC
  - Optimized with direct SQL: `orderBy(sql\`month desc\`).limit(12)`

**Automated Scheduler** (`server/scheduler.ts`)
- Cron job runs on 1st of each month at 06:00 UTC
- Auto-generates payments for current month using node-cron
- Schedule pattern: `"0 6 1 * *"` (minute 0, hour 6, day 1)
- Initialized on server startup via `server/index.ts`
- Logs execution results to console for monitoring

**Database Optimizations**
- Unique index: `payments (share_id, reference_month)` for idempotency
- Performance index: `payments (user_id, reference_month)` for queries
- Unique constraint: `financial_records (month)` for consolidation
- Date format standardized: ISO 8601 YYYY-MM (e.g., "2025-10")

**Policy Updates**
- Pattern matching for `:month` parameter in URL paths
- Month pattern: `/\d{4}-\d{2}/` for YYYY-MM format
- Authorization check before payment generation