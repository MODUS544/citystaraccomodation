# City Star Hotel - Enterprise Platform

Production-grade, headless architecture for the **City Star Hotel** platform. Built with clean separation of concerns, strict type-safety, row-level locking for zero double-bookings, stateless Bearer JWT authentication, and automated Render zero-downtime deployment.

---

## 1. System Architecture & Infrastructure

- **Repository**: [`https://github.com/MODUS544/citystaraccomodation.git`](https://github.com/MODUS544/citystaraccomodation.git)
- **Backend Production Host**: [Render Web Service](https://citystaraccomodation.onrender.com) (`https://citystaraccomodation.onrender.com`)
- **Database & Auth Host**: [Supabase PostgreSQL](https://eyxorfozdtpysnsdwkib.supabase.co) (`https://eyxorfozdtpysnsdwkib.supabase.co`)
- **Monorepo Topology**:
  ```text
  ├── apps/
  │   ├── api/            # Node.js / Express / TypeScript Headless REST API
  │   └── web/            # Next.js App Router Client (Future Phase)
  ├── supabase/
  │   └── migrations/     # PostgreSQL DDL Migrations & Concurrency Rules
  ├── render.yaml         # Render Infrastructure-as-Code Blueprint
  └── package.json        # Workspace configuration
  ```

---

## 2. Database Schema & Concurrency Safety

DDL Migration File: `supabase/migrations/20261026000001_initial_schema.sql`

### Core Tables
1. **`profiles`**: Extends `auth.users` with RBAC roles (`guest`, `receptionist`, `admin`). Automatically populated upon user registration via the `handle_new_user()` trigger.
2. **`room_types`**: Stores room classifications (e.g. Deluxe King Suite, Executive Twin, Presidential Penthouse), pricing, max occupancy, and amenities.
3. **`rooms`**: Individual hotel rooms with room numbers, floor levels, and live statuses (`available`, `occupied`, `maintenance`, `cleaning`, `out_of_order`).
4. **`bookings`**: Stores reservations with check-in/out dates, pricing, and guest associations.
5. **`payments`**: Transaction records linked to bookings supporting various payment gateways (Stripe, Paystack, cards, bank transfer).

### Concurrency & Double-Booking Prevention
Double-booking is prevented at two independent layers:
1. **PostgreSQL GiST Exclusion Constraint**:
   ```sql
   CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
       room_id WITH =,
       daterange(check_in_date, check_out_date, '[)') WITH &&
   ) WHERE (status NOT IN ('cancelled', 'no_show'));
   ```
   Even in race conditions across multiple distributed API servers, PostgreSQL rejects any overlapping reservation with SQL state `23P01`.

2. **Atomic Row-Level Locking (`create_booking_atomic`)**:
   Acquires an exclusive row lock (`SELECT ... FOR UPDATE` on `rooms`), verifies real-time status and non-overlapping date ranges within a single database transaction, and generates unique booking references atomically.

### How to Apply Migration to Supabase
1. Log into the [Supabase Dashboard](https://supabase.com/dashboard/project/eyxorfozdtpysnsdwkib).
2. Navigate to **SQL Editor** -> **New query**.
3. Paste the contents of `supabase/migrations/20261026000001_initial_schema.sql`.
4. Click **Run**. All tables, enums, triggers, RLS policies, and seed data will be provisioned.

---

## 3. Node.js & TypeScript API Server (`@citystar/api`)

### Connection Pooling
The backend utilizes `pg.Pool` tuned specifically for Supabase:
- **Transaction Pooler (Port 6543 via Supavisor)**: Recommended for Render web instances to avoid exhausting database connection limits.
- **Direct Connection (Port 5432)**: Used for running Prisma DDL schema migrations.
- **Auto Health Probe**: `checkDatabaseHealth()` executes `SELECT 1` with high-resolution latency tracking (in milliseconds) and pool metric reporting (`activeConnections`, `idleConnections`, `totalConnections`).

### Standardized REST Response Format
All endpoints return standard payloads:
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "DOUBLE_BOOKING_CONFLICT",
    "message": "Room is already reserved for the selected date range.",
    "details": { ... }
  }
}
```

### Authentication & Headless Mobile Ready
- **Stateless Bearer JWT**: The client sends `Authorization: Bearer <supabase_jwt_token>`.
- Supports both web (Next.js) and future Flutter mobile apps with identical contracts.
- **Role-Based Access Control (RBAC)**: `requireRole(['receptionist', 'admin'])`.

---

## 4. API Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Render health probe & database pool status |
| `GET` | `/api/v1/health` | Public | Detailed API v1 service & DB health metrics |
| `GET` | `/api/v1/rooms/types` | Public | List active room types & pricing |
| `GET` | `/api/v1/rooms/types/:slug` | Public | Get single room type details |
| `GET` | `/api/v1/rooms/available` | Public | Query available rooms by date window & guests |
| `POST` | `/api/v1/rooms/types` | Admin | Create a new room type |
| `POST` | `/api/v1/bookings` | Guest / Admin | Atomically create room booking with row lock |
| `GET` | `/api/v1/bookings/my` | Authenticated | Retrieve authenticated user's reservations |
| `GET` | `/api/v1/bookings/:reference` | Authenticated | Get booking details by reference code |

---

## 5. Render Deployment Configuration

This repository includes a native `render.yaml` Blueprint:
1. Connect the GitHub repository `https://github.com/MODUS544/citystaraccomodation.git` to Render.
2. Select **New Blueprint Instance** or create a **Web Service**:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. Add the following environment variables in Render Dashboard:
   - `DATABASE_URL`: `postgresql://postgres.eyxorfozdtpysnsdwkib:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10`
   - `DIRECT_URL`: `postgresql://postgres.eyxorfozdtpysnsdwkib:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   - `SUPABASE_URL`: `https://eyxorfozdtpysnsdwkib.supabase.co`
   - `SUPABASE_ANON_KEY`: `[YOUR_SUPABASE_ANON_KEY]`
   - `SUPABASE_SERVICE_ROLE_KEY`: `[YOUR_SUPABASE_SERVICE_ROLE_KEY]`
   - `SUPABASE_JWT_SECRET`: `[YOUR_SUPABASE_JWT_SECRET]`

---

## 6. Local Development Quickstart

```bash
# 1. Install dependencies across monorepo
cd apps/api
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your local or Supabase credentials

# 3. Start development server with hot-reload
npm run dev

# 4. Compile TypeScript for production
npm run build

# 5. Start production server
npm start
```
