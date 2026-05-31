-- Instructor-only access guard. Used by `/api/instructor/*` location.
local jwt_verify = require "jwt_verify"
local payload = jwt_verify.verify_role({ "instructor" })
jwt_verify.set_upstream_headers(payload)
