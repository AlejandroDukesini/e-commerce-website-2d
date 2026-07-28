"""Security response headers (the FastAPI equivalent of Express' helmet).

The API previously returned no security headers at all. Even for a JSON API
these matter: browsers will happily render an API response as a document if
the content type can be sniffed, and any endpoint that can be framed is a
clickjacking candidate.

Note on scope: these headers protect responses served *by the API*. The React
app is a static bundle served by Vite/your CDN, so the same headers — above
all a real Content-Security-Policy — must also be configured at that layer.
See cibersegurity.txt for the per-host snippets.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# A JSON API never needs to execute script, load fonts or be framed, so it can
# ship the most restrictive policy there is: deny everything.
_API_CSP = (
    "default-src 'none'; "
    "base-uri 'none'; "
    "form-action 'none'; "
    "frame-ancestors 'none'"
)

_BASE_HEADERS = {
    # Stop MIME sniffing (a JSON body coaxed into text/html is stored XSS).
    "X-Content-Type-Options": "nosniff",
    # Clickjacking defence. frame-ancestors above is the modern equivalent;
    # X-Frame-Options remains for older browsers.
    "X-Frame-Options": "DENY",
    # Don't leak the full URL (which may carry filters/ids) to third parties.
    "Referrer-Policy": "no-referrer",
    # Drop ambient authority the API has no use for.
    "Permissions-Policy": (
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
        "magnetometer=(), microphone=(), payment=(), usb=()"
    ),
    "Content-Security-Policy": _API_CSP,
    # Defence in depth against credentialed cross-origin isolation attacks.
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    # Authenticated JSON must never sit in a shared/browser cache.
    "Cache-Control": "no-store",
}

_HSTS = "max-age=31536000; includeSubDomains"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach hardening headers to every response."""

    def __init__(self, app: ASGIApp, *, enable_hsts: bool = False) -> None:
        super().__init__(app)
        self._enable_hsts = enable_hsts

    async def dispatch(self, request, call_next):
        response = await call_next(request)

        for header, value in _BASE_HEADERS.items():
            # setdefault semantics: never clobber a header a route set on
            # purpose (e.g. a long Cache-Control on a public catalog response).
            if header not in response.headers:
                response.headers[header] = value

        # HSTS is only meaningful over TLS, and sending it from a plain-HTTP
        # dev server can lock developers out of http://localhost in that
        # browser profile. Gated on production.
        if self._enable_hsts:
            response.headers.setdefault("Strict-Transport-Security", _HSTS)

        # Don't advertise the exact server/framework build.
        if "server" in response.headers:
            del response.headers["server"]

        return response
