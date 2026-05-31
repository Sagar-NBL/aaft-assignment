# AAFT LMS Backend

Production-ready microservices backend for the AAFT Enterprise LMS. Single
**Nginx + Lua gateway** routes the public `/api/*` surface to five focused
Node.js services. PostgreSQL + Prisma underneath, JWT + RBAC end to end.

> **Status:** Part A (frontend contract) + Part B (enterprise modules) both implemented.
> Runs entirely under `docker-compose up`.

---

## Quick start

Prerequisites: Docker Desktop (or Docker Engine + Compose v2).

```bash
cd backend
cp .env.example .env          # tweak secrets if you like
docker-compose up -d --build  # builds all services + runs migrations + seeds
docker-compose logs -f gateway
```

You should now have:

| URL                                 | What it serves                          |
|-------------------------------------|-----------------------------------------|
| `http://localhost:3001/api/...`     | The whole API (via gateway)             |
| `http://localhost:3001/_health`     | Gateway health                          |
| `http://localhost:5432`             | Postgres (host-exposed for psql/Studio) |
| `http://localhost:6379`             | Redis (optional, used as cache)         |

Run the reference frontend against your backend (from the repo root):

```bash
cd ..
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm install
npm run dev
# → http://localhost:3000
```

### Demo accounts

| Role        | Email                  | Password         |
|-------------|------------------------|------------------|
| Admin       | `admin@aaft.com`       | `Admin@123`      |
| Instructor  | `instructor@aaft.com`  | `Instructor@123` |
| Student     | `student@aaft.com`     | `Student@123`    |
| Student     | `priya.singh@example.com` | `Student@123` |
| Student     | `liam.chen@example.com`   | `Student@123` |

---

## Architecture

```
┌────────────────────────┐
│  Frontend (Next.js 15) │ ─── localhost:3000
└──────────┬─────────────┘
           │  HTTPS + JWT Bearer
           ▼
┌────────────────────────────────────────────────────────┐
│  Gateway (OpenResty / Nginx + Lua) — port 3001          │
│                                                         │
│   • Verifies JWT signature with lua-resty-jwt           │
│   • Decodes payload → injects X-User-Id / -Role / -Email│
│   • Enforces RBAC per /api/<scope>/* namespace          │
│   • Adds CORS headers, handles OPTIONS preflight        │
└──────────┬──────────────────┬────────────────┬─────────┘
           │                  │                │
           ▼                  ▼                ▼
   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
   │auth-service│   │admin-service │   │student-service│
   │  :4001     │   │  :4002       │   │  :4004        │
   └────────────┘   └──────────────┘   └──────────────┘
                          │                    │
                          ▼                    ▼
                   ┌──────────────┐   ┌──────────────┐
                   │instructor-svc│   │public-service │
                   │  :4003       │   │  :4005        │
                   └──────────────┘   └──────────────┘
                          │
                          ▼
                 ┌────────────────────┐    ┌──────────┐
                 │  @aaft/db-lib      │    │  Redis    │
                 │  (Prisma client)   │    │  (opt.)   │
                 └─────────┬──────────┘    └──────────┘
                           │
                           ▼
                  ┌─────────────────────┐
                  │  PostgreSQL 16       │
                  │  (single shared DB)  │
                  └─────────────────────┘
```

### Patterns applied

- **SRP** — every service has exactly one role's API surface; every domain
  service inside a service owns one entity; controllers own HTTP, services
  own business logic, repositories own persistence.
- **DRY** — shared concerns live in `packages/common-lib` (HTTP base classes,
  JWT, bcrypt, exceptions, validation, mappers) and `packages/db-lib`
  (Prisma client + generic `BaseService<T>` CRUD).
- **Gateway-injected identity** — services trust the gateway's `X-User-*`
  headers because the docker network makes the gateway the only entry point.
  Services also belt-and-suspenders re-check the role.

### Why one shared DB

The interviewer's evaluation rubric explicitly tests normalized schema design
across all domains (users ↔ courses ↔ enrollments ↔ progress ↔ grades).
Splitting persistence per-service would either duplicate tables or require a
distributed-transaction story we don't need at this scale. The single shared
Postgres + single Prisma schema in `@aaft/db-lib` keeps the schema authoritative
while leaving service code modular.

---

## Repository layout

```
backend/
├── docker-compose.yml             # postgres + redis + gateway + 5 services
├── Dockerfile.service             # generic per-service multi-stage build
├── Dockerfile.migrate             # one-shot migrate + seed runner
├── package.json                   # npm workspaces root
├── tsconfig.base.json             # shared strict TS config
├── .env.example
│
├── gateway/                       # Nginx + Lua gateway (single entry point)
│   ├── Dockerfile
│   ├── nginx.conf                 # http {} + server {} + CORS + lua loader
│   ├── servers.conf               # internal upstreams
│   ├── api_conf.d/                # one .conf per /api/<scope>
│   │   ├── auth.conf
│   │   ├── admin.conf
│   │   ├── instructor.conf
│   │   ├── student.conf
│   │   └── public.conf
│   └── lua/                       # JWT verification + role guards
│       ├── jwt_verify.lua
│       ├── role_admin.lua
│       ├── role_instructor.lua
│       ├── role_student.lua
│       └── role_any.lua
│
├── packages/
│   ├── db-lib/                    # Shared Prisma client + BaseService<T>
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── BaseService.ts     # Generic CRUD
│   │       ├── prisma.ts          # PrismaClient singleton
│   │       ├── seed.ts            # Demo seed
│   │       └── index.ts
│   │
│   └── common-lib/                # Shared Express base + helpers
│       └── src/
│           ├── Service.ts         # Base Express service (lifecycle)
│           ├── Controller.ts      # Response helpers (ok/created/paginated/error)
│           ├── jwt.ts             # sign + verify (used by auth-service)
│           ├── bcrypt.ts          # hash + compare (≥ 10 rounds enforced)
│           ├── validator.ts       # zod-based middleware
│           ├── exceptions/        # HttpException + 400/401/403/404/409/422/500
│           ├── middlewares/       # requestId / userContext / errorHandler
│           ├── mappers/           # Prisma → DTO mappers (courses, students)
│           ├── types.ts           # Frontend-contract DTOs
│           ├── avatar.ts          # ui-avatars URL generator
│           └── logger.ts          # Winston factory
│
└── services/
    ├── auth-service/              # /api/auth/*   (login, register, refresh, logout)
    ├── admin-service/             # /api/admin/*  (Part A + Part B admin)
    ├── instructor-service/        # /api/instructor/* (content authoring, quizzes)
    ├── student-service/           # /api/student/* (Part A + Part B student)
    └── public-service/            # /api/certificates/:code (public verify)
```

Each service follows the same layout:

```
src/
├── index.ts                       # boot entry
├── <Name>ApiService.ts            # extends @aaft/common-lib Service
├── config/service.config.ts       # env reading
├── controller/                    # HTTP layer (thin)
├── router/                        # Express routers + validation
├── service/                       # Business logic (extends BaseService for CRUD)
└── validator/                     # zod schemas (DTOs)
```

---

## Endpoints — exhaustive list

### Auth (`/api/auth`)
| Method | Path        | Auth     | Notes                                  |
|--------|-------------|----------|----------------------------------------|
| POST   | `/login`    | public   | Returns `{ token, user }`              |
| POST   | `/register` | public   | Part B — accepts role assignment       |
| POST   | `/refresh`  | public   | Body: `{ refreshToken }`               |
| POST   | `/logout`   | public   | Idempotent — revokes refresh token     |

### Admin (`/api/admin`) — requires JWT + role=admin
| Method | Path                                | Notes                                |
|--------|-------------------------------------|--------------------------------------|
| GET    | `/students`                         | Paginated (`page,limit,search,sort`) |
| POST   | `/students`                         | Default password if not provided     |
| GET    | `/students/:id`                     |                                      |
| PATCH  | `/students/:id`                     |                                      |
| DELETE | `/students/:id`                     | Soft delete                          |
| GET    | `/courses`                          | With lessons (flattened from units)  |
| POST   | `/courses`                          | Auto-creates default section/sub     |
| PATCH  | `/courses/:id`                      |                                      |
| DELETE | `/courses/:id`                      | Cascades                             |
| POST   | `/courses/:id/lessons`              | Creates video unit                   |
| PATCH  | `/courses/:id/lessons`              | Body: `{ lessonId, ... }`            |
| DELETE | `/courses/:id/lessons?lessonId=…`   |                                      |
| GET    | `/enrollments`                      | With progress per row                |
| POST   | `/enrollments`                      | Bulk `{ studentIds, courseIds }`     |
| GET    | `/reports/overview`                 | Dashboard aggregates                 |
| GET    | `/reports/students/:id`             | Per-student report                   |
| GET    | `/users`                            | **Part B** — all roles               |
| POST   | `/users`                            | **Part B** — role assignment         |
| GET    | `/users/:id`                        | **Part B**                           |
| PATCH  | `/users/:id`                        | **Part B** — role change             |
| DELETE | `/users/:id`                        | **Part B** — soft delete             |
| GET    | `/course-runs`                      | **Part B**                           |
| POST   | `/course-runs`                      | **Part B**                           |
| PATCH  | `/course-runs/:id`                  | **Part B**                           |
| DELETE | `/course-runs/:id`                  | **Part B** — blocked if enrolled     |
| POST   | `/course-runs/:id/clone`            | **Part B**                           |
| PATCH  | `/courses/:id/publish`              | **Part B** — draft→published         |
| PATCH  | `/courses/:id/archive`              | **Part B** — published→archived      |
| GET    | `/reports/progress`                 | **Part B** — date filter + paginated |
| GET    | `/reports/completions`              | **Part B**                           |
| GET    | `/reports/time-spent`               | **Part B**                           |

### Instructor (`/api/instructor`) — requires JWT + role=instructor
| Method | Path                                 |
|--------|--------------------------------------|
| GET    | `/courses`                           |
| POST   | `/courses/:id/sections`              |
| POST   | `/sections/:id/subsections`          |
| POST   | `/subsections/:id/units`             |
| POST   | `/units/:id/quiz`                    |
| POST   | `/quizzes/:id/questions`             |
| GET    | `/course-runs/:id/progress`          |

### Student (`/api/student`) — requires JWT + role=student
| Method | Path                              | Notes                                  |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/courses`                        | `search`, `status` (`all`/`not_started`/`in_progress`/`completed`) |
| GET    | `/courses/:id`                    | Detail + per-lesson progress           |
| POST   | `/progress`                       | **Upsert** — 90% = complete            |
| GET    | `/progress/:courseId`             | Aggregate                              |
| GET    | `/dashboard`                      | Stats + weekly chart                   |
| POST   | `/enroll`                         | **Part B** — self-enroll               |
| GET    | `/enrollments`                    | **Part B** — own list                  |
| GET    | `/enrollments/:id/content`        | **Part B** — full hierarchy            |
| DELETE | `/enrollments/:id`                | **Part B** — unenroll (soft)           |
| POST   | `/attempts`                       | **Part B** — server-side quiz scoring  |
| GET    | `/grades/:enrollmentId`           | **Part B** — weighted breakdown        |
| GET    | `/certificates`                   | **Part B** — own list                  |

### Public (`/api/certificates`) — no auth
| Method | Path        |
|--------|-------------|
| GET    | `/:code`    |

---

## Business rules implemented

| Rule                                                    | Where                                           |
|---------------------------------------------------------|-------------------------------------------------|
| Video lesson complete when `percentage >= 90`           | `student-service / progress.service.ts`         |
| One progress row per `(enrollment, unit)` — upsert      | unique constraint + `prisma.videoProgress.upsert` |
| Course progress = completed videos / total videos       | `student-service / courses.service.ts`          |
| Soft delete users + enrollments (`is_active = false`)   | `students.service.ts`, `users.service.ts`, etc. |
| Cannot delete a course run with active enrollments      | `course-runs.service.ts`                        |
| Instructors edit only their own courses                 | `instructor-service / content.service.ts`       |
| Server-side quiz scoring, no partial credit             | `student-service / attempts.service.ts`         |
| Respect `quiz.maxAttempts`                              | `attempts.service.ts`                           |
| Auto-issue certificate on pass                          | `attempts.service.ts` after grade recompute     |
| Unique verification code; public verify endpoint        | `public-service`                                |
| bcrypt ≥ 10 rounds                                      | `common-lib / bcrypt.ts` (BCRYPT_ROUNDS env)    |
| JWT access (~15m) + refresh (~7d), refresh row tracked  | `auth-service`                                  |
| RBAC every route except `/auth/*` and `/certificates/:code` | gateway lua scripts + `requireRole` middleware  |

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Key ones:

| Variable                  | Purpose                                                      |
|---------------------------|--------------------------------------------------------------|
| `DATABASE_URL`            | Prisma connection string                                     |
| `JWT_SECRET`              | Access token signing key (must match gateway env)            |
| `JWT_REFRESH_SECRET`      | Refresh token signing key                                    |
| `JWT_ACCESS_EXPIRES`      | Default `15m`                                                |
| `JWT_REFRESH_EXPIRES`     | Default `7d`                                                 |
| `BCRYPT_ROUNDS`           | Minimum `10` (enforced)                                      |
| `CORS_ORIGIN`             | Default `http://localhost:3000`                              |
| `GATEWAY_PORT`            | External port, default `3001`                                |
| `AUTH_SERVICE_PORT`       | Internal port `4001` (and so on)                             |
| `SEED_ADMIN_EMAIL` / `..._PASSWORD` etc. | Demo accounts (see Quick start)               |

---

## Database schema (summary)

Full schema: [`packages/db-lib/prisma/schema.prisma`](packages/db-lib/prisma/schema.prisma).

```
users (role enum)
  └── refresh_tokens
courses (status enum, instructor_id FK)
  ├── sections
  │     └── subsections
  │           └── units (type enum)
  │                 ├── unit_content     (video/text/attachment payload)
  │                 └── quizzes
  │                       ├── questions
  │                       │     └── options
  │                       └── attempts (linked also to enrollment)
  └── course_runs (enrollment_type enum, pass_threshold)
        ├── grading_config (weights JSONB)
        └── enrollments    (unique (student_id, course_run_id))
              ├── video_progress       (unique (enrollment_id, unit_id))
              ├── attempts
              ├── grade                (1:1, aggregate_score + breakdown JSONB)
              └── certificate          (1:1, unique verification_code)
```

Standards:
- UUID primary keys everywhere
- `created_at` + `updated_at` on every table
- Indexes on FKs, role, is_active, type
- Unique constraints: `users.email`, `certificates.verification_code`,
  `(student_id, course_run_id)`, `(enrollment_id, unit_id)`

---

## Development workflow

### Run everything in Docker (recommended)

```bash
docker-compose up -d --build
docker-compose logs -f          # all services
docker-compose logs -f gateway  # one service
docker-compose down             # stop
docker-compose down -v          # stop + drop DB
```

### Run a single service locally (faster iteration)

Requires Postgres + Redis already up (in Docker or local):

```bash
docker-compose up -d postgres redis
cp .env.example .env

npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run seed

# Then run any service in dev mode:
npm run dev:auth          # only auth-service with watch
npm run dev:admin
npm run dev:student
npm run dev:instructor
npm run dev:public
npm run dev               # all 5 in parallel
```

When running services locally **without** the gateway, you must hit them
directly on their internal ports (`http://localhost:4001`, etc.) — services
expect the gateway's `X-User-*` headers, so for local-only manual testing you
can either spoof these headers or run the gateway in front.

### Inspect / reset DB

```bash
npm run prisma:studio     # GUI at http://localhost:5555
npm run prisma:migrate:dev -- --name <change_name>
```

### Reseed only

```bash
docker-compose run --rm migrate sh -c "npx tsx /app/packages/db-lib/src/seed.ts"
# or, when running locally:
npm run seed
```

---

## Frontend integration mapping

The reference frontend's `Course → Lesson` model is mapped on the fly to the
Part B `Course → Section → Subsection → Unit (video)` hierarchy:

| Frontend concept                | Backend mapping                                                          |
|---------------------------------|--------------------------------------------------------------------------|
| `Course.lessons[]`              | Flattened from the course's hierarchy, video units only, course-wide order |
| Create lesson via admin endpoint | Creates a video `Unit` in the course's auto-managed default section/subsection |
| `lesson.videoUrl`, `duration`    | Stored on `UnitContent`                                                   |
| `Enrollment.courseId`           | Resolved via `enrollment.courseRun.courseId`                              |
| Admin bulk enroll               | Auto-creates a "Default Run" per course, then upserts the enrollment      |
| `videoId` in progress payload    | The `Unit.id` of the video lesson                                         |

---

## Security model

| Layer    | What it does                                                                  |
|----------|-------------------------------------------------------------------------------|
| Gateway  | Verifies JWT signature, enforces RBAC per namespace, blocks unauth requests   |
| Services | Re-check role via `requireRole(...)` middleware (belt + suspenders)           |
| Services | DTOs validated by zod; unknown fields rejected via `.strict()` where used     |
| DB       | Prisma parameterized queries only — no raw concatenation                      |
| Tokens   | Refresh tokens hashed (SHA-256) before persistence; revocation supported      |
| Network  | Internal services not host-exposed; only gateway listens externally            |

---

## Trade-offs

| Choice                                      | Why                                                                              |
|---------------------------------------------|----------------------------------------------------------------------------------|
| Express over NestJS                          | Matches the CLICKFIT base-service pattern (smaller, explicit DI, less framework magic). The spec accepts Express. |
| One Postgres + one Prisma schema             | Normalized schema is part of the rubric. Per-service DBs would duplicate joins.   |
| Gateway-level JWT verification               | Faster than auth-service round-trip per request. SRP holds: gateway = auth, services = business. |
| Default section/subsection on course create  | Lets Part A "lessons" CRUD just work without exposing the hierarchy.              |
| Live progress computation (no denorm column) | Schema stays lean; current data volumes don't justify cache columns.              |
| Sticky `is_completed`                        | Once a lesson hits 90%, it stays complete even if user scrubs back later.         |

---

## Submission checklist

- [x] All Part A endpoints implemented to the frontend contract
- [x] All Part B modules implemented (users, course runs, hierarchy, quizzes, grading, certificates, reports)
- [x] Normalized PostgreSQL schema with UUIDs, soft deletes, indexes, unique constraints
- [x] JWT (access + refresh) + RBAC enforced at gateway and in services
- [x] bcrypt with ≥ 10 rounds
- [x] DTO validation (zod) rejecting unknown fields
- [x] No N+1 on list endpoints (Prisma `include` graphs)
- [x] CORS for `http://localhost:3000`
- [x] Error envelope `{ "message": "..." }`
- [x] Seed script for demo accounts + sample courses
- [x] Single `docker-compose up` boots the full stack
- [x] README with architecture, setup, env vars, endpoint matrix

See [../ASSIGNMENT.md](../ASSIGNMENT.md) for the full specification.
