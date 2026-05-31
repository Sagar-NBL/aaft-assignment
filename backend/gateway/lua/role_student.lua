-- Student-only access guard. Used by `/api/student/*` location.
local jwt_verify = require "jwt_verify"
local payload = jwt_verify.verify_role({ "student" })
jwt_verify.set_upstream_headers(payload)
