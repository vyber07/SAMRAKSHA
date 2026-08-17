"""Shared security utilities: cookie policy, CSRF tokens, secret validation.

Centralized here so auth, main.py middleware, and any future routers enforce a
single, consistent policy rather than duplicating `secure=True` flags.
"""

from __future__ import annotations

import os
import secrets

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Cookie / CSRF identifiers (single source of truth).
SESSION_COOKIE_NAME = "samraksha_session"
CSRF_COOKIE_NAME = "samraksha_csrf"
CSRF_HEADER_NAME = "X-CSRF-Token"

# Methods that may mutate server state and therefore require CSRF validation
# when authenticated via the session cookie.
UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def cookie_secure() -> bool:
    """Return True when auth cookies should carry the ``Secure`` (HTTPS-only) flag.

    Explicit ``COOKIE_SECURE`` wins; otherwise Secure is enabled only in production.
    """
    explicit = os.getenv("COOKIE_SECURE")
    if explicit is not None and explicit != "":
        return explicit.lower() in ("1", "true", "yes", "on")
    return ENVIRONMENT == "production"


def generate_csrf_token() -> str:
    """Return a URL-safe, 256-bit CSRF token."""
    return secrets.token_urlsafe(32)


def csrf_tokens_match(cookie: str | None, header: str | None) -> bool:
    """Constant-time comparison of the CSRF cookie against the request header."""
    if not cookie or not header:
        return False
    return secrets.compare_digest(cookie, header)
