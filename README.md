# Ledger Récupération - Crypto Portfolio Management

A comprehensive web application inspired by Ledger Live, featuring separate client and admin spaces for crypto balance management and KYC processing.

## Features

### Client Space
- **Secure Authentication** - Email/password login with session management
- **KYC Onboarding** - Document upload and amount verification (0-250,000€)
- **Portfolio Dashboard** - Real-time crypto balances (BTC, ETH, USDT)
- **Live Price Data** - Integrated with CoinGecko API for real-time pricing
- **Bilingual Support** - French/English with automatic browser detection

### Admin Space
- **Client Management** - Complete overview of all registered clients
- **KYC Review** - View and manage client verification documents
- **Tax Configuration** - Global tax rate management (default 15%)
- **Data Export** - CSV export of client data
- **Client Notes** - Add and manage administrative notes

### Technical Features
- **Modern Dark UI** - Ledger Live-inspired design with responsive layout
- **PostgreSQL Database** - Production-ready data persistence
- **Real-time Updates** - Automatic price refreshing and data synchronization
- **Type Safety** - Full TypeScript implementation with Zod validation
- **Security** - Bcrypt password hashing and session-based authentication

## Demo Credentials

### Client Access
- **Email:** client@demo.com
- **Password:** demo123

### Admin Access
- **Email:** admin@ledger.com
- **Password:** admin123

## Technology Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **UI Components:** Shadcn/ui + Tailwind CSS
- **State Management:** TanStack Query
- **Authentication:** Express Sessions + Bcrypt
- **Validation:** Zod schemas
- **Real-time Data:** CoinGecko API integration

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/src/          # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Application pages/routes
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and API client
├── server/             # Backend Express application
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # Database operations
│   └── db.ts           # Database configuration
├── shared/             # Shared TypeScript schemas
└── uploads/            # KYC document storage
```

## API Endpoints

### Authentication
- `POST /api/client/login` - Client authentication
- `POST /api/admin/login` - Admin authentication
- `GET /api/auth/me` - Current user session
- `POST /api/auth/logout` - Session termination

### Client Operations
- `POST /api/client/onboarding` - Complete KYC process
- `GET /api/client/dashboard` - Portfolio data with live prices

### Admin Operations
- `GET /api/admin/dashboard` - Client management overview
- `GET /api/admin/clients/:id/notes` - Client administrative notes
- `POST /api/admin/clients/:id/notes` - Add client note
- `PUT /api/admin/tax-rate` - Update global tax rate
- `GET /api/admin/export` - Export client data as CSV

## Security Features

- Password hashing with bcrypt (12 rounds)
- Session-based authentication with secure cookies
- Input validation with Zod schemas
- Type-safe database operations
- Secure file upload handling
- CORS protection and request validation

## Production Deployment

The application is designed for deployment on Replit with automatic:
- Environment variable management
- Database provisioning
- SSL/TLS certificate handling
- Health checks and monitoring

## License

Private - Ledger Récupération Portfolio Management System