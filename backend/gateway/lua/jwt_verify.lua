--[[
  AAFT LMS Gateway — JWT (HS256) verification helper.

  Single responsibility: extract a Bearer token from Authorization header,
  verify its HMAC-SHA256 signature against JWT_SECRET, and either:
    - return the decoded payload on success, or
    - emit a 401 / 403 response and exit.

  Implementation notes:
    - Pure-Lua verifier using OpenResty's built-in `ngx.decode_base64` +
      `cjson.safe` + `resty.hmac` (already installed). We deliberately do
      NOT use `resty.jwt` because that library transitively requires
      `resty.openssl.cipher` (needed only for JWE encryption) which would
      pull in heavy C bindings we don't need.
    - We only support HS256 — that matches what auth-service signs.
]]

local hmac  = require "resty.hmac"
local cjson = require "cjson.safe"

local _M = {}

-- ----------------------------------------------------------------
-- Internal helpers
-- ----------------------------------------------------------------

local function deny(status, message)
    ngx.status = status
    ngx.header.content_type = "application/json"
    ngx.say(cjson.encode({ message = message }))
    return ngx.exit(status)
end

--- Decode a JWT URL-safe base64 segment.
local function b64url_decode(s)
    -- Replace URL-safe chars with the standard ones
    s = (s:gsub('-', '+'):gsub('_', '/'))
    -- Pad to multiple of 4
    local pad = #s % 4
    if pad > 0 then
        s = s .. string.rep('=', 4 - pad)
    end
    return ngx.decode_base64(s)
end

--- Constant-time string compare (best-effort — Lua doesn't expose true
--- constant-time primitives, but this beats early-return shortcuts).
local function ct_equals(a, b)
    if #a ~= #b then return false end
    local diff = 0
    for i = 1, #a do
        diff = bit.bor(diff, bit.bxor(a:byte(i), b:byte(i)))
    end
    return diff == 0
end

-- ----------------------------------------------------------------
-- Public API
-- ----------------------------------------------------------------

--- Extract the Bearer token from the Authorization header.
local function extract_token()
    local auth = ngx.var.http_authorization
    if not auth then return nil end
    local token = auth:match("^[Bb]earer%s+(.+)$")
    if not token or token == "" then return nil end
    return token
end

--- Verify token + return decoded payload, or terminate the request on failure.
function _M.verify()
    local token = extract_token()
    if not token then
        return deny(401, "Missing or malformed Authorization header")
    end

    local secret = os.getenv("JWT_SECRET")
    if not secret or secret == "" then
        ngx.log(ngx.ERR, "JWT_SECRET env not configured")
        return deny(500, "Server misconfiguration")
    end

    local header_b64, payload_b64, sig_b64 =
        token:match("^([^.]+)%.([^.]+)%.([^.]+)$")
    if not header_b64 then
        return deny(401, "Malformed token")
    end

    -- Header check
    local header_str = b64url_decode(header_b64)
    if not header_str then return deny(401, "Invalid header encoding") end
    local header = cjson.decode(header_str)
    if not header then return deny(401, "Invalid header JSON") end
    if header.alg ~= "HS256" then
        return deny(401, "Unsupported algorithm")
    end

    -- Recompute signature
    local h, err = hmac:new(secret, hmac.ALGOS.SHA256)
    if not h then
        ngx.log(ngx.ERR, "hmac init failed: ", err)
        return deny(500, "Crypto failure")
    end
    local ok = h:update(header_b64 .. "." .. payload_b64)
    if not ok then
        ngx.log(ngx.ERR, "hmac update failed")
        return deny(500, "Crypto failure")
    end
    local computed = h:final()
    if not computed then
        ngx.log(ngx.ERR, "hmac final failed")
        return deny(500, "Crypto failure")
    end

    -- Compare with signature from token
    local expected = b64url_decode(sig_b64)
    if not expected then return deny(401, "Invalid signature encoding") end
    if not ct_equals(expected, computed) then
        return deny(401, "Invalid token signature")
    end

    -- Decode payload
    local payload_str = b64url_decode(payload_b64)
    if not payload_str then return deny(401, "Invalid payload encoding") end
    local payload = cjson.decode(payload_str)
    if not payload then return deny(401, "Invalid payload JSON") end

    -- Standard claim checks
    local now = ngx.time()
    if payload.exp and payload.exp < now then
        return deny(401, "Token expired")
    end
    if payload.nbf and payload.nbf > now then
        return deny(401, "Token not yet valid")
    end
    if not payload.sub or not payload.role then
        return deny(401, "Token payload incomplete")
    end

    local expected_iss = os.getenv("JWT_ISSUER")
    if expected_iss and expected_iss ~= "" and payload.iss ~= expected_iss then
        return deny(401, "Token issuer mismatch")
    end

    return payload
end

--- Verify token AND require role to match one of the allowed roles.
function _M.verify_role(allowed)
    local payload = _M.verify()
    local role = payload.role
    local ok = false
    for _, r in ipairs(allowed) do
        if r == role then ok = true; break end
    end
    if not ok then
        return deny(403, "Forbidden: requires role " .. table.concat(allowed, " or "))
    end
    return payload
end

--- Inject decoded payload as X-User-* headers for upstream service.
function _M.set_upstream_headers(payload)
    ngx.req.set_header("X-User-Id",    tostring(payload.sub))
    ngx.req.set_header("X-User-Role",  tostring(payload.role))
    ngx.req.set_header("X-User-Email", tostring(payload.email or ""))
    ngx.req.set_header("X-User-Name",  tostring(payload.name  or ""))
end

return _M
