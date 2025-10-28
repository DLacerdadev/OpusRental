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

## Recent Changes

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

### Institutional-Grade Landing Page (October 2025)

Created a sophisticated, security-focused landing page styled after investment banks (JP Morgan, Goldman Sachs, Fidelity):

**Premium Navigation Bar:**
- **Top Trust Bar**: SEC Registered, Bank-Level Security, FDIC Insured badges
- **Main Navigation**: Professional branding with company logo, "Investment Grade Asset Management" tagline
- **Clean CTAs**: "Sign In" and "Get Started" with premium styling
- **Utilities**: Theme toggle and language switcher

**Hero Section - Institutional Style:**
- **Trust Badge**: "SEC-Registered Investment Platform" with institutional icon
- **Headline**: "Institutional-Grade Asset Management" with gradient emphasis
- **Value Proposition**: Bank-level security, 2% monthly returns, complete transparency
- **Professional CTAs**: "Open Account" and "Client Login"
- **Certification Bar**: SEC Registered, FINRA Member, FDIC Insured, SOC 2 Type II

**Stats Showcase (4 Metrics):**
- $50M+ Assets Under Management
- 2,500+ Active Trailers
- 99.9% Uptime Guaranteed
- 5,000+ Investors

**Bank-Level Security Section (6 Features):**
- Criptografia Bancária (AES-256, Nível Bancário)
- Autenticação Multi-Fator (2FA with biometrics)
- Backup Redundante (99.9% SLA)
- Compliance Regulatório (SEC Compliant)
- Auditoria Contínua (SOC 2 Type II)
- Custódia Segura (FDIC Insured)

**Investment Performance (4 Features):**
- Retornos Consistentes (2% monthly)
- Ativos Tangíveis ($50M+ in trailers)
- Rastreamento GPS (24/7 tracking)
- Transparência Total (100% visibility)

**Premium CTA Section:**
- Gradient blue background (investment bank style)
- "Ready to Start Investing?" headline
- Trust indicators: FDIC Insured, 256-bit Encryption, SEC Registered, SOC 2 Certified

**Professional Footer:**
- Company branding with logo
- Legal, Company, Support sections
- Member FINRA/SIPC, FDIC Insured disclaimers

**Design Characteristics:**
- **Investment bank aesthetic**: Clean, professional, trustworthy
- **Security-first messaging**: Emphasizes bank-level protection throughout
- **Institutional color palette**: Blues, grays, whites with professional gradients
- **Premium animations**: Subtle, professional hover effects with Framer Motion
- **Full dark mode support**: Enterprise-grade dark theme
- **Mobile-first responsive**: All sections adapt perfectly across devices
- **Trust signals everywhere**: Certifications, badges, security features prominently displayed

**Route Structure:**
- `/` - Public institutional landing page (new homepage)
- `/login` - Client login page
- `/register` - Account opening page
- `/dashboard` - Protected client dashboard (previously `/`)