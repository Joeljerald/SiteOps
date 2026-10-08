# Site Operations Management System (SiteOps ERP)

A full-stack, enterprise-grade web application engineered for managing distributed industrial field sites, hardware installation work orders, and field operations personnel. Built with **React 18**, **Express 5**, and **PostgreSQL 18**, utilizing a direct, high-performance architecture with raw parameterized SQL—completely eliminating ORM abstraction for optimal transparency, execution speed, and interview explainability.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Database Design & Schema](#database-design--schema)
5. [Tech Stack & Engineering Rationale](#tech-stack--engineering-rationale)
6. [Project Structure](#project-structure)
7. [Getting Started (Step-by-Step)](#getting-started-step-by-step)
   - [Prerequisites](#prerequisites)
   - [Database Setup](#1-database-setup)
   - [Backend Configuration](#2-backend-configuration)
   - [Frontend Configuration](#3-frontend-configuration)
8. [API Reference & Endpoint Guide](#api-reference--endpoint-guide)
9. [Error Handling & Security Standards](#error-handling--security-standards)
10. [Technical Interview Talking Points](#technical-interview-talking-points)

---

## Project Overview

In industrial field operations (such as renewable energy plants, telecom infrastructure, and utility networks), managing physical locations, scheduling equipment deployments, and coordinating technicians across various states requires strict referential integrity, real-time KPI visibility, and reliable data synchronization.

The **Site Operations Management System** solves these operational challenges by providing:
- **Centralized Site Registry**: Complete lifecycle tracking of physical operational locations across active, inactive, and maintenance states.
- **Work Order & Installation Scheduling**: Structured tracking of equipment deployments linked directly to host facilities with automated status workflows (`SCHEDULED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`).
- **Personnel Directory & Access Roles**: Role-based tracking of team members (`Administrator`, `Manager`, `Technician`, `Operator`).
- **Executive Operations Dashboard**: Real-time aggregated metrics, workload distribution across facilities, and progress breakdown calculated dynamically at the database level.

---

## Key Features

### 1. Executive Operations Dashboard
- **Dynamic KPI Metrics**: Immediate visibility into Total Sites, Total Work Orders, Completed Deployments, Work-in-Progress backlog, and Registered Personnel.
- **Relational Status Breakdown**: Horizontal progress meters displaying exact counts and calculated fulfillment percentages for each work order state.
- **Site Workload Distribution**: Aggregated workload overview showing job density per operational facility using SQL `LEFT JOIN` queries.
- **Recent Installation Activity**: Live feed displaying the latest 5 work orders cross-referenced with site metadata.

### 2. Operational Sites Management
- **Full CRUD Capabilities**: Create, view, edit, and safely delete site facilities.
- **Conflict Prevention**: Automatic enforcement of unique site codes (e.g., `SITE101`, `SOLAR-04`) with HTTP 409 conflict handling.
- **Multi-Field Server Search**: Real-time server-side search across site code, site name, client name, city, and state.
- **Server-Side Pagination**: High-efficiency paginated queries with customizable page sizes, record counting, and ellipsis page jumping.

### 3. Installation Work Orders
- **Relational Integrity**: Every installation is strictly associated with a parent site via foreign key constraints (`site_id REFERENCES sites(id) ON DELETE CASCADE`).
- **Status & Milestone Tracking**: Explicit scheduling dates, completion timestamps, and technical notes.
- **Lead Technician Assignment**: Field personnel assignment tracking per work order.
- **Server-Side Filtering**: Query work orders by equipment type, technician name, notes, or execution status.

### 4. Personnel Directory
- **Team Management**: Register administrators, project managers, field engineers, and operators.
- **Unique Email Constraint**: Immediate duplicate detection with user-friendly form error feedback.
- **Role Badging**: Visual semantic tags categorizing personnel authority and access scope.

### 5. Enterprise-Grade Modern UI/UX
- **Restrained SaaS Design**: Clean, modern-classic aesthetic avoiding artificial gradients or distracting animations.
- **High-Density Modals**: Structured category sections (`SITE INFORMATION`, `LOCATION`, `FACILITY & WORK ORDER`, `SCHEDULE & ASSIGNMENT`, `ACCOUNT DETAILS`) ensuring optimal data entry without vertical scrolling bloat.
- **Accessible & Responsive**: Fully responsive across mobile, tablet, and desktop viewports (320px to 1440px+), complete with keyboard ESC listener, screen reader ARIA tags, and backdrop dismissals.

---

## System Architecture

The application adopts a **Routes → Controllers → PostgreSQL Connection Pool** design pattern. It deliberately avoids heavy Object-Relational Mappers (ORMs like Prisma, Sequelize, or TypeORM) to guarantee raw query execution efficiency, zero hidden N+1 queries, and maximum transparency.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (SPA)                     │
│                React 18 + Vite 6 + Vanilla CSS              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP REST Requests (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express 5 REST API Gateway                  │
│       CORS Middleware | JSON Parser | Route Dispatcher      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Direct Controller Invocation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Controllers                     │
│   • Request Validation & Sanitization                       │
│   • Parameterized SQL Construction ($1, $2, ...)            │
│   • PostgreSQL Error Translation (23505, 23503, 22P02)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ pool.query()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Connection Pool (pg.Pool)                   │
│           Automatic Connection Reuse & Keep-Alive           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ PostgreSQL Protocol (Port 5432)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL 18 Database Engine                │
│    ACID Transactions | Foreign Keys | B-Tree Indexes        │
│                Database: site_operations                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Design & Schema

### Entity-Relationship (ER) Diagram

```
 ┌────────────────────────────────────────┐
 │                 SITES                  │
 ├────────────────────────────────────────┤
 │ id          : SERIAL PRIMARY KEY       │◄────────┐
 │ site_code   : VARCHAR(50) UNIQUE       │         │
 │ site_name   : VARCHAR(150) NOT NULL    │         │ 1 : N
 │ location    : VARCHAR(255)             │         │ (One Site has Many Installations)
 │ city        : VARCHAR(100)             │         │ ON DELETE CASCADE
 │ state       : VARCHAR(100)             │         │
 │ status      : VARCHAR(20) DEFAULT ACT  │         │
 │ client_name : VARCHAR(150)             │         │
 │ created_at  : TIMESTAMP WITH TIME ZONE │         │
 │ updated_at  : TIMESTAMP WITH TIME ZONE │         │
 └────────────────────────────────────────┘         │
                                                    │
 ┌────────────────────────────────────────┐         │
 │             INSTALLATIONS              │         │
 ├────────────────────────────────────────┤         │
 │ id                : SERIAL PRIMARY KEY │         │
 │ site_id           : INTEGER (FK) ──────┼─────────┘
 │ installation_type : VARCHAR(100) NOT N │
 │ status            : VARCHAR(20) DEF SC │
 │ scheduled_date    : DATE               │
 │ completion_date   : DATE               │
 │ assigned_to       : VARCHAR(100)       │
 │ notes             : TEXT               │
 │ created_at        : TIMESTAMPTZ        │
 │ updated_at        : TIMESTAMPTZ        │
 └────────────────────────────────────────┘

 ┌────────────────────────────────────────┐
 │                 USERS                  │
 ├────────────────────────────────────────┤
 │ id         : SERIAL PRIMARY KEY        │
 │ name       : VARCHAR(100) NOT NULL     │
 │ email      : VARCHAR(150) UNIQUE NOT N │
 │ role       : VARCHAR(30) DEFAULT TECH  │
 │ created_at : TIMESTAMP WITH TIME ZONE  │
 │ updated_at : TIMESTAMP WITH TIME ZONE  │
 └────────────────────────────────────────┘
```

### Table Definitions & Constraints
- **Referential Integrity**: `installations.site_id` references `sites.id` with `ON DELETE CASCADE`. If a site is decommissioned and deleted, all associated installation work orders are automatically purged by the database engine within the same atomic transaction.
- **Performance Indexes**:
  - `idx_installations_site_id` (B-Tree): Optimizes relational joins (`JOIN sites ON installations.site_id = sites.id`).
  - `idx_sites_status` and `idx_installations_status` (B-Tree): Accelerates status aggregation and dashboard queries.
  - `idx_sites_search` and `idx_installations_search`: Composite or targeted indexes speeding up multi-column search filters.
- **Audit Timestamps**: Every table includes `created_at` and `updated_at` timestamps using `CURRENT_TIMESTAMP`.

---

## Tech Stack & Engineering Rationale

| Component | Technology | Rationale & Architectural Benefit |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 18 | Strict ACID compliance, reliable foreign key integrity, powerful aggregation functions (`COUNT`, `SUM`, `LEFT JOIN`), and production-grade connection handling. |
| **Database Driver** | `pg` (`node-postgres`) | Direct connection pooling via `pg.Pool`, raw parameterized SQL statements (`$1, $2, ...`), zero overhead, and complete transparency. |
| **Backend Framework** | Node.js + Express 5 | Minimalist REST API architecture with modern ES Modules (`"type": "module"`), non-blocking asynchronous event loop, and lightweight JSON routing. |
| **Frontend Framework** | React 18 | Component-based declarative architecture, hook-driven state management (`useState`, `useEffect`), and zero bloat. |
| **Bundler & Tooling** | Vite 6 | Lightning-fast Hot Module Replacement (HMR) and highly optimized production Rollup builds with zero configuration friction. |
| **API Client** | Native `fetch` API | Standardized HTTP requests wrapped in a centralized service module (`src/services/api.js`), avoiding heavy external libraries like Axios. |
| **Icons & Design** | Lucide React + CSS Tokens | Accessible, lightweight SVG iconography paired with a custom, enterprise-tuned CSS design token system (`index.css`). |

---

## Project Structure

```
site-operations/
├── backend/
│   ├── config/
│   │   └── db.js                      # pg.Pool connection singleton with error hooks
│   ├── controllers/
│   │   ├── dashboardController.js     # SQL aggregate queries for metrics & distributions
│   │   ├── installationController.js  # CRUD, pagination & search logic for installations
│   │   ├── siteController.js          # CRUD, pagination & search logic for sites
│   │   └── userController.js          # CRUD operations for team personnel
│   ├── routes/
│   │   ├── dashboardRoutes.js         # /api/dashboard routes
│   │   ├── installationRoutes.js      # /api/installations routes
│   │   ├── siteRoutes.js              # /api/sites routes
│   │   └── userRoutes.js              # /api/users routes
│   ├── app.js                         # Express app setup, CORS, and JSON middleware
│   ├── server.js                      # Server entry point & PostgreSQL startup verification
│   ├── package.json                   # Backend dependencies (express, pg, cors, dotenv)
│   ├── package-lock.json              # Deterministic backend dependency lockfile
│   ├── .env                           # Environment configuration (git-ignored)
│   ├── .env.example                   # Sanitized template for environment variables
│   └── .gitignore                     # Git ignore rules for backend
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx       # Reusable destructive confirmation modal
│   │   │   ├── Header.jsx             # Minimalist view header with mobile menu trigger
│   │   │   ├── Modal.jsx              # Accessible modal dialog with keyboard navigation
│   │   │   ├── Pagination.jsx         # Accessible pagination control with ellipsis logic
│   │   │   └── Sidebar.jsx            # Dark navy enterprise navigation drawer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx      # KPI statistics, status distribution & site workload
│   │   │   ├── InstallationsPage.jsx  # Work orders table, search toolbar, modal & pagination
│   │   │   ├── SitesPage.jsx          # Site registry table, search toolbar, modal & pagination
│   │   │   └── UsersPage.jsx          # User directory with role management & modal
│   │   ├── services/
│   │   │   └── api.js                 # Centralized native Fetch API REST client
│   │   ├── App.jsx                    # Root component with view routing and mobile backdrop
│   │   ├── index.css                  # Enterprise design system, tokens, and responsive styles
│   │   └── main.jsx                   # React 18 DOM root mount
│   ├── index.html                     # Single-page application HTML entry
│   ├── vite.config.js                 # Vite bundler configuration with React plugin
│   ├── package.json                   # Frontend dependencies (react, react-dom, lucide-react)
│   ├── package-lock.json              # Deterministic frontend dependency lockfile
│   ├── .env                           # Frontend environment configuration (git-ignored)
│   ├── .env.example                   # Sanitized frontend environment template
│   └── .gitignore                     # Git ignore rules for frontend
│
├── database/
│   ├── schema.sql                     # DDL table creation, constraints, and B-Tree indexes
│   └── seed.sql                       # Real-world initial operational seed dataset
│
├── .gitignore                         # Root git ignore rules (node_modules, dist, .env)
├── POSTGRESQL_GUIDE.md                # Comprehensive technical guide for PostgreSQL & DB interviews
└── README.md                          # Project documentation
```

---

## Getting Started (Step-by-Step)

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: v14.0 or higher (v18 recommended; [Download PostgreSQL](https://www.postgresql.org/download/))
- **Git**: [Download Git](https://git-scm.com/)

---

### 1. Database Setup

1. Launch your command terminal and start the PostgreSQL interactive terminal (`psql`) or open **pgAdmin 4**:
   ```bash
   psql -U postgres
   ```

2. Create the dedicated database for the application:
   ```sql
   CREATE DATABASE site_operations;
   ```

3. Connect to the newly created database:
   ```sql
   \c site_operations
   ```

4. Execute the schema definitions to establish tables, constraints, and indexes:
   ```bash
   psql -U postgres -d site_operations -f database/schema.sql
   ```

5. *(Recommended)* Populate the database with initial development seed data:
   ```bash
   psql -U postgres -d site_operations -f database/seed.sql
   ```

6. Confirm the tables are populated:
   ```sql
   SELECT count(*) FROM sites;
   SELECT count(*) FROM installations;
   SELECT count(*) FROM users;
   ```

---

### 2. Backend Configuration

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```

3. Set up the local environment file:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux / macOS / Git Bash:
   cp .env.example .env
   ```

4. Open `.env` in your text editor and verify your PostgreSQL credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/site_operations
   ```

5. Start the backend server:
   ```bash
   # Production / Standard start:
   npm start

   # Development mode (with live reload via nodemon):
   npm run dev
   ```

6. The terminal should report:
   ```
   ==================================================
   Site Operations Management System API
   Server running on http://localhost:5000
   Database connected: site_operations
   ==================================================
   ```

---

### 3. Frontend Configuration

1. Open a separate terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Set up the frontend environment configuration:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux / macOS / Git Bash:
   cp .env.example .env
   ```

4. Confirm that `frontend/.env` points to the running backend port:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. Launch the Vite development server:
   ```bash
   npm run dev
   ```

6. Open your web browser and navigate to the local address displayed (typically `http://localhost:5173` or `http://localhost:3000`).

---

## API Reference & Endpoint Guide

All responses adhere to a consistent standard JSON structure:
- **Success**: `{ success: true, data: [...], pagination?: { ... } }`
- **Error**: `{ success: false, message: "Human-readable explanation of the issue" }`

### System Health
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API health check & server status confirmation | `200 OK` |

---

### Operations Dashboard
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Returns aggregated counts, work order status breakdown, and latest 5 installations | `200 OK` |

**Sample Response (`GET /api/dashboard/summary`)**:
```json
{
  "success": true,
  "data": {
    "totalSites": 2,
    "totalInstallations": 5,
    "completedInstallations": 2,
    "pendingInstallations": 3,
    "totalUsers": 4,
    "installationsByStatus": [
      { "status": "SCHEDULED", "count": 2 },
      { "status": "COMPLETED", "count": 2 },
      { "status": "IN_PROGRESS", "count": 1 }
    ],
    "installationsBySite": [
      { "id": 1, "site_code": "SITE101", "site_name": "Apex Solar Plant", "installation_count": 3 }
    ],
    "recentInstallations": [ ... ]
  }
}
```

---

### Operational Sites (`/api/sites`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sites` | Paginated and searchable site directory (`?page=1&limit=10&search=keyword`) | `200 OK` |
| `GET` | `/api/sites/:id` | Fetch single site details by primary key ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/sites` | Register new site (`site_code`, `site_name`, `status`, `location`, `city`, `state`, `client_name`) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/sites/:id` | Update existing site details | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE` | `/api/sites/:id` | Delete site (cascades to all linked installations) | `200 OK`, `404 Not Found` |

---

### Installation Work Orders (`/api/installations`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/installations` | Paginated & searchable work orders (`?page=1&limit=10&search=keyword`) joined with site metadata | `200 OK` |
| `GET` | `/api/installations/:id` | Fetch single installation details by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/installations` | Create new work order (`site_id`, `installation_type`, `status`, `scheduled_date`, `assigned_to`, `notes`) | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/installations/:id` | Update installation details and milestones | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/installations/:id` | Delete installation record | `200 OK`, `404 Not Found` |

---

### Users Directory (`/api/users`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all system users ordered by `id ASC` | `200 OK` |
| `GET` | `/api/users/:id` | Fetch single user profile by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/users` | Register new user account (`name`, `email`, `role`) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/users/:id` | Update user profile details and role | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE` | `/api/users/:id` | Remove user record | `200 OK`, `404 Not Found` |

---

## Error Handling & Security Standards

### 1. SQL Injection Prevention
All backend SQL queries strictly use **parameterized placeholders** (`$1, $2, $3, ...`). User input is passed as a detached parameter array to `pool.query(sql, params)`, completely disallowing SQL injection attacks. Dynamic queries (such as search filters and pagination offsets) build parameterized arrays programmatically rather than string concatenation.

### 2. Database Error Code Translation
The controllers capture raw PostgreSQL error codes and map them to standard HTTP status codes:
- **`23505` (Unique Violation)**: Translated to **HTTP 409 Conflict** (e.g., duplicate site code or duplicate user email).
- **`23503` (Foreign Key Violation)**: Translated to **HTTP 400 Bad Request** (e.g., attempting to create an installation with an invalid `site_id`).
- **`22P02` (Invalid Text Representation)**: Translated to **HTTP 400 Bad Request** (e.g., passing non-integer strings to an integer ID parameter).

### 3. Connection Pool Management
Database access is handled through a connection pool singleton instantiated via `pg.Pool`. Connections are acquired on-demand and returned to the pool immediately upon query completion, protecting the PostgreSQL server from process exhaustion under concurrent user traffic.

### 4. Production Bundle Verification
The frontend build is validated using Rollup via Vite:
```bash
cd frontend
npm run build
```
This guarantees zero build warnings, zero missing imports, and strict TypeScript/JSX syntax conformity.

---

## Technical Interview Talking Points

When presenting or discussing this architecture in a technical interview, emphasize the following engineering decisions:

1. **Why Raw Parameterized SQL Instead of an ORM?**
   > *"While ORMs like Prisma or Sequelize offer quick scaffolding, they often generate suboptimal SQL, obscure execution plans, and can introduce N+1 query overhead. By writing explicit SQL with `pg.Pool`, we maintain full control over joins, index utilization, and query latency. It also demonstrates deep proficiency in core relational database concepts, connection pooling, and ACID guarantees."*

2. **How Is Referential Integrity Handled?**
   > *"We enforce foreign key integrity at the database engine level using `ON DELETE CASCADE`. When an operational site is deleted, PostgreSQL automatically cleans up all associated installation work orders within a single atomic transaction, preventing orphaned records without requiring messy manual deletion cascades in application code."*

3. **How Does Server-Side Pagination and Search Work?**
   > *"Rather than fetching entire tables into memory and slicing arrays on the client, our controllers run two efficient queries: a count query calculating total matching rows for pagination metadata, and a paginated data query utilizing SQL `LIMIT` and `OFFSET`. Multi-field search utilizes SQL `ILIKE` across indexed columns, keeping response payloads small and predictable even as datasets scale to hundreds of thousands of records."*

4. **Why PostgreSQL Over NoSQL for This Domain?**
   > *"Industrial field operations inherently represent structured, relational entities: sites possess one-to-many relationships with hardware installations, and installations connect to personnel. PostgreSQL guarantees ACID compliance, strict data types, unique constraints, and high-performance relational joins that prevent data inconsistency."*

---

## License

This project is licensed under the **ISC License**. Developed as an interview-ready full-stack engineering showcase.
