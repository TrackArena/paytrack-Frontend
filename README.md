# paytrack-frontend

React + TypeScript + Vite frontend for the PayTrack payment reconciliation platform.

## Stack

- **React 18** — UI library
- **TypeScript 5** — type safety
- **Vite 6** — build tool and dev server
- **Tailwind CSS 3** — utility-first styling
- **shadcn/ui** — accessible component primitives (Radix UI)
- **TanStack Query 5** — server state management
- **React Router 6** — client-side routing
- **React Hook Form + Zod** — form handling and validation
- **Recharts** — financial data visualisation
- **Axios** — HTTP client with automatic token refresh

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Set VITE_API_URL to your running backend

# 3. Start dev server
npm run dev
```

Runs on `http://localhost:5173` by default.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api/v1` |
| `VITE_STELLAR_EXPLORER_TESTNET` | Testnet explorer base | `https://stellar.expert/explorer/testnet` |
| `VITE_STELLAR_EXPLORER_MAINNET` | Mainnet explorer base | `https://stellar.expert/explorer/public` |

## Connecting to the Backend

This frontend communicates exclusively with `paytrack-backend`. See the [backend README](https://github.com/PayTrack/paytrack-backend) for setup instructions.

The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically. In production, configure your reverse proxy to route `/api` to the backend.

## Application Structure

```
src/
├── components/
│   ├── auth/              ProtectedRoute
│   ├── layout/            Sidebar, TopNav, DashboardLayout
│   └── ui/                Button, Card, Badge, Input, Toast
├── contexts/
│   ├── AuthContext.tsx     Authentication state + JWT handling
│   └── WorkspaceContext.tsx  Active workspace state
├── hooks/
│   ├── useDashboard.ts    Dashboard KPI queries
│   ├── useInvoices.ts     Invoice CRUD
│   ├── useCustomers.ts    Customer CRUD
│   ├── usePayments.ts     Payment queries + verify mutation
│   ├── useWallets.ts      Wallet connect/disconnect
│   └── useReports.ts      Revenue and invoice reports
├── lib/
│   ├── api.ts             Axios client with token refresh
│   └── utils.ts           Formatting helpers
├── pages/
│   ├── auth/              Login, Register
│   ├── dashboard/         Main dashboard
│   ├── invoices/          Invoice list, detail, new
│   ├── customers/         Customer list, detail
│   ├── transactions/      Payment history + verify form
│   ├── wallets/           Wallet management
│   ├── reports/           Revenue and invoice charts
│   ├── settings/          Profile and workspace settings
│   └── public/            Payment link and invoice public pages
└── App.tsx                Route declarations
```

## Authentication Flow

1. User logs in → backend returns JWT access token + sets HTTP-only refresh cookie
2. Access token stored in `localStorage`, attached as `Authorization: Bearer` header
3. On 401, Axios interceptor silently calls `/auth/refresh` using the cookie
4. New access token replaces the old one; original request retries automatically
5. On refresh failure, user is redirected to `/login`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

## Public Pages

These pages are accessible without authentication:

- `/invoice/:token` — Customer-facing invoice view with payment instructions
- `/pay/:token` — Payment link page

## Security Notes

- Access tokens are short-lived (15 min) — refresh is automatic
- The frontend never accesses PostgreSQL directly
- Stellar secret keys are never requested or stored
- All financial calculations are performed server-side; the frontend displays results only
