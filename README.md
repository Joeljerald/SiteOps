# Site Operations Management System

A full-stack enterprise web application built for managing distributed industrial field sites, hardware installations, and field operations personnel. Designed with an interview-ready architecture utilizing raw parameterized SQL without ORM abstraction.

---

## Architecture Overview

The system strictly adheres to a direct **Routes → Controllers → PostgreSQL** pattern, eliminating unnecessary service layers and ORM abstraction:

```
[ Client Browser / React SPA ]
             │
             │ HTTP REST (JSON)
             ▼
[ Express Router (routes/*.js) ]
             │
             │ Direct Function Call
             ▼
[ Express Controller (controllers/*.js) ]
  • HTTP Request / Response Handling
  • Input Validation & Type Checking
  • Parameterized SQL Construction
  • Database Error Code Translation (23505, 23503, 22P02)
             │
             │ pool.query($1, $2, ...)
             ▼
[ Connection Pool (config/db.js / pg.Pool) ]
             │
             │ PostgreSQL Protocol (Port 5432)
             ▼
[ PostgreSQL 18 Database Engine (site_operations) ]
  • Relational Tables: users, sites, installations
  • Foreign Keys with ON DELETE CASCADE
  • B-Tree Performance Indexes
```

---

## Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 18 | ACID compliance, relational integrity, foreign key cascades, aggregation queries. |
| **DB Driver** | `pg` (`node-postgres`) | Direct connection pooling (`pg.Pool`), raw parameterized queries, zero ORM overhead. |
| **Backend Runtime** | Node.js (ES Modules) | Asynchronous non-blocking I/O with standard `import`/`export` syntax (`"type": "module"`). |
| **Backend Framework**| Express 5 | High-performance minimalist REST API routing and middleware pipeline. |
| **Frontend Framework**| React 18 | Component-driven declarative UI with hooks for state management. |
| **Bundler & Tooling** | Vite 6 | Fast modern development server and production Rollup bundling. |
| **API Client** | Native Fetch API | Built-in browser Fetch API for REST requests without third-party libraries. |
| **Styling** | Custom CSS | Clean, modular CSS styles with responsive layout and accessibility tokens. |
| **Icons** | Lucide React | Lightweight, accessible, vector iconography. |

---

## Database Schema & Relationship

### Entity Relationship (ER) Diagram

```
┌───────────────────────────┐
│           SITES           │
├───────────────────────────┤
│ id (PK, SERIAL)           │◄────────┐
│ site_code (UNIQUE)        │         │
│ site_name                 │         │ 1 : N
│ location                  │         │ (One site has many installations)
│ city                      │         │ ON DELETE CASCADE
│ state                     │         │
│ status                    │         │
│ client_name               │         │
│ created_at / updated_at   │         │
└───────────────────────────┘         │
                                      │
┌───────────────────────────┐         │
│       INSTALLATIONS       │         │
├───────────────────────────┤         │
│ id (PK, SERIAL)           │         │
│ site_id (FK) ─────────────┼─────────┘
│ installation_type         │
│ status                    │
│ scheduled_date            │
│ completion_date           │
│ assigned_to               │
│ notes                     │
│ created_at / updated_at   │
└───────────────────────────┘

┌───────────────────────────┐
│           USERS           │
├───────────────────────────┤
│ id (PK, SERIAL)           │
│ name                      │
│ email (UNIQUE)            │
│ role                      │
│ created_at / updated_at   │
└───────────────────────────┘
```

---

## Project Structure

```
site-operations/
├── backend/
│   ├── config/
│   │   └── db.js                      # pg.Pool connection singleton
│   ├── controllers/
│   │   ├── dashboardController.js     # Summary metrics & status aggregation
│   │   ├── installationController.js  # CRUD, pagination & search for installations
│   │   ├── siteController.js          # CRUD, pagination & search for sites
│   │   └── userController.js          # CRUD for system users
│   ├── routes/
│   │   ├── dashboardRoutes.js         # /api/dashboard routes
│   │   ├── installationRoutes.js      # /api/installations routes
│   │   ├── siteRoutes.js              # /api/sites routes
│   │   └── userRoutes.js              # /api/users routes
│   ├── app.js                         # Express app initialization & middleware
│   ├── server.js                      # HTTP server listener & DB health check
│   ├── package.json                   # Backend dependencies & npm scripts
│   ├── package-lock.json              # Backend pinned dependency lockfile
│   ├── .env                           # Local environment variables (git-ignored)
│   ├── .env.example                   # Sanitized environment template
│   └── .gitignore                     # Backend git-ignore configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx       # Action confirmation dialog overlay
│   │   │   ├── Header.jsx             # Top bar with status and notifications
│   │   │   ├── Modal.jsx              # Reusable accessible form dialog
│   │   │   ├── Pagination.jsx         # Accessible pagination control with ellipsis
│   │   │   └── Sidebar.jsx            # Desktop & responsive mobile navigation drawer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx      # KPI statistics & recent activities overview
│   │   │   ├── InstallationsPage.jsx  # Work orders table, filter, pagination & modal
│   │   │   ├── SitesPage.jsx          # Sites registry, search, pagination & modal
│   │   │   └── UsersPage.jsx          # Personnel directory & user management modal
│   │   ├── services/
│   │   │   └── api.js                 # Centralized native Fetch API REST client
│   │   ├── App.jsx                    # Root view switcher & toast manager
│   │   ├── index.css                  # Custom responsive CSS styles & tokens
│   │   └── main.jsx                   # React 18 DOM mount point
│   ├── .env                           # Frontend environment config (git-ignored)
│   ├── .env.example                   # Sanitized frontend environment template
│   ├── index.html                     # HTML document shell
│   ├── package.json                   # Frontend dependencies & npm scripts
│   └── vite.config.js                 # Vite bundler configuration
├── database/
│   ├── schema.sql                     # DDL table creation, constraints & indexes
│   └── seed.sql                       # Initial development seed dataset
├── .gitignore                         # Strict exclusion for secrets, node_modules & dist
├── POSTGRESQL_GUIDE.md                # Comprehensive technical interview guide
└── README.md                          # Application documentation
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher (tested on PostgreSQL 18)
- **Git**

---

### 1. Database Setup

1. Open `psql` or `pgAdmin 4`.
2. Create the database:
   ```sql
   CREATE DATABASE site_operations;
   ```
3. Execute the schema definitions:
   ```bash
   psql -U postgres -d site_operations -f database/schema.sql
   ```
4. (Optional) Populate sample development records:
   ```bash
   psql -U postgres -d site_operations -f database/seed.sql
   ```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your local database credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/site_operations
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend runs on `http://localhost:5000`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure the API endpoint points to the backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or the port specified by Vite) in your browser.

---

## API Reference

### Health Check
- `GET /` — API health status (`{ success: true, message: "Site Operations API is running" }`)

### Dashboard
- `GET /api/dashboard/summary` — Aggregated counts (`totalSites`, `activeSites`, `totalInstallations`, `completedInstallations`, `totalUsers`), installation status breakdown, and recent activity log.

### Users (`/api/users`)
- `GET /api/users` — List all users ordered by `id ASC`.
- `GET /api/users/:id` — Get user details by primary key ID.
- `POST /api/users` — Create user (`{ name, email, role }`). Returns HTTP 409 on duplicate email.
- `PUT /api/users/:id` — Update user details (`{ name, email, role }`). Returns HTTP 409 on duplicate email.
- `DELETE /api/users/:id` — Delete user by ID.

### Sites (`/api/sites`)
- `GET /api/sites?page=1&limit=10&search=keyword` — Paginated and searchable list of sites.
- `GET /api/sites/:id` — Get site details by primary key ID.
- `POST /api/sites` — Create site (`{ site_code, site_name, location, city, state, status, client_name }`). Returns HTTP 409 on duplicate `site_code`.
- `PUT /api/sites/:id` — Update site record. Returns HTTP 409 on duplicate `site_code`.
- `DELETE /api/sites/:id` — Delete site by ID (cascades delete to linked installations).

### Installations (`/api/installations`)
- `GET /api/installations?page=1&limit=10&search=keyword` — Paginated and searchable list with JOIN to parent site.
- `GET /api/installations/:id` — Get installation details by primary key ID.
- `POST /api/installations` — Create installation (`{ site_id, installation_type, status, scheduled_date, completion_date, assigned_to, notes }`). Returns HTTP 400 on invalid `site_id` (foreign key constraint).
- `PUT /api/installations/:id` — Update installation record.
- `DELETE /api/installations/:id` — Delete installation record.

---

## Production Build

To verify and produce an optimized production bundle for the frontend:

```bash
cd frontend
npm run build
```

Build output is generated in `frontend/dist/`.
