# Comprehensive PostgreSQL & Relational Database Technical Guide
### Site Operations Management System — Developer & Interview Reference

---

## 1. What PostgreSQL Is
- **Simple Explanation:** PostgreSQL is an open-source, enterprise-grade Object-Relational Database Management System (ORDBMS) known for strict standards compliance, extensibility, and transactional integrity (ACID properties).
- **SQL Example:**
  ```sql
  SELECT version();
  ```
- **How It Is Used in This Project:** PostgreSQL 18 serves as the single source of truth for all persistent operational data (sites, equipment installations, users, and audit timestamps).
- **Interview Talking Point:** "PostgreSQL provides robust ACID guarantees, strong typing, check constraints, and native connection concurrency. We chose PostgreSQL over NoSQL because industrial operations data has structured relationships (sites have multiple installations) requiring strict referential integrity."

---

## 2. PostgreSQL Server
- **Simple Explanation:** The background daemon process (`postgres` or `postmaster`) that manages physical storage on disk, coordinates memory buffers (shared buffers, work memory), listens for TCP/IP network connections (default port 5432), and executes query plans.
- **SQL Example:**
  ```sql
  SELECT inet_server_addr(), inet_server_port();
  ```
- **How It Is Used in This Project:** Runs locally as a service on port `5432`. Node.js connects to this server instance over TCP using socket credentials configured in `DATABASE_URL`.
- **Interview Talking Point:** "The PostgreSQL server handles process-based connection concurrency. Each client connection gets an assigned backend worker process, which is why utilizing a connection pool in Node.js is critical to prevent resource exhaustion."

---

## 3. Database (`site_operations`)
- **Simple Explanation:** A distinct logical namespace and physical container on the PostgreSQL server that holds schemas, tables, views, indexes, and constraints. Databases are isolated from one opened catalog to another.
- **SQL Example:**
  ```sql
  CREATE DATABASE site_operations;
  ```
- **How It Is Used in This Project:** All application tables reside in the dedicated `site_operations` database.
- **Interview Talking Point:** "We create dedicated databases per application environment to isolate access permissions, buffer allocation, and table namespaces."

---

## 4. Tables
- **Simple Explanation:** A 2-dimensional grid of structured data organized into named columns with strictly enforced data types and zero or more rows.
- **SQL Example:**
  ```sql
  CREATE TABLE example (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL
  );
  ```
- **How It Is Used in This Project:** Three core tables: `users`, `sites`, and `installations`.
- **Interview Talking Point:** "Tables enforce schema-on-write, preventing malformed data records from polluting the persistence layer."

---

## 5. Rows (Tuples)
- **Simple Explanation:** A single horizontal record representing an individual entity instance (e.g., one specific site, one technician).
- **SQL Example:**
  ```sql
  SELECT * FROM sites WHERE id = 1;
  ```
- **How It Is Used in This Project:** In Node.js, `result.rows` returns an array of JavaScript objects, where each row maps column names to object keys (`result.rows[0].site_name`).
- **Interview Talking Point:** "PostgreSQL uses Multi-Version Concurrency Control (MVCC). When a row is updated or deleted, PostgreSQL writes a new version of the tuple without locking readers, guaranteeing non-blocking reads."

---

## 6. Columns (Attributes) & Data Types
- **Simple Explanation:** Vertical fields defining the specific data format and constraints for every stored value.
- **Common PostgreSQL Types Used in This Project:**
  - `SERIAL`: Auto-incrementing 4-byte integer.
  - `INTEGER`: Standard 32-bit integer for foreign keys.
  - `VARCHAR(n)`: Variable-length character string with an upper boundary.
  - `TEXT`: Variable-length character string with unlimited length (for free-form notes).
  - `DATE`: Calendar date without time (`YYYY-MM-DD`).
  - `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`): Point in time including timezone offset.
- **SQL Example:**
  ```sql
  scheduled_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  ```
- **How It Is Used in This Project:** Strict typing ensures dates cannot contain arbitrary strings, and status strings conform to expected formats.
- **Interview Talking Point:** "Choosing the exact column type (such as `DATE` for scheduling and `TEXT` for notes) reduces memory footprint and enables native PostgreSQL date arithmetic."

---

## 7. Primary Key (PK) & `SERIAL`
- **Simple Explanation:** A primary key is a column (or set of columns) that uniquely identifies each row in a table. PostgreSQL automatically creates a unique B-Tree index on it and enforces `NOT NULL`. `SERIAL` creates an auto-incrementing integer sequence behind the scenes.
- **SQL Example:**
  ```sql
  id SERIAL PRIMARY KEY
  ```
- **How It Is Used in This Project:** Every table (`users`, `sites`, `installations`) uses `id SERIAL PRIMARY KEY` as a surrogate key.
- **Interview Talking Point:** "A surrogate primary key (`SERIAL`) ensures that business changes (such as renaming a site code) do not break relational keys across other tables."

---

## 8. Foreign Key (FK) & Referential Integrity
- **Simple Explanation:** A column in a child table that references the primary key of a parent table, guaranteeing that child rows can only point to existing parent rows.
- **SQL Example:**
  ```sql
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE
  ```
- **How It Is Used in This Project:** `installations.site_id` references `sites.id`. If an API client attempts to create an installation with `site_id: 99999`, PostgreSQL rejects the insert with error code `23503` (foreign key violation).
- **Interview Talking Point:** "Referential integrity guarantees that orphan records cannot exist in our database. We map PostgreSQL's error code `23503` directly to an HTTP 400 Bad Request response with the message 'Site does not exist'."

---

## 9. One-to-Many (1:N) Relationship
- **Simple Explanation:** An association where one record in Table A can be linked to zero, one, or multiple records in Table B, but each record in Table B links back to exactly one record in Table A.
- **Diagram:**
  ```
  sites (1) ────< (N) installations
  ```
- **How It Is Used in This Project:** One physical site (e.g., "Alpha Solar Array") can have multiple equipment installations (e.g., Inverter, Weather Station, Battery Rack).
- **Interview Talking Point:** "In a one-to-many relationship, the foreign key always lives on the 'many' side (`installations.site_id`). This normalizes the data and prevents repetitive site data storage."

---

## 10. Core Tables Architecture

### `users` Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'technician',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
- Holds administrators, managers, and field technicians. The `UNIQUE` constraint on `email` prevents duplicate registrations.

### `sites` Table
```sql
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    site_code VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    client_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
- Holds work locations. `site_code` is unique (e.g., `SITE-101`), and status defaults to `ACTIVE`.

### `installations` Table
```sql
CREATE TABLE installations (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    installation_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_date DATE,
    completion_date DATE,
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
- Represents hardware work orders. Tied to `sites` via `site_id`.

---

## 11. CRUD Operations Overview
- **C - Create:** `INSERT INTO table (...) VALUES (...) RETURNING *`
- **R - Read:** `SELECT columns FROM table WHERE condition`
- **U - Update:** `UPDATE table SET column = val WHERE id = $1 RETURNING *`
- **D - Delete:** `DELETE FROM table WHERE id = $1 RETURNING *`
- **`RETURNING *` Clause:** PostgreSQL extension that returns the modified row without needing a second `SELECT` query, cutting database round trips in half.

---

## 12. `INSERT` Statements & `RETURNING *`
- **SQL Example:**
  ```sql
  INSERT INTO users (name, email, role)
  VALUES ($1, $2, $3)
  RETURNING *;
  ```
- **How It Is Used in This Project:** Used in all POST endpoints (`userController.js`, `siteController.js`, `installationController.js`).
- **Interview Talking Point:** "`RETURNING *` is a powerful PostgreSQL feature. In standard MySQL or older databases, you often have to insert and then query `LAST_INSERT_ID()`. PostgreSQL returns the newly created record with its generated primary key and default timestamps in a single atomic transaction."

---

## 13. `SELECT` Queries & Field Projection
- **SQL Example:**
  ```sql
  SELECT id, site_code, site_name, city, status FROM sites ORDER BY id ASC;
  ```
- **How It Is Used in This Project:** Used across GET endpoints to retrieve records in a predictable order.
- **Interview Talking Point:** "Always specify an `ORDER BY` clause when querying collections. Without `ORDER BY`, relational databases return rows in arbitrary physical disk order, leading to unpredictable UI ordering."

---

## 14. `WHERE` Clauses & Filtering
- **SQL Example:**
  ```sql
  SELECT * FROM sites WHERE status = $1 AND city = $2;
  ```
- **How It Is Used in This Project:** Used for finding records by ID (`WHERE id = $1`) or searching dynamic fields.
- **Interview Talking Point:** "The `WHERE` clause filters rows before they are processed by aggregate functions or returned to the client. Indexed columns in the `WHERE` clause allow the query planner to perform index scans instead of slow sequential table scans."

---

## 15. `UPDATE` Statements
- **SQL Example:**
  ```sql
  UPDATE sites
  SET site_name = $1, status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $3
  RETURNING *;
  ```
- **How It Is Used in This Project:** Used in PUT endpoints. Explicitly sets `updated_at = CURRENT_TIMESTAMP` to track record lifecycle changes.
- **Interview Talking Point:** "We check `result.rows.length === 0` after an `UPDATE`. If 0 rows were affected, we know the resource ID does not exist and immediately return HTTP 404 Not Found."

---

## 16. `DELETE` Statements
- **SQL Example:**
  ```sql
  DELETE FROM sites WHERE id = $1 RETURNING *;
  ```
- **How It Is Used in This Project:** Used in DELETE endpoints.
- **Interview Talking Point:** "By appending `RETURNING *` to a `DELETE` statement, we verify that the record actually existed before returning success, while simultaneously capturing the deleted data if needed for audit logging."

---

## 17. `JOIN` (INNER vs LEFT JOIN)
- **Simple Explanation:** Combining columns from two or more tables based on a related column between them.
  - `INNER JOIN`: Returns rows only when there is a match in both tables.
  - `LEFT JOIN`: Returns all rows from the left table, and the matched rows from the right table (filling with `NULL` if no match exists).
- **SQL Example (from `installationController.js`):**
  ```sql
  SELECT
      i.*,
      s.site_name,
      s.site_code,
      s.city AS site_city
  FROM installations i
  LEFT JOIN sites s ON i.site_id = s.id
  ORDER BY i.id DESC;
  ```
- **How It Is Used in This Project:** When fetching installations, the query joins `sites` so the frontend table displays human-readable site names (`Alpha Solar Array`) rather than just raw numeric IDs (`site_id: 12`).
- **Interview Talking Point:** "We use `LEFT JOIN` on `sites` to enrich installation records with site details in a single query. This avoids the classic 'N+1 query problem' where a backend would fetch 10 installations and then execute 10 separate queries to get each site's name."

---

## 18. `GROUP BY` & Aggregation
- **Simple Explanation:** Groups rows that have the same values in specified columns into summary rows.
- **SQL Example (from `dashboardController.js`):**
  ```sql
  SELECT
      status,
      COUNT(*)::int AS count
  FROM installations
  GROUP BY status;
  ```
- **How It Is Used in This Project:** Used in the Executive Dashboard to compute distribution metrics: how many installations are `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`.
- **Interview Talking Point:** "Rather than fetching all 10,000 installation rows into Node.js memory and looping with JavaScript `Array.reduce()`, we push the computation down to PostgreSQL's query engine using `GROUP BY`. This optimizes database bandwidth and CPU usage."

---

## 19. Aggregate Functions (`COUNT`, `SUM`, `AVG`, `COALESCE`)
- **Simple Explanation:** Functions that calculate a single scalar value from a set of values.
- **SQL Example:**
  ```sql
  SELECT
      COUNT(*)::int AS total_sites,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_sites
  FROM sites;
  ```
- **How It Is Used in This Project:** The dashboard query uses `COUNT(*)` to calculate system KPIs in sub-millisecond execution time.
- **Interview Talking Point:** "PostgreSQL returns `COUNT` as a 64-bit BigInt string in Node.js to prevent JavaScript 53-bit integer overflow. We explicitly cast `COUNT(*)::int` in SQL so the `pg` driver translates it directly into a native JavaScript number."

---

## 20. `LIMIT` and `OFFSET` (Pagination)
- **Simple Explanation:**
  - `LIMIT`: The maximum number of rows to return.
  - `OFFSET`: The number of rows to skip before beginning to return rows.
- **Formula:**
  $$\text{OFFSET} = (\text{page} - 1) \times \text{limit}$$
- **SQL Example:**
  ```sql
  SELECT * FROM sites
  ORDER BY id ASC
  LIMIT $1 OFFSET $2;
  -- Page 1: LIMIT 10 OFFSET 0
  -- Page 2: LIMIT 10 OFFSET 10
  -- Page 3: LIMIT 10 OFFSET 20
  ```
- **How It Is Used in This Project:** Implemented in `siteController.js` and `installationController.js` to deliver performant paged tables to the frontend.
- **Interview Talking Point:** "Offset-based pagination is ideal for web interfaces with page numbers. In our controllers, we validate that `page >= 1` and `1 <= limit <= 100` before running the query, preventing clients from requesting millions of rows."

---

## 21. Pattern Matching with `ILIKE`
- **Simple Explanation:** Case-insensitive pattern matching. `%` matches zero or more characters; `_` matches a single character.
- **SQL Example:**
  ```sql
  SELECT * FROM sites
  WHERE site_name ILIKE $1 OR city ILIKE $1;
  -- Parameter value: '%solar%'
  ```
- **How It Is Used in This Project:** Powers dynamic real-time search across sites (searching site name, code, city, client) and installations (searching installation type, assigned personnel, status).
- **Interview Talking Point:** "Unlike standard SQL `LIKE`, which is strictly case-sensitive, PostgreSQL provides `ILIKE` for case-insensitive matching. In our controllers, we safely bind the wildcard parameter `%${searchTerm}%` using parameterized queries to protect against SQL injection."

---

## 22. Database Indexes & Query Optimization
- **Simple Explanation:** An auxiliary B-Tree data structure maintained on disk that allows the query planner to locate specific rows in $O(\log N)$ time without scanning every block of the physical table ($O(N)$ sequential scan).
- **SQL Example (from `schema.sql`):**
  ```sql
  CREATE INDEX idx_sites_site_code ON sites(site_code);
  CREATE INDEX idx_sites_city ON sites(city);
  CREATE INDEX idx_installations_site_id ON installations(site_id);
  ```
- **How It Is Used in This Project:** Indexes are created on `sites.site_code`, `sites.city`, `sites.status`, `installations.site_id`, and `installations.status`.
- **Interview Talking Point:** "Indexes dramatically speed up `WHERE` filtering and `JOIN` operations. In particular, indexing the foreign key column `installations.site_id` is crucial: when joining `sites` and `installations`, PostgreSQL performs fast index lookups rather than scanning the entire installations table."

---

## 23. Database Normalization (1NF, 2NF, 3NF)
- **Simple Explanation:** The systematic process of structuring relational tables to eliminate data redundancy and prevent update/delete anomalies.
  - **1NF (First Normal Form):** Every cell contains atomic (indivisible) values; each record is unique.
  - **2NF (Second Normal Form):** Must be in 1NF and all non-key attributes are fully functionally dependent on the primary key.
  - **3NF (Third Normal Form):** Must be in 2NF and no transitive dependencies exist (non-key columns do not depend on other non-key columns).
- **How It Is Used in This Project:**
  - Site details (name, city, client) live solely in the `sites` table.
  - `installations` only stores `site_id`, preventing repetitive duplication of client or city names on every installation job.
- **Interview Talking Point:** "Our schema adheres to 3NF. If a site changes its name or address, we update a single row in `sites`. Because `installations` references `site_id`, all installation records immediately reflect the update without risking data inconsistency."

---

## 24. Connection Pooling (`pg.Pool`)
- **Simple Explanation:** Establishing a TCP handshake and PostgreSQL backend authentication process takes significant time (~30–50ms). A connection pool maintains an active pool of open, reusable connections. When an incoming HTTP request arrives, it borrows a connection, executes the query, and returns it to the pool.
- **Architecture Diagram:**
  ```
  Incoming Request 1 ──┐
  Incoming Request 2 ──┼──► [ pg.Pool (5–20 open connections) ] ──► PostgreSQL Engine
  Incoming Request 3 ──┘
  ```
- **Code Example (from `config/db.js`):**
  ```javascript
  import pg from "pg";
  const { Pool } = pg;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  export default pool;
  ```
- **How It Is Used in This Project:** The single `pool` instance is exported from `config/db.js` and imported by all controllers.
- **Interview Talking Point:** "Using a connection pool prevents connection storms. If 500 concurrent HTTP requests hit our API, `pg.Pool` queues the queries across its managed connections rather than spawning 500 distinct OS-level PostgreSQL processes, which would crash server memory."

---

## 25. Parameterized Queries & SQL Injection Prevention
- **Simple Explanation:** Separating SQL code from user-supplied data by using numbered placeholders (`$1`, `$2`). The query string is sent to the database engine first for parsing and compilation; the user values are sent separately as raw data.
- **Dangerous (Vulnerable to SQL Injection):**
  ```javascript
  // NEVER DO THIS:
  pool.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);
  // If attacker passes: ' OR '1'='1'; DROP TABLE users; --
  ```
- **Safe (Parameterized Query):**
  ```javascript
  pool.query(`SELECT * FROM users WHERE email = $1`, [req.body.email]);
  ```
- **How It Is Used in This Project:** 100% of SQL queries across all controllers use parameterized placeholders (`$1`, `$2`, `$3`).
- **Interview Talking Point:** "Parameterized queries eliminate SQL injection because the database engine treats parameters strictly as literal data, never as executable SQL commands. Even if a user enters malicious SQL statements, the engine compares it purely as a literal string."

---

## 26. `ON DELETE CASCADE` Referential Behavior
- **Simple Explanation:** A foreign key constraint rule specifying that when a parent row is deleted, all associated child rows in referencing tables are automatically deleted by the database engine within the same transaction.
- **SQL Example:**
  ```sql
  CONSTRAINT fk_site FOREIGN KEY (site_id)
      REFERENCES sites(id) ON DELETE CASCADE
  ```
- **How It Is Used in This Project:** When a site is deleted (`DELETE FROM sites WHERE id = 1`), all installation records linked to `site_id = 1` are automatically cleaned up.
- **Interview Talking Point:** "`ON DELETE CASCADE` enforces referential integrity at the database level. It eliminates the need for multi-step manual deletion in application code, ensuring zero orphan installation records if a site is decommissioned."

---

## 27. PostgreSQL Specific Error Codes Handled
| Error Code | PostgreSQL Constant | Meaning | Handled In | HTTP Status Returned |
| :--- | :--- | :--- | :--- | :--- |
| **`23505`** | `unique_violation` | Duplicate email or duplicate `site_code` | `userController.js`, `siteController.js` | `409 Conflict` |
| **`23503`** | `foreign_key_violation` | Child references non-existent parent `site_id` | `installationController.js` | `400 Bad Request` |
| **`22P02`** | `invalid_text_representation` | String passed where integer expected (`/api/sites/abc`) | All Controllers | `400 Bad Request` |

- **Interview Talking Point:** "Rather than letting raw PostgreSQL error objects bubble up as generic 500 Internal Server Errors, our controllers inspect `error.code`. We intercept `23505` for unique violations, `23503` for foreign key errors, and `22P02` for malformed IDs, returning descriptive client-friendly HTTP status codes (400, 404, 409)."

---

## 28. Interview Quick Reference Sheet

| Question | Key 30-Second Interview Answer |
| :--- | :--- |
| **Why not use an ORM (Prisma / Sequelize)?** | "ORMs add abstraction layers, hide execution plans, and often produce inefficient queries. In this project, writing raw parameterized SQL gives us full control over query performance, index utilization, and exact transaction semantics, while keeping the application lightweight and interview-transparent." |
| **How do you handle transactions and ACID?** | "PostgreSQL guarantees ACID properties by default. Every single SQL statement is an atomic transaction. For multi-statement operations, we use `BEGIN`, `COMMIT`, and `ROLLBACK` via a client checked out from `pool.connect()`." |
| **How do you prevent SQL injection?** | "By strictly using parameterized queries (`$1`, `$2`). Parameters are sent separately from the SQL statement template and are never evaluated as executable code." |
| **How does connection pooling work?** | "Instead of creating a new TCP connection on every HTTP request, `pg.Pool` maintains a reusable pool of connections. Requests check out a connection, run their query, and immediately release it back to the pool." |
| **How do you scale search and pagination?** | "We validate `limit` and `page` parameters to prevent denial-of-service queries, construct parameterized `ILIKE` wildcard queries, and ensure searched fields like `site_code` have corresponding B-Tree indexes." |
