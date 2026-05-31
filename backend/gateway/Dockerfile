# =====================================================================
# AAFT LMS — API Gateway (single)
# OpenResty (Nginx + LuaJIT) — verifies JWT and routes to services.
#
# Only dependency: lua-resty-hmac (used by lua/jwt_verify.lua to compute
# HMAC-SHA256 for HS256 JWT verification). We deliberately do NOT use
# lua-resty-jwt because that library transitively requires
# `resty.openssl.cipher` (heavy C bindings for JWE encryption we don't need).
# Our pure-Lua HS256 verifier in jwt_verify.lua is ~30 lines and avoids it.
# =====================================================================
FROM openresty/openresty:1.25.3.1-0-alpine-fat

RUN apk add --no-cache --virtual .build-deps git \
 && git clone --depth 1 https://github.com/jkeys089/lua-resty-hmac.git /tmp/hmac \
 && mkdir -p /usr/local/openresty/lualib/resty \
 && cp /tmp/hmac/lib/resty/hmac.lua /usr/local/openresty/lualib/resty/hmac.lua \
 && rm -rf /tmp/hmac \
 && apk del .build-deps

# Remove default openresty/nginx configs
RUN rm -f /etc/nginx/conf.d/default.conf /usr/local/openresty/nginx/conf/nginx.conf

# Main nginx config (worker/event/http blocks)
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Server-level config (location routing)
COPY servers.conf  /etc/nginx/servers.conf
COPY api_conf.d/   /etc/nginx/api_conf.d/
COPY lua/          /etc/nginx/lua/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/_health || exit 1

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
