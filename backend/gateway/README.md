# AAFT LMS — API Gateway

OpenResty (Nginx + LuaJIT) gateway. **Sole entry point** for the frontend.

## Responsibilities

1. **TLS-friendly reverse proxy** — terminates inbound HTTP, forwards to internal services.
2. **JWT verification** — signature check via `lua-resty-jwt`. Decoded payload → `X-User-*` headers.
3. **RBAC** — per-namespace role guards (admin / instructor / student).
4. **CORS** — adds `Access-Control-*` headers and handles OPTIONS preflight.
5. **Request-ID propagation** — generates `X-Request-Id` for log correlation.

## Routing matrix

| Public URL prefix         | Upstream            | Auth required    |
|---------------------------|---------------------|------------------|
| `/api/auth/*`             | `auth-service:4001` | none             |
| `/api/admin/*`            | `admin-service:4002`| JWT + admin      |
| `/api/instructor/*`       | `instructor-service:4003` | JWT + instructor |
| `/api/student/*`          | `student-service:4004` | JWT + student |
| `/api/certificates/*`     | `public-service:4005` | none           |
| `/_health`                | (handled inline)    | none             |

## Files

```
gateway/
├── Dockerfile             # openresty + lua-resty-jwt
├── nginx.conf             # http {} + server {} + global CORS + lua_package_path
├── servers.conf           # upstream definitions
├── api_conf.d/            # one location {} per /api/<scope>
│   ├── auth.conf
│   ├── admin.conf
│   ├── instructor.conf
│   ├── student.conf
│   └── public.conf
└── lua/                   # JWT verification scripts
    ├── jwt_verify.lua     # shared module — verify(), verify_role(), set_upstream_headers()
    ├── role_admin.lua     # used by access_by_lua_file in admin.conf
    ├── role_instructor.lua
    ├── role_student.lua
    └── role_any.lua       # authenticated, no specific role
```

## Trust model

The gateway is the **only ingress**. Internal services (`auth-service`, `admin-service`, ...) are
not published to the host — they live on the `aaft-net` docker network and accept the
`X-User-*` headers as the source of truth for the caller's identity, because only the
gateway can reach them.
