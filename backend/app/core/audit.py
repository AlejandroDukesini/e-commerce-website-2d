"""Structured security event logging (Blue Team detection substrate).

Before this module the application emitted no security-relevant telemetry at
all: a credential-stuffing run, a privilege-escalation attempt or a burst of
forged tokens left no trace beyond uvicorn's access log, which records neither
the outcome nor the actor. Detection was therefore impossible.

Design notes:
  * Events go to a dedicated `security` logger so they can be routed to a
    separate sink (file, syslog, SIEM) without touching application logs.
  * One event per line as `key=value` pairs — greppable by humans and
    trivially parsed by Splunk/Elastic/Loki without a custom decoder.
  * NEVER log passwords, tokens, hashes or full request bodies. Only the
    identifiers needed to correlate an incident. Emails are the actor id here;
    if your jurisdiction treats them as PII, hash them before shipping to a
    long-retention sink.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import Request

logger = logging.getLogger("security")

# --- Event taxonomy -------------------------------------------------------
# Stable machine-readable names. Alert rules key off these, so renaming one
# is a breaking change for the detection pipeline.
LOGIN_SUCCESS = "auth.login.success"
LOGIN_FAILURE = "auth.login.failure"
LOGIN_INACTIVE = "auth.login.inactive_account"
REGISTER_SUCCESS = "auth.register.success"
REGISTER_DUPLICATE = "auth.register.duplicate_email"
REGISTER_ROLE_ATTEMPT = "auth.register.role_injection_attempt"
TOKEN_INVALID = "auth.token.invalid"
TOKEN_UNKNOWN_SUBJECT = "auth.token.unknown_subject"
RBAC_DENIED = "authz.rbac.denied"
RATE_LIMITED = "abuse.rate_limit.exceeded"


def client_ip(request: Request | None) -> str:
    """Best-effort client IP.

    Uses the raw socket peer only. `X-Forwarded-For` is intentionally NOT
    trusted here: it is attacker-controlled unless a known reverse proxy
    overwrites it. When you deploy behind a proxy, run uvicorn with
    `--proxy-headers --forwarded-allow-ips=<proxy-ip>` so `request.client`
    already carries the real client address.
    """
    if request is None or request.client is None:
        return "unknown"
    return request.client.host


def _fmt(value: Any) -> str:
    text = str(value)
    # Quote anything with whitespace/`=` so key=value parsing stays unambiguous.
    if any(c in text for c in " =\t\"") or text == "":
        return '"' + text.replace('"', "'") + '"'
    return text


def log_event(
    event: str,
    request: Request | None = None,
    level: int = logging.INFO,
    **fields: Any,
) -> None:
    """Emit one structured security event."""
    parts = [f"event={event}", f"ip={_fmt(client_ip(request))}"]
    if request is not None:
        parts.append(f"path={_fmt(request.url.path)}")
        parts.append(f"ua={_fmt(request.headers.get('user-agent', '-'))[:200]}")
    parts.extend(f"{k}={_fmt(v)}" for k, v in fields.items())
    logger.log(level, " ".join(parts))


def configure_logging(level: str = "INFO") -> None:
    """Attach a stderr handler to the security logger if none exists.

    Kept deliberately simple: production deployments should replace this with
    the platform's log shipper (journald, CloudWatch, Loki...).
    """
    if logger.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s [security] %(message)s")
    )
    logger.addHandler(handler)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    logger.propagate = False
