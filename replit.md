# Replit.md - Ledger Récupération System

## Overview

Ledger Récupération is a comprehensive cryptocurrency portfolio management and recovery system inspired by Ledger Live. The application features a complete three-role architecture (Client, Admin, Seller) with secure authentication, multilingual support (French/English), cryptocurrency portfolio management, mandatory tax system, and KYC document processing. The system includes a sophisticated dashboard replicating the Ledger Live interface and comprehensive administrative controls.

## System Architecture

The application follows a modern full-stack TypeScript architecture:

- **Frontend**: React + TypeScript with Vite build system
- **Backend**: Express.js + TypeScript with modular route handling
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Authentication**: Express sessions with bcrypt password hashing
- **UI Framework**: Shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management

## Key Components

### Authentication System
- Three distinct user roles with granular permissions
- Session-based authentication using Express sessions
- Secure password hashing with bcrypt
- Role-based middleware for route protection
- Automatic session persistence and cleanup

### Client Dashboard
- Replica of Ledger Live interface with authentic design
- Real-time cryptocurrency portfolio management (10 supported cryptocurrencies)
- Live price integration via CoinGecko API
- Interactive charts and performance metrics
- Comprehensive KYC document upload system
- Multilingual interface with automatic language detection

### Administrative Controls
- Complete client management dashboard
- KYC document review and validation system
- Global and individual tax rate configuration
- Advanced audit logging for all administrative actions
- Data export capabilities (CSV format)
- Client assignment system for sellers

### Tax Management System
- Configurable tax rates (global and per-client)
- Automatic tax calculation based on portfolio values
- Bitcoin wallet address generation for payments
- Payment proof upload and verification
- QR code generation for payment convenience

## Data Flow

1. **User Registration**: Client registration with KYC document upload
2. **Authentication**: Role-based login with session management
3. **Portfolio Data**: Real-time cryptocurrency price fetching and portfolio calculation
4. **Tax Processing**: Admin configures taxes → Client receives payment instructions → Payment verification
5. **Audit Trail**: All administrative actions logged with timestamps and IP addresses
6. **Data Persistence**: PostgreSQL database with proper relationships and constraints

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Cryptocurrency Prices**: CoinGecko API for real-time market data
- **File Handling**: Multer for KYC document uploads
- **Security**: Helmet for security headers, bcrypt for password hashing
- **UI Components**: Radix UI primitives with Shadcn/ui styling

### Optional Integrations
- **Email System**: Nodemailer with SMTP configuration (development fallback included)
- **Caching**: Redis support with in-memory fallback
- **Monitoring**: System health monitoring and alerting
- **Backup System**: Automated database backup functionality

## Deployment Strategy

### Production Configuration
- **Domain**: Configured for rec-ledger.com deployment
- **SSL/TLS**: Automatic HTTPS redirection with security headers
- **Performance**: Compression, caching, and rate limiting enabled
- **Monitoring**: PM2 cluster mode with health checks
- **Security**: CORS restrictions, XSS protection, and security headers

### Environment Variables Required
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=<strong_secret>
DOMAIN=rec-ledger.com
```

### Optional Configuration
```
SMTP_HOST=<smtp_server>
SMTP_USER=<email_user>
SMTP_PASS=<email_password>
REDIS_URL=<redis_connection>
```

## Changelog
- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.