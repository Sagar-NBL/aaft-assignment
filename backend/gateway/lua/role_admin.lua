-- Admin-only access guard. Used by `/api/admin/*` location.
local jwt_verify = require "jwt_verify"
local payload = jwt_verify.verify_role({ "admin" })
jwt_verify.set_upstream_headers(payload)
