-- Generic authenticated guard. Verifies the JWT and forwards user headers, but
-- does NOT enforce a specific role. Use for endpoints accessible to any
-- logged-in user (e.g. /api/auth/logout, /api/auth/refresh).
local jwt_verify = require "jwt_verify"
local payload = jwt_verify.verify()
jwt_verify.set_upstream_headers(payload)
