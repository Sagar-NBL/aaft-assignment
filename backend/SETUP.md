# AAFT LMS Backend — Setup & Run Guide

I have set it up using docker, you only need to have docker in your machine, single gateway exposed to the Frontend rest will be internal services routed by the gateway itself, Sorry I didn't used NEST JS as I am not hands-on with it right now but I assure you that I can work with NEST also.

---

## What you're running

A microservices backend for the AAFT Learning Management System:

- **Gateway** (Nginx + Lua) on port **3001** — the single public entry point. It
  verifies JWTs, enforces role-based access (RBAC), and routes to the services.
- **5 internal Node.js services** (auth, admin, instructor, student, public) —
  not exposed to the host; only reachable through the gateway.
- **PostgreSQL 16** (port 5432) — single shared, normalized database.
- **Redis 7** (port 6379) — optional cache.

A one-shot **migrate** container creates the database tables and seeds demo data,
then exits — this is normal.

---

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2). Nothing else.

---

## Step-by-step

### 1. Open a terminal in the `backend` folder
```bash
cd aaft-assignment-backend-main/backend
```

### 2. Create the environment file
```bash
cp .env.example .env
```
All default values are ready to use — no changes required to run locally.

### 3. Build and start the full stack (one command)
```bash
docker-compose up -d --build
```
The first run takes ~3–5 minutes (it builds images, creates DB tables, and seeds
demo data). This automatically starts Postgres + Redis, runs the migrate/seed
container, then brings up the 5 services and the gateway in the correct order.

### 4. Confirm everything is up
```bash
docker-compose ps
```
All services should show `running`. The `aaft-migrate` container should show
`exited (0)` — it runs once and stops on purpose.

### 5. Health check
```bash
curl http://localhost:3001/_health
```
A successful response means the backend is live.

### 6. Import the Postman collection
1. Open Postman → **Import** → select `backend/aaft-lms.postman_collection.json`.
2. The `baseUrl` variable is preset to `http://localhost:3001/api` — no change needed.

### 7. Test the APIs (log in first)
1. Run **Auth → Login (Admin)**. The login request automatically saves the JWT
   into a collection variable — you do **not** need to copy/paste the token.
2. Now run any request under the **Admin** folder (e.g. *List students*,
   *List courses*) — the token is applied automatically.
3. For student APIs run **Login (Student)** first; for instructor APIs run
   **Login (Instructor)** first, then use the matching folder.

---

## Demo accounts

| Role        | Email                  | Password         |
|-------------|------------------------|------------------|
| Admin       | `admin@aaft.com`       | `Admin@123`      |
| Instructor  | `instructor@aaft.com`  | `Instructor@123` |
| Student     | `student@aaft.com`     | `Student@123`    |
| Student     | `priya.singh@example.com` | `Student@123` |
| Student     | `liam.chen@example.com`   | `Student@123` |

---

## Useful commands

| Action                        | Command                              |
|-------------------------------|--------------------------------------|
| View all logs                 | `docker-compose logs -f`             |
| View gateway logs only        | `docker-compose logs -f gateway`     |
| Stop the stack                | `docker-compose down`                |
| Stop and wipe the database    | `docker-compose down -v`             |
| Rebuild from scratch          | `docker-compose down && docker-compose up -d --build` |
| Re-run the seed only          | `docker-compose run --rm migrate sh -c "npx tsx /app/packages/db-lib/src/seed.ts"` |

---

## Endpoints at a glance

| Scope        | Base path             | Auth                    |
|--------------|-----------------------|-------------------------|
| Auth         | `/api/auth/*`         | public                  |
| Admin        | `/api/admin/*`        | JWT + role=admin        |
| Instructor   | `/api/instructor/*`   | JWT + role=instructor   |
| Student      | `/api/student/*`      | JWT + role=student      |
| Public       | `/api/certificates/:code` | none                |

The full endpoint matrix is in [README.md](README.md#endpoints--exhaustive-list).

---

## (Optional) Run the reference frontend

From the repository root (one level up from `backend`):
```bash
cd ..
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm install
npm run dev
# → http://localhost:3000
```

---

## Troubleshooting

- **Port already in use (3001 / 5432 / 6379):** stop the conflicting process, or
  change the port values in `.env`, then re-run step 3.
- **Services restarting / can't reach DB:** wait for the `aaft-migrate` container
  to finish (`docker-compose ps`); services start only after migrate completes.
- **Need a clean slate:** `docker-compose down -v` then `docker-compose up -d --build`.
