# Opus Rental Capital - Investment Management Platform

## Overview

Opus Rental Capital is a comprehensive investment management platform for trailer-backed investments. The system enables investors to purchase shares (cotas) backed by physical cargo trailers, providing transparency through real-time tracking, financial reporting, and compliance documentation. Each share represents ownership of one complete trailer asset, with monthly returns calculated and distributed to investors.

The platform serves multiple user roles including investors, managers, and administrators, offering portfolio management, asset tracking via GPS, financial analytics, and comprehensive compliance features.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Role-based access control (investor, manager, admin)
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
- One-to-one mapping between shares and trailers (each share = one trailer)
- Many-to-one relationship between shares and users (investor portfolios)
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