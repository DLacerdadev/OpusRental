# Opus Rental Capital - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Project Type:** Investment Management Platform  
**Market:** US Cargo Trailer Investments

---

## Table of Contents

1. [Overview & Purpose](#1-overview--purpose)
2. [Technical Architecture](#2-technical-architecture)
3. [Key Features by Module](#3-key-features-by-module)
4. [Data Model](#4-data-model)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Finance System](#6-finance-system)
7. [Internationalization & Currency](#7-internationalization--currency)
8. [User Flows by Role](#8-user-flows-by-role)
9. [Integrations & External APIs](#9-integrations--external-apis)
10. [Setup & Deploy](#10-setup--deploy)

---

## 1. Overview & Purpose

### Business Context

Opus Rental Capital is a comprehensive investment management platform that enables investors to purchase shares (cotas) backed by physical cargo trailers operating in the US market. Each share represents fractional ownership of a trailer asset, generating passive income through automated monthly returns.

### Core Value Propositions

- **Asset-Backed Investments**: Every share is backed by a real, trackable cargo trailer with GPS monitoring
- **Automated Returns**: 2% monthly returns calculated and distributed automatically
- **Full Transparency**: Real-time asset tracking, financial reporting, and compliance documentation
- **Multi-Share Model**: Each trailer can be divided into multiple shares, enabling flexible investment sizes
- **Role-Based Access**: Tailored experiences for investors, managers, and administrators

### System Roles

| Role | Description | Primary Use Cases |
|------|-------------|-------------------|
| **Investor** | End users who purchase shares | View portfolio, track returns, purchase shares, access documents |
| **Manager** | Operations team managing the business | Oversee fleet, generate financial reports, manage assets |
| **Admin** | System administrators | Full access to all features, user management, system configuration |

### Test Credentials

```
Manager Account:
- Email: manager@example.com
- Password: password123

Investor Account:
- Email: investor@example.com
- Password: password123
```

---

## 2. Technical Architecture

### Technology Stack

**Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR, optimized bundling)
- **Routing**: Wouter (lightweight, 1.2KB)
- **State Management**: TanStack Query v5 (server state)
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Maps**: Leaflet + React Leaflet
- **i18n**: i18next + react-i18next

**Backend**
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM with WebSocket connection pooling
- **Authentication**: Session-based with bcrypt hashing
- **Validation**: Zod schemas
- **Scheduling**: node-cron for automated tasks
- **Security**: Helmet (CSP), CSRF protection, rate limiting

**Development & Deployment**
- **Runtime**: Node.js 20
- **Package Manager**: npm
- **Dev Environment**: Replit (live reload, hot restart)
- **Database Hosting**: Neon (serverless PostgreSQL)

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Portfolio │  │ Assets   │  │ Tracking │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                         │                                     │
│                    TanStack Query                            │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────┼─────────────────────────────────────┐
│                    Express Server                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Auth     │  │  Finance   │  │  Storage   │            │
│  │Middleware  │  │  Service   │  │  Interface │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │              │              │                      │
│         └──────────────┴──────────────┘                      │
│                         │                                     │
│                    Drizzle ORM                               │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │ WebSocket Pool
┌─────────────────────────┼─────────────────────────────────────┐
│                  PostgreSQL (Neon)                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Users  │ │Trailers│ │ Shares │ │Payments│ │ Audit  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request**: User interacts with React components
2. **TanStack Query**: Manages caching, loading states, and API calls
3. **Express Middleware**: Authentication → Authorization → Rate Limiting
4. **Route Handler**: Thin controllers validate input with Zod
5. **Storage Layer**: Business logic and database operations via Drizzle
6. **Database**: PostgreSQL queries via WebSocket connection
7. **Response**: JSON data flows back through the chain
8. **UI Update**: React Query updates components reactively

### Development & Production Serving

- **Development**: Vite dev server (port 5000) with Express backend
- **Production**: Express serves static Vite build from `dist/`
- **Single Port**: Frontend and backend on same port (no CORS issues)
- **Hot Reload**: Automatic workflow restart on file changes

---

## 3. Key Features by Module

### 3.1 Dashboard

**Purpose**: Role-specific overview of key metrics and activities

**Manager/Admin View**:
- Company-wide fleet statistics
- Total fleet value and active trailers
- Revenue and margin trends (6-month chart)
- Recent system activity

**Investor View**:
- Personal portfolio value
- Active shares count
- Monthly returns and projections
- Personal performance chart
- Recent payment history

**API Endpoints**:
- `GET /api/dashboard/stats` - Returns role-based statistics

### 3.2 Portfolio (Investor Only)

**Purpose**: Investor's personal investment dashboard

**Features**:
- Total portfolio value calculation
- Active shares count
- Lifetime returns summary
- Individual share performance cards
- Monthly return tracking

**API Endpoints**:
- `GET /api/portfolio` - Personal portfolio summary
- `GET /api/shares` - User's shares list

### 3.3 Assets (Trailers)

**Purpose**: Fleet management for managers/admins, available trailers for investors

**Manager/Admin Features**:
- Complete fleet overview table
- Add new trailers to inventory
- Edit trailer details (model, value, depreciation)
- Track trailer status (stock, active, maintenance, expired)
- View purchase value vs current value
- Export data (PDF, Excel, CSV)

**Investor Features**:
- Browse available trailers for purchase
- View trailer specifications and location
- See available shares per trailer
- Purchase shares

**Multi-Share Support**:
- Each trailer has `totalShares` field (default: 1)
- Multiple investors can own shares of same trailer
- Trailer becomes "active" when ALL shares are sold
- Share availability shown as badge

**API Endpoints**:
- `GET /api/trailers` - All trailers (manager/admin)
- `GET /api/trailers/available` - Trailers with available shares
- `POST /api/trailers` - Create new trailer
- `POST /api/shares` - Purchase share

### 3.4 Tracking

**Purpose**: Real-time GPS monitoring of trailer fleet

**Features**:
- Interactive Leaflet map with marker clustering
- Live status indicators (moving/stopped)
- Recent activity feed
- Location details table with coordinates
- Speed and distance tracking
- Last update timestamps

**API Endpoints**:
- `GET /api/tracking` - Current tracking data for all trailers
- `GET /api/tracking/:trailerId/history` - Historical tracking

**Technical Notes**:
- Map invalidation fix for Leaflet `_leaflet_pos` error
- Auto-fit bounds based on marker positions
- OpenStreetMap tiles for base layer

### 3.5 Financial

**Purpose**: Monthly financial reporting and payment management

**Manager/Admin Features**:
- Current month summary card
- Revenue trend chart (12 months)
- Cash flow breakdown (revenue, payouts, margin)
- Manual payment generation for specific months
- Financial records history

**API Endpoints**:
- `GET /api/financial/current` - Current month summary
- `GET /api/financial/records` - Last 12 months history
- `POST /api/financial/generate/:month` - Generate payments (YYYY-MM format)

### 3.6 Reports

**Purpose**: Comprehensive data export and reporting

**Features**:
- Multi-format export (PDF, Excel, CSV)
- Shares report with investor details
- Payments history report
- Financial summary report
- Custom date range selection
- Translated report headers

**API Endpoints**:
- Uses existing endpoints with frontend export logic

### 3.7 Compliance

**Purpose**: Document management and regulatory compliance

**Features**:
- Document upload and categorization
- KYC/AML documentation
- Contract storage
- Document status tracking (verified, pending, rejected)
- Version control

**API Endpoints**:
- `GET /api/documents` - User's documents (ownership checked)
- `POST /api/documents` - Upload document

### 3.8 Settings

**Purpose**: User profile and preferences management

**Features**:
- Profile information editing
- Notification preferences
- Security settings
- Language selection (PT-BR / EN-US)
- Dark mode toggle
- Password change

**API Endpoints**:
- `GET /api/auth/user` - Current user session
- `PATCH /api/users/:id` - Update user profile

### 3.9 Approvals (Manager/Admin)

**Purpose**: Workflow management for pending requests

**Features**:
- Share purchase approval queue
- Document verification
- User registration approvals
- Status tracking (pending, approved, rejected)
- Approval statistics

### 3.10 Investor Shares (Manager/Admin)

**Purpose**: Aggregated view of investor portfolios

**Features**:
- Investor summary table (grouped by user)
- Active shares count per investor
- Total invested amount
- Portfolio value (sum of current trailer values)
- Total returns received
- Profitability percentage
- Search and filter investors
- Export investor summary

**Data Aggregation**:
```typescript
// Frontend calculates per investor:
- activeSharesCount: Count of shares per user
- totalInvested: Sum of share purchase values
- portfolioValue: Sum of current trailer values
- totalReturns: Sum of all payments received
- profitability: (totalReturns / totalInvested) * 100
```

**API Endpoints**:
- `GET /api/shares/all` - All shares with user and trailer data

---

## 4. Data Model

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     USERS       │         │    TRAILERS     │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ username        │         │ trailerId       │
│ email           │         │ model           │
│ password        │         │ purchaseValue   │
│ firstName       │         │ currentValue    │
│ lastName        │         │ totalShares     │
│ role            │         │ status          │
│ country         │         │ location        │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 1:N                       │ 1:N
         │                           │
         │         ┌─────────────────┴────────────┐
         │         │                              │
         └─────────┤     SHARES                   │
                   ├─────────────────────────────┤
                   │ id (PK)                      │
                   │ userId (FK → users)          │
                   │ trailerId (FK → trailers)    │
                   │ purchaseValue                │
                   │ monthlyReturn                │
                   │ totalReturns                 │
                   │ status                       │
                   └────────┬─────────────────────┘
                            │ 1:N
                            │
                   ┌────────┴─────────────────────┐
                   │      PAYMENTS                │
                   ├──────────────────────────────┤
                   │ id (PK)                      │
                   │ shareId (FK → shares)        │
                   │ userId (FK → users)          │
                   │ amount                       │
                   │ referenceMonth (YYYY-MM)     │
                   │ paymentDate                  │
                   │ status                       │
                   │ UNIQUE(shareId, referenceMonth)│
                   └──────────────────────────────┘

┌──────────────────┐         ┌──────────────────────┐
│ TRACKING_DATA    │         │   FINANCIAL_RECORDS  │
├──────────────────┤         ├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ trailerId (FK)   │         │ month (UNIQUE)       │
│ latitude         │         │ totalRevenue         │
│ longitude        │         │ investorPayouts      │
│ speed            │         │ operationalCosts     │
│ location         │         │ companyMargin        │
│ status           │         └──────────────────────┘
└──────────────────┘

┌──────────────────┐         ┌──────────────────────┐
│   DOCUMENTS      │         │    AUDIT_LOGS        │
├──────────────────┤         ├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ userId (FK)      │         │ userId (FK)          │
│ shareId (FK)     │         │ action               │
│ documentType     │         │ entityType           │
│ fileName         │         │ entityId             │
│ fileUrl          │         │ details (jsonb)      │
│ status           │         │ ipAddress            │
└──────────────────┘         │ timestamp            │
                             └──────────────────────┘
```

### Table Details

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| username | text | NOT NULL, UNIQUE | Login identifier |
| email | text | NOT NULL, UNIQUE | User email |
| password | text | NOT NULL | bcrypt hashed password |
| firstName | text | nullable | User's first name |
| lastName | text | nullable | User's last name |
| role | text | NOT NULL, default: 'investor' | investor, manager, admin |
| country | text | default: 'US' | US, BR, etc. |
| createdAt | timestamp | default: NOW() | Account creation time |
| updatedAt | timestamp | default: NOW() | Last update time |

#### trailers
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| trailerId | text | NOT NULL, UNIQUE | Business ID (TR001, TR002...) |
| model | text | NOT NULL, default: 'Dry Van 53ft' | Trailer model |
| purchaseValue | decimal(10,2) | NOT NULL | Original purchase price |
| currentValue | decimal(10,2) | NOT NULL | Current market value |
| totalShares | integer | NOT NULL, default: 1 | Number of shares available |
| status | text | NOT NULL, default: 'stock' | stock, active, maintenance, expired |
| purchaseDate | date | NOT NULL | Date of acquisition |
| depreciationRate | decimal(5,2) | NOT NULL, default: 0.05 | Monthly depreciation % |
| expirationDate | date | nullable | Asset retirement date |
| location | text | nullable | Current location name |
| latitude | decimal(10,7) | nullable | GPS latitude |
| longitude | decimal(10,7) | nullable | GPS longitude |
| lastActivity | timestamp | nullable | Last tracking update |
| createdAt | timestamp | default: NOW() | Record creation |
| updatedAt | timestamp | default: NOW() | Last update |

#### shares
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| userId | varchar | NOT NULL, FK(users) | Share owner |
| trailerId | varchar | NOT NULL, FK(trailers) | Trailer reference |
| purchaseValue | decimal(10,2) | NOT NULL | Amount paid for share |
| purchaseDate | date | NOT NULL | Date of purchase |
| status | text | NOT NULL, default: 'active' | active, inactive |
| monthlyReturn | decimal(5,2) | NOT NULL, default: 2.00 | Return percentage |
| totalReturns | decimal(10,2) | NOT NULL, default: 0.00 | Lifetime returns sum |
| createdAt | timestamp | default: NOW() | Record creation |
| updatedAt | timestamp | default: NOW() | Last update |

**Business Rules**:
- Multiple shares can reference same trailer (up to totalShares limit)
- Trailer status → "active" when soldShares === totalShares
- Monthly return defaults to 2% but can be customized per share

#### payments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| shareId | varchar | NOT NULL, FK(shares) | Share being paid |
| userId | varchar | NOT NULL, FK(users) | Payment recipient |
| amount | decimal(10,2) | NOT NULL | Payment amount |
| paymentDate | date | NOT NULL | Date of payment |
| status | text | NOT NULL, default: 'paid' | paid, pending, failed |
| referenceMonth | varchar(7) | NOT NULL | YYYY-MM format |
| createdAt | timestamp | default: NOW() | Record creation |

**Indexes**:
- `UNIQUE(shareId, referenceMonth)` - Idempotency constraint
- `INDEX(userId, referenceMonth)` - Fast user payment queries

**Business Rules**:
- One payment per share per month (enforced by unique index)
- Amount = share.purchaseValue * (share.monthlyReturn / 100)
- Generated automatically via scheduler or manual trigger

#### financial_records
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| month | varchar(7) | NOT NULL, UNIQUE | YYYY-MM format |
| totalRevenue | decimal(12,2) | NOT NULL, default: 0 | Total company revenue |
| investorPayouts | decimal(12,2) | NOT NULL, default: 0 | Sum of payments |
| operationalCosts | decimal(12,2) | NOT NULL, default: 0 | Operating expenses |
| companyMargin | decimal(12,2) | NOT NULL, default: 0 | Net profit |
| createdAt | timestamp | default: NOW() | Record creation |

**Business Rules**:
- Upserted monthly (INSERT ... ON CONFLICT UPDATE)
- One record per month (enforced by unique index)
- Margin = totalRevenue - investorPayouts - operationalCosts

#### tracking_data
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| trailerId | varchar | NOT NULL, FK(trailers) | Trailer being tracked |
| latitude | decimal(10,7) | NOT NULL | GPS latitude |
| longitude | decimal(10,7) | NOT NULL | GPS longitude |
| speed | decimal(5,2) | nullable | Current speed |
| location | text | nullable | Geocoded location name |
| status | text | NOT NULL, default: 'moving' | moving, stopped, maintenance |
| distanceToday | decimal(10,2) | nullable | Daily distance traveled |
| timestamp | timestamp | default: NOW() | Tracking time |

#### documents
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| userId | varchar | nullable, FK(users) | Document owner |
| shareId | varchar | nullable, FK(shares) | Related share |
| documentType | text | NOT NULL | contract, kyc, compliance |
| fileName | text | NOT NULL | Original filename |
| fileUrl | text | NOT NULL | Storage URL |
| status | text | NOT NULL, default: 'verified' | verified, pending, rejected |
| uploadedAt | timestamp | default: NOW() | Upload time |

#### audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Auto-generated UUID |
| userId | varchar | nullable, FK(users) | User performing action |
| action | text | NOT NULL | Action description |
| entityType | text | NOT NULL | user, share, payment, etc. |
| entityId | varchar | nullable | Affected entity ID |
| details | jsonb | nullable | Additional context |
| ipAddress | text | nullable | Client IP |
| timestamp | timestamp | default: NOW() | Action time |

**Special Actions**:
- `access_denied` - 401/403 attempts
- `ownership_violation` - Failed ownership checks
- `login` / `logout` - Authentication events

---

## 5. Authentication & RBAC

### Authentication Flow

```
1. User submits credentials → POST /api/auth/login
2. Backend validates email/password
3. bcrypt.compare(plaintext, hashedPassword)
4. On success:
   - Create session with user object {id, email, role}
   - Regenerate session ID (prevent fixation)
   - Set secure HTTP-only cookie
5. Return user object to frontend
6. Frontend stores in TanStack Query cache
7. All subsequent requests include session cookie
8. Middleware validates session on each request
```

### Session Management

**Configuration**:
```typescript
// server/index.ts
session({
  secret: process.env.SESSION_SECRET || "fallback-secret-CHANGE-IN-PRODUCTION",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
  store: new PostgresStore({...}),
})
```

**Security Measures**:
- Session stored server-side in PostgreSQL
- HTTP-only cookies (prevent XSS)
- Secure flag in production (HTTPS only)
- SameSite protection (CSRF mitigation)
- Session regeneration on login (anti-fixation)

### Role-Based Access Control (RBAC)

**Role Hierarchy**:
1. **Admin** - Full system access
2. **Manager** - Business operations, read-only on some investor data
3. **Investor** - Personal portfolio only

**Policy Matrix** (`server/policies.ts`):

| Endpoint | Investor | Manager | Admin |
|----------|----------|---------|-------|
| GET /api/auth/user | ✓ | ✓ | ✓ |
| POST /api/auth/login | * (all) | * | * |
| POST /api/auth/logout | ✓ | ✓ | ✓ |
| GET /api/dashboard/stats | ✓ | ✓ | ✓ |
| GET /api/portfolio | ✓ | ✗ | ✗ |
| GET /api/trailers | ✗ | ✓ | ✓ |
| GET /api/trailers/available | ✓ | ✓ | ✓ |
| POST /api/trailers | ✗ | ✓ | ✓ |
| GET /api/tracking | ✗ | ✓ | ✓ |
| GET /api/financial/records | ✗ | ✓ | ✓ |
| POST /api/financial/generate/:month | ✗ | ✓ | ✓ |
| GET /api/shares/all | ✗ | ✓ | ✓ |
| GET /api/shares | ✓ | ✓ | ✓ |
| GET /api/shares/:id | ✓* | ✓ | ✓ |
| POST /api/shares | ✓ | ✓ | ✓ |
| GET /api/payments | ✓ | ✓ | ✓ |
| GET /api/payments/:shareId | ✓* | ✓ | ✓ |
| GET /api/documents | ✓* | ✓ | ✓ |
| GET /api/audit-logs | ✗ | ✓ | ✓ |

**Legend**:
- ✓ = Allowed
- ✗ = Forbidden
- * = Allowed with ownership check (investors can only access own data)

### Authorization Middleware

**Middleware Stack** (`server/middleware/auth.ts`):

```typescript
// 1. isAuthenticated - Check session exists
export const isAuthenticated = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// 2. authorize - Check role permission
export const authorize = (req, res, next) => {
  const allowedRoles = matchPolicy(req.method, req.path);
  if (!allowedRoles.includes(req.session.user.role)) {
    await logAccess(req, 403); // Audit log
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// 3. checkOwnership - Validate resource ownership (investors only)
export const checkOwnership = async (req, res, next) => {
  if (req.session.user.role !== "investor") {
    return next(); // Managers/admins bypass
  }
  
  if (requiresOwnershipCheck(req.method, req.path)) {
    // Validate share.userId === req.session.user.id
    const share = await db.query.shares.findFirst({
      where: eq(shares.id, req.params.id)
    });
    
    if (share.userId !== req.session.user.id) {
      await logAccess(req, 403, "ownership_violation");
      return res.status(403).json({ message: "Forbidden" });
    }
  }
  
  next();
}

// 4. logAccess - Audit all API requests
export const logAccess = async (req, status, action = "api_access") => {
  await db.insert(auditLogs).values({
    userId: req.session?.user?.id || null,
    action,
    entityType: "api_request",
    details: {
      method: req.method,
      path: req.path,
      status,
      ip: req.ip,
    },
    ipAddress: req.ip,
  });
}
```

**Route Protection Example**:
```typescript
// server/routes.ts
app.get("/api/shares/:id", 
  isAuthenticated,     // Step 1: Check logged in
  authorize,           // Step 2: Check role permission
  checkOwnership,      // Step 3: Check owns resource
  async (req, res) => {
    // Handler logic
  }
);
```

### Frontend Protection

**Protected Routes** (`client/src/App.tsx`):
```tsx
<ProtectedRoute allowedRoles={["manager", "admin"]} path="/assets">
  <Assets />
</ProtectedRoute>

<ProtectedRoute allowedRoles={["investor"]} path="/portfolio">
  <Portfolio />
</ProtectedRoute>
```

**Access Denied Handling**:
```typescript
// client/src/lib/queryClient.ts
queryClient.setDefaultOptions({
  mutations: {
    onError: (error) => {
      if (error.message === "Forbidden") {
        toast({
          title: "Access Denied",
          description: "You don't have permission",
          variant: "destructive",
        });
      }
    }
  }
});
```

### Security Hardening Checklist

- [ ] Set strong `SESSION_SECRET` in production (not default)
- [ ] Enable `secure: true` cookies (HTTPS only)
- [ ] Tighten Helmet CSP (remove 'unsafe-inline' if possible)
- [ ] Reduce API response logging to avoid PII leakage
- [ ] Implement password reset flow (currently not implemented)
- [ ] Add MFA support for admin/manager roles
- [ ] Set rate limits on sensitive endpoints
- [ ] Monitor audit logs for suspicious activity

---

## 6. Finance System

### Monthly Payment Generation

**Overview**: Automated system that generates 2% monthly returns for all active shares

**Formula**:
```
Payment Amount = Share Purchase Value × (Monthly Return % / 100)
Default: Payment = purchaseValue × 0.02
```

**Idempotency Guarantee**:
```sql
INSERT INTO payments (...)
VALUES (...)
ON CONFLICT (share_id, reference_month) DO NOTHING
```
- Prevents duplicate payments for same share in same month
- Safe to run multiple times (scheduler + manual trigger)

### Finance Service (`server/services/finance.service.ts`)

```typescript
export async function generateMonth(referenceMonth: string): Promise<GenerateMonthResult> {
  // Validate format: YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw new Error("Invalid format. Use YYYY-MM");
  }

  // 1. Fetch all active shares
  const activeShares = await db.query.shares.findMany({
    where: eq(shares.status, "active"),
  });

  // 2. Insert payments with idempotency
  let payoutSum = 0;
  for (const share of activeShares) {
    const rate = Number(share.monthlyReturn ?? 2) / 100;
    const amount = Number(share.purchaseValue) * rate;

    await db.execute(sql`
      INSERT INTO payments (...)
      VALUES (...)
      ON CONFLICT (share_id, reference_month) DO NOTHING
    `);

    payoutSum += amount;
  }

  // 3. Upsert financial record
  const investorPayouts = payoutSum;
  const totalRevenue = investorPayouts; // Simplified model
  const companyMargin = totalRevenue - investorPayouts;

  await db.execute(sql`
    INSERT INTO financial_records (...)
    VALUES (...)
    ON CONFLICT (month) DO UPDATE SET ...
  `);

  return {
    referenceMonth,
    sharesProcessed: activeShares.length,
    investorPayouts: investorPayouts.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    companyMargin: companyMargin.toFixed(2),
  };
}
```

### Automated Scheduler (`server/scheduler.ts`)

**Cron Configuration**:
```typescript
import cron from 'node-cron';
import { generateMonth } from './services/finance.service';

export function initializeScheduler() {
  // Runs on 1st day of each month at 06:00 UTC
  cron.schedule("0 6 1 * *", async () => {
    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`[Scheduler] Generating payments for ${referenceMonth}`);
    
    try {
      const result = await generateMonth(referenceMonth);
      console.log(`[Scheduler] Success:`, result);
    } catch (error) {
      console.error(`[Scheduler] Error:`, error);
    }
  });
  
  console.log("[Scheduler] Configured: 1st day of month at 06:00 UTC");
}
```

**Schedule Pattern Explained**:
```
"0 6 1 * *"
 │ │ │ │ │
 │ │ │ │ └─ Day of week (any)
 │ │ │ └─── Month (any)
 │ │ └───── Day of month (1st)
 │ └─────── Hour (06:00 UTC)
 └───────── Minute (0)
```

### Manual Payment Generation

**API Endpoint**:
```
POST /api/financial/generate/:month
Authorization: manager, admin
Path Parameter: month (YYYY-MM format)

Example: POST /api/financial/generate/2025-10
```

**Response**:
```json
{
  "success": true,
  "message": "Payments generated for 2025-10",
  "data": {
    "referenceMonth": "2025-10",
    "sharesProcessed": 15,
    "investorPayouts": "30000.00",
    "totalRevenue": "30000.00",
    "companyMargin": "0.00"
  }
}
```

### Financial Dashboard

**Current Month Summary** (`GET /api/financial/current`):
```json
{
  "month": "October/2025",
  "totalRevenue": "30000.00",
  "investorPayouts": "30000.00",
  "operationalCosts": "0.00",
  "companyMargin": "0.00"
}
```

**Historical Records** (`GET /api/financial/records`):
```sql
SELECT * FROM financial_records
ORDER BY month DESC
LIMIT 12
```

Returns last 12 months for trend analysis and charting

---

## 7. Internationalization & Currency

### i18n Implementation

**Framework**: i18next + react-i18next

**Supported Languages**:
- English (US) - `en-US`
- Portuguese (Brazil) - `pt-BR`

**Configuration** (`client/src/i18n.ts`):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'pt-BR': { translation: ptBR },
    },
    lng: localStorage.getItem('language') || 'pt-BR',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
  });
```

**Translation Files**:
- `client/src/locales/en-US.json` - English translations
- `client/src/locales/pt-BR.json` - Portuguese translations

**Translation Structure**:
```json
{
  "dashboard": {
    "title": "Dashboard",
    "welcomeMessage": "Welcome back",
    "totalValue": "Total Value"
  },
  "portfolio": {
    "title": "My Portfolio",
    "activeShares": "Active Shares"
  },
  "assets": {
    "title": "Assets",
    "addTrailer": "Add Trailer"
  }
}
```

**Usage in Components**:
```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  
  return (
    <h1>{t('dashboard.title')}</h1>
  );
}
```

**Language Switcher**:
```tsx
// client/src/components/layout/header.tsx
const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
};

<Select value={i18n.language} onValueChange={changeLanguage}>
  <SelectItem value="pt-BR">Português (BR)</SelectItem>
  <SelectItem value="en-US">English (US)</SelectItem>
</Select>
```

### Currency Handling

**System Currency**: US Dollars (USD) exclusively

**Format Function** (`client/src/lib/currency.ts`):
```typescript
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Usage: formatCurrency(50000) → "50,000.00"
```

**Display Pattern**:
```tsx
// Always prefix with $ symbol
<span>${formatCurrency(value)}</span>

// Examples:
$1,250.00
$50,000.00
$125,750.50
```

**Important Notes**:
- All monetary values stored in USD in database
- No currency conversion (system operates in US market only)
- `users.country` field exists for future expansion but not used for currency
- BRL conversion was considered but abandoned (see replit.md)

### Translation Coverage

**Fully Translated Pages**:
1. Dashboard (15 keys)
2. Portfolio (12 keys)
3. Assets (57 keys)
4. Tracking (10 keys)
5. Financial (14 keys)
6. Reports (16 keys)
7. Investor Shares (17 keys)
8. Approvals (11 keys)
9. Settings (21 keys)
10. Login/Auth (8 keys)

**Total**: 181 translation keys across both languages

**Chart Labels**: All Recharts components use translated labels via `t()` function

---

## 8. User Flows by Role

### 8.1 Investor Flow

#### Registration & Login
1. Navigate to `/login`
2. Enter credentials (email/password)
3. POST `/api/auth/login`
4. Redirect to Dashboard
5. Session stored in PostgreSQL, cookie set

#### Portfolio Management
1. View Dashboard → Personal portfolio overview
   - Total value calculation
   - Active shares count
   - Monthly return projection
   - Performance chart (6 months)

2. Navigate to "My Portfolio"
   - Individual share cards
   - Trailer details per share
   - Monthly return history
   - Total lifetime returns

3. View Payments
   - `GET /api/payments` (filtered by userId)
   - Payment history table
   - Monthly breakdown
   - Total returns sum

#### Purchasing Shares
1. Navigate to "Available Assets"
   - `GET /api/trailers/available`
   - Shows trailers with availableShares > 0
   - Display price, model, location

2. Select trailer to purchase
   - View trailer details
   - Check available shares count
   - See current location on map

3. Submit purchase
   - POST `/api/shares` with trailerId
   - Backend validates:
     - Trailer exists
     - Shares available (soldShares < totalShares)
     - User has funds (future implementation)
   - Creates share record
   - Updates trailer status if ALL shares sold

4. Confirmation & redirect to Portfolio

#### Document Management
1. Navigate to "Compliance"
   - `GET /api/documents` (ownership filtered)
   - View uploaded documents
   - Upload KYC/contracts
   - Check verification status

### 8.2 Manager Flow

#### Dashboard Overview
1. Login → Company-wide dashboard
   - Total fleet value
   - Active trailers count
   - Total shares sold
   - Company revenue (6-month chart)
   - Recent system activity

#### Fleet Management
1. Navigate to "Assets"
   - `GET /api/trailers` (all trailers)
   - View complete inventory
   - See purchase value vs current value
   - Track depreciation

2. Add New Trailer
   - Click "Add Trailer" button
   - Fill form:
     - Trailer ID (TR001, TR002...)
     - Model (Dry Van 53ft, etc.)
     - Purchase value
     - Purchase date
     - Total shares (default: 1)
     - Initial location
   - POST `/api/trailers`
   - Trailer created with status "stock"

3. Edit Trailer
   - Update current value
   - Adjust depreciation rate
   - Change status (stock → active → maintenance)
   - Update location

4. Export Reports
   - PDF: Formatted fleet report
   - Excel: Full data spreadsheet
   - CSV: Raw data export

#### Tracking & Monitoring
1. Navigate to "Tracking"
   - `GET /api/tracking`
   - View all trailers on map
   - See real-time status (moving/stopped)
   - Check location history

2. Individual Trailer Tracking
   - Click trailer marker
   - View details popup
   - See coordinates, speed, location
   - Check last activity timestamp

#### Financial Management
1. Navigate to "Financial"
   - `GET /api/financial/current`
   - `GET /api/financial/records`
   - View current month summary
   - Review revenue trends (12-month chart)

2. Generate Monthly Payments
   - Select month (YYYY-MM)
   - POST `/api/financial/generate/:month`
   - System processes all active shares
   - View confirmation:
     - Shares processed count
     - Total payouts
     - Revenue generated

3. Review Financial Records
   - Monthly breakdown table
   - Revenue, payouts, margin columns
   - Export capability

#### Investor Management
1. Navigate to "Investor Shares"
   - `GET /api/shares/all`
   - View aggregated investor data
   - Search by name/email
   - See portfolio metrics per investor

2. Investor Details
   - Active shares count
   - Total invested amount
   - Portfolio value (current)
   - Total returns paid
   - Profitability percentage

3. Export Investor Reports
   - PDF: Investor summary report
   - Excel: Full investor data
   - CSV: Raw investor data

#### Approvals & Compliance
1. Navigate to "Approvals"
   - View pending share purchases
   - Review document submissions
   - Approve/reject requests

2. Audit Logs
   - `GET /api/audit-logs`
   - Review system activity
   - Check access attempts
   - Monitor ownership violations

### 8.3 Admin Flow

**All Manager capabilities +**

1. **User Management**
   - Create/edit/delete users
   - Assign roles
   - Reset passwords
   - View user activity

2. **System Configuration**
   - Adjust system settings
   - Configure depreciation rules
   - Set payment schedules
   - Manage integrations

3. **Advanced Analytics**
   - Full audit log access
   - Cross-user data analysis
   - System health monitoring

### Access Restrictions Summary

| Feature | Investor | Manager | Admin |
|---------|----------|---------|-------|
| Personal Dashboard | ✓ | ✗ | ✗ |
| Company Dashboard | ✗ | ✓ | ✓ |
| My Portfolio | ✓ | ✗ | ✗ |
| Purchase Shares | ✓ | ✓ | ✓ |
| View All Trailers | ✗ | ✓ | ✓ |
| Add/Edit Trailers | ✗ | ✓ | ✓ |
| GPS Tracking | ✗ | ✓ | ✓ |
| Financial Records | ✗ | ✓ | ✓ |
| Generate Payments | ✗ | ✓ | ✓ |
| Investor Shares | ✗ | ✓ | ✓ |
| Approvals | ✗ | ✓ | ✓ |
| Audit Logs | ✗ | ✓ | ✓ |
| Own Documents | ✓ | ✓ | ✓ |
| All Documents | ✗ | ✓ | ✓ |

---

## 9. Integrations & External APIs

### Currently Configured

#### 1. Neon Database (PostgreSQL)
- **Type**: Managed PostgreSQL hosting
- **Connection**: WebSocket pool for serverless
- **Environment**: `DATABASE_URL`
- **Features**:
  - Automatic backups
  - Serverless scaling
  - Connection pooling

#### 2. Replit Platform Integrations
- **Log In with Replit**: OAuth authentication (installed but not active)
- **Database Integration**: PostgreSQL provisioning
- **Environment Secrets**: Secure key management

#### 3. Leaflet Maps
- **Provider**: OpenStreetMap
- **Tile Server**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **License**: OSM contributors (attribution required)
- **Usage**: GPS tracking and asset location visualization
- **No API Key Required**: Public tile service

### Future Integration Opportunities

#### Payment Processing
- **Stripe**: ACH transfers for investor payouts
- **Plaid**: Bank account verification
- **Search integrations tool**: `search_integrations("stripe")` or `search_integrations("plaid")`

#### Communication
- **Twilio**: SMS notifications for payments
- **SendGrid**: Email reports and alerts
- **Search integrations tool**: `search_integrations("twilio")`

#### GPS/Telematics
- **Samsara**: Fleet management API
- **Geotab**: Real-time tracking data
- **Custom IoT**: Trailer-mounted GPS devices

#### Compliance & KYC
- **Onfido**: Identity verification
- **DocuSign**: Digital contract signing
- **Plaid**: Bank verification

### Integration Security

**API Key Management**:
```typescript
// Use environment variables
const apiKey = process.env.STRIPE_SECRET_KEY;

// Never commit secrets to git
// Use Replit Secrets or .env (gitignored)
```

**Replit Secrets Management**:
1. Navigate to Secrets tab in Replit
2. Add secret key/value pairs
3. Access via `process.env.SECRET_NAME`
4. Automatic injection into environment

**Secret Rotation**:
- SESSION_SECRET: Change monthly
- Database passwords: Managed by Neon
- API keys: Rotate per vendor policy

---

## 10. Setup & Deploy

### Prerequisites

- **Node.js**: 20.x or higher
- **PostgreSQL**: 14+ (Neon serverless recommended)
- **npm**: 9.x or higher
- **Replit Account**: For hosted environment (optional)

### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=your-host.neon.tech
PGDATABASE=your-database
PGUSER=your-user
PGPASSWORD=your-password
PGPORT=5432

# Session Security
SESSION_SECRET=your-strong-random-secret-here-CHANGE-THIS

# Server
NODE_ENV=development  # or 'production'
PORT=5000
```

**Security Requirements**:
- `SESSION_SECRET`: Minimum 32 characters, random string
- `DATABASE_URL`: Use connection pooling URL for production
- Never commit `.env` to version control (add to `.gitignore`)

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd opus-rental-capital
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Database**
```bash
# Push schema to database
npm run db:push

# If you encounter issues, use force push
npm run db:push --force
```

4. **Seed Database** (Development Only)
```bash
npx tsx server/seed.ts
```

This creates:
- Sample users (investor, manager)
- Sample trailers
- Sample shares
- Sample payments
- Sample tracking data

5. **Start Development Server**
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

### Development Workflow

**File Structure**:
```
project/
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── lib/         # Utilities
│   │   ├── hooks/       # Custom React hooks
│   │   └── locales/     # Translation files
│   └── index.html
├── server/              # Backend Express app
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Data access layer
│   ├── routes.ts       # API endpoints
│   ├── policies.ts     # RBAC rules
│   ├── middleware/     # Auth, logging
│   ├── services/       # Business logic
│   └── seed.ts         # Dev data generator
├── shared/             # Shared types
│   └── schema.ts       # Drizzle schema + types
├── drizzle.config.ts   # Drizzle ORM config
├── package.json
└── vite.config.ts      # Vite build config
```

**Hot Reload**:
- Frontend: Vite HMR (instant updates)
- Backend: Workflow auto-restart on file changes
- Database: Manual restart required after schema changes

**Database Changes**:
1. Edit `shared/schema.ts`
2. Run `npm run db:push` (or `--force`)
3. Restart server workflow
4. Re-seed if needed

**Adding Routes**:
1. Frontend: Add page to `client/src/pages/`
2. Register in `client/src/App.tsx`
3. Backend: Add route to `server/routes.ts`
4. Update `server/policies.ts` with permissions

**Adding Translations**:
1. Add keys to `client/src/locales/en-US.json`
2. Add keys to `client/src/locales/pt-BR.json`
3. Use in component: `const { t } = useTranslation();`

### Production Deployment

#### 1. Replit Deployment (Recommended)

**Setup**:
1. Fork this repository to Replit
2. Configure Secrets:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate strong secret)
   - Other API keys as needed

3. Configure Replit Database:
   - Automatically provisions PostgreSQL
   - Sets `DATABASE_URL` environment variable

4. Deploy:
   - Click "Deploy" button
   - Choose "Autoscale" or "Reserved VM"
   - Configure domain (*.replit.app or custom)

**Advantages**:
- Automatic SSL/TLS
- Built-in secrets management
- One-click rollback via checkpoints
- Integrated database backups

#### 2. Traditional Deployment (VPS/Cloud)

**Build Process**:
```bash
# Install dependencies
npm ci --production

# Build frontend
npm run build

# Run migrations
npm run db:push

# Start server
NODE_ENV=production node server/index.js
```

**Process Management** (PM2):
```bash
npm install -g pm2

# Start with PM2
pm2 start server/index.js --name opus-capital

# Enable startup script
pm2 startup
pm2 save
```

**Nginx Reverse Proxy**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL/TLS** (Let's Encrypt):
```bash
sudo certbot --nginx -d yourdomain.com
```

#### 3. Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "server/index.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=opus_capital
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Production Hardening

**Security Checklist**:
- [x] Strong SESSION_SECRET (32+ chars)
- [x] HTTPS enabled (secure cookies)
- [x] Helmet CSP headers configured
- [ ] Rate limiting on all routes
- [ ] Remove 'unsafe-inline' from CSP
- [ ] Database connection pooling
- [ ] Environment-specific logging
- [ ] Disable detailed error messages
- [ ] API response size limits
- [ ] Request timeout configuration

**Performance Optimization**:
- [ ] Enable gzip compression
- [ ] Implement Redis caching (sessions, queries)
- [ ] Database query optimization (indexes)
- [ ] CDN for static assets
- [ ] Image optimization (Leaflet markers)
- [ ] Lazy loading for routes
- [ ] Code splitting in frontend

**Monitoring**:
- [ ] Application logging (Winston/Pino)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Database query performance
- [ ] Scheduler execution logs

### Database Migrations

**Drizzle Kit Commands**:
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Force push (resolves conflicts)
npm run db:push --force

# Drop database (DESTRUCTIVE)
npm run db:drop
```

**Migration Safety**:
- ⚠️ NEVER change primary key types (serial ↔ varchar)
- ⚠️ Test migrations on staging first
- ⚠️ Backup database before migrations
- ✓ Use `db:push --force` for safe schema sync
- ✓ Keep migrations in version control

### Scheduler Management

**Cron Job**:
```javascript
// server/scheduler.ts
// Runs: 1st day of month at 06:00 UTC
cron.schedule("0 6 1 * *", async () => {
  await generateMonth(currentMonth);
});
```

**Production Considerations**:
- Ensure server stays running (PM2 / systemd)
- Monitor cron execution logs
- Set up alerts for failures
- Test with manual generation first
- Verify timezone configuration (UTC)

**Manual Trigger** (if scheduler fails):
```bash
curl -X POST https://your-domain.com/api/financial/generate/2025-10 \
  -H "Authorization: Bearer <token>"
```

### Backup Strategy

**Database Backups**:
- **Neon**: Automatic daily backups (7-day retention)
- **Self-hosted**: Use `pg_dump` cron job

```bash
# Backup script (daily cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres opus_capital > backup_$DATE.sql
# Upload to S3/Backblaze
```

**Application Backups**:
- Git repository (code)
- Environment variables (secure vault)
- User-uploaded files (S3/object storage)

**Restore Procedure**:
```bash
# Restore from SQL dump
psql -h localhost -U postgres opus_capital < backup_20251020.sql

# Re-deploy application
git pull origin main
npm ci
npm run build
pm2 restart opus-capital
```

---

## Appendix

### A. API Reference

Complete API documentation available in `server/routes.ts`. All endpoints require authentication unless specified.

### B. Database Schema SQL

Generate current schema:
```bash
npm run db:generate
```

View in `drizzle/` directory.

### C. Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 401 | Unauthorized | No valid session | Login again |
| 403 | Forbidden | Insufficient permissions | Check user role |
| 403 | Forbidden (ownership) | Access denied to resource | Contact manager |
| 409 | Conflict | Duplicate payment | Idempotency check passed |
| 422 | Validation Error | Invalid input data | Check request body |
| 500 | Internal Server Error | Server exception | Check logs |

### D. Performance Benchmarks

**Target Metrics**:
- Page load: < 2s
- API response: < 200ms
- Database query: < 100ms
- Map rendering: < 1s
- Chart rendering: < 500ms

### E. License & Attribution

**Open Source Dependencies**:
- React (MIT)
- Express (MIT)
- Drizzle ORM (Apache 2.0)
- Leaflet (BSD-2-Clause)
- OpenStreetMap (ODbL)

**Map Data**:
© OpenStreetMap contributors. Map data licensed under the Open Database License.

---

**Document Version**: 1.0.0  
**Last Updated**: October 20, 2025  
**Maintained By**: Development Team
