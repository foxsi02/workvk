# USLUGI.ru Platform

## Overview

USLUGI.ru is a Russian-language service marketplace platform that connects clients with verified service professionals (masters) across various categories including repair, IT, automotive, legal, beauty, and household services. The platform facilitates service discovery, booking, payments, real-time chat communication, and gamification through achievements.

## User Preferences

Preferred communication style: Simple, everyday language.

## Legal Information

**Operator**: Яркин Константин Александрович (self-employed)  
**INN**: 223203623340  
**Email**: iscatel0172@gmail.com

Legal documents:
- User Agreement (Offer) - `/terms`
- Privacy Policy - `/privacy`

All legal documents comply with Russian Federation law and Federal Law No. 152-FZ "On Personal Data".

## Recent Changes

**November 10, 2025 - HttpOnly Cookie Authentication (Production-Ready)**
- ✅ Migrated from localStorage to HttpOnly cookies for HTTP auth (XSS-protected)
- ✅ Hybrid approach: cookies for HTTP, localStorage token for WebSocket only
- ✅ Cookie configuration: httpOnly, secure (production), sameSite=lax, 7-day expiration
- ✅ Backend: cookie-parser middleware, authMiddleware reads from cookies
- ✅ Frontend: credentials: "include" for automatic cookie sending
- ✅ POST /api/auth/logout endpoint clears cookies
- ✅ E2E testing passed: cookie-based auth, session persistence, logout verification
- Architect approved: production-ready implementation

**November 10, 2025 - YooKassa Payment Integration (Production-Ready)**
- ✅ Real YooKassa API integration with live payment creation
- ✅ Mandatory webhook signature verification (HMAC-SHA256 base64)
- ✅ Comprehensive payment validation: amount, currency (RUB), paid flag
- ✅ Automatic order status updates on payment success
- ✅ Transaction tracking with idempotency protection
- ✅ Security audit passed: all 5 critical issues resolved
- Configuration: POST /api/payments/create, POST /api/payments/webhook
- Required env vars: YUKASSA_SHOP_ID, YUKASSA_SECRET_KEY

**November 10, 2025 - Security Audit (COMPLETED)**
- Eliminated all passwordHash exposure across 13 storage methods and 4 API endpoints
- Created SAFE_USER_SELECTION constant for secure user data returns
- All user-facing endpoints now use Omit<User, 'passwordHash'>
- Admin dashboard secured with proper authentication

**November 10, 2025 - Service Management System**
- Added complete CRUD functionality for master services
- CreateServicePage: Form with Zod validation, category selection, price/duration inputs
- EditServicePage: Edit form with delete confirmation AlertDialog
- UserProfilePage: Displays master's services list with create/edit buttons
- Backend: POST/PATCH/DELETE /api/services with authMiddleware and ownership verification
- Added GET /api/masters/by-user/:userId endpoint for profile integration
- Routes registered: /services/create, /services/edit/:id

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server with HMR support
- **Wouter** for lightweight client-side routing (no React Router)
- **TanStack Query v5** for server state management, caching, and data fetching

**UI Component System**
- **shadcn/ui** components with Radix UI primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling with custom design tokens
- Component library follows "new-york" style variant
- Custom theming system with CSS variables for light/dark mode support

**Design System**
- Brand colors centered around red primary (#DC2626 or #EF4444) for CTAs and brand elements
- Trust indicators use blue/green tones for verification badges
- Inter/Manrope font family via Google Fonts for Cyrillic support
- Responsive grid system: mobile-first with breakpoints at md:768px and lg:1024px

**State Management Strategy**
- Server state handled by TanStack Query with query invalidation patterns
- Local UI state managed with React hooks (useState, useEffect)
- Authentication: HttpOnly cookies for HTTP requests (XSS-protected), localStorage token for WebSocket only
- WebSocket connections for real-time notifications and chat

### Backend Architecture

**Server Framework**
- **Express.js** on Node.js for HTTP server and API routing
- **WebSocket Server** (ws library) for real-time bidirectional communication
- Custom middleware for request logging, JSON parsing, and raw body capture (for webhooks)

**Authentication & Authorization**
- **JWT tokens** for stateless authentication (using jsonwebtoken library)
- Secret key stored in `SESSION_SECRET` environment variable
- Custom middleware (`authMiddleware`, `adminMiddleware`) for protecting routes
- Role-based access control with three roles: client, master, admin

**API Design Pattern**
- RESTful API structure under `/api` prefix
- Routes organized by resource type (auth, masters, orders, reviews, etc.)
- Consistent error handling with HTTP status codes
- Request/response logging middleware for debugging

**Database Layer**
- **Drizzle ORM** for type-safe database queries and schema management
- Connection pooling via `@neondatabase/serverless` with WebSocket support
- Schema-first approach with TypeScript types auto-generated from Drizzle schema
- Migration system via `drizzle-kit` (migrations stored in `/migrations`)

### Data Storage

**Database Schema**
- **PostgreSQL** as the primary relational database
- Connection string provided via `DATABASE_URL` environment variable

**Core Tables**
- `users`: User accounts with role (client/master/admin), credentials, profile data
- `masters`: Extended profile for users with master role (specialization, rates, location, verification status)
- `services`: Individual services offered by masters with pricing and duration
- `categories`: Hierarchical service categories with parent-child relationships
- `orders`: Service bookings linking clients, masters, and services with status tracking
- `reviews`: Rating and feedback system tied to completed orders
- `articles`: Content management for knowledge base articles
- `achievements`: Gamification badges with point values and criteria
- `user_achievements`: Junction table tracking earned achievements per user
- `chat_messages`: Real-time messaging between clients and masters for specific orders
- `transactions`: Payment records with YooKassa integration tracking

**Data Relationships**
- Users have one-to-one relationship with masters profile
- Masters have one-to-many relationships with services
- Orders link clients, masters, and services in many-to-one relationships
- Reviews require completed orders (one-to-one)
- Chat messages are scoped to specific orders

### External Dependencies

**Payment Processing**
- **YooKassa API** for payment processing in Russian rubles
- Test API key: `sk_test_dX_nA86cCSXJ9UpkdY1ICnnMhYA8tWVR1bT9j4k0AhI`
- Transaction tracking in database with payment status enum (pending/completed/failed/refunded)

**Third-Party UI Libraries**
- **Radix UI** primitives: 20+ accessible component primitives (dialogs, dropdowns, toasts, etc.)
- **Lucide React** for icon system
- **react-hook-form** with Zod validation for form handling
- **bcrypt** for password hashing (10 salt rounds)

**Development Tools**
- **Replit-specific plugins**: runtime error overlay, cartographer, dev banner
- **TypeScript** for static type checking across client and server
- **ESBuild** for server-side bundling in production builds

**Asset Management**
- Generated images stored in `/attached_assets/generated_images/` directory
- Achievement badge images, hero images, and category icons
- Images referenced via Vite alias `@assets`