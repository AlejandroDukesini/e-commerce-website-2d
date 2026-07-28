"""Security primitives: password hashing (bcrypt) and JWT sign/verify.

`bcrypt` is used directly (instead of passlib) to avoid the known
passlib<->bcrypt backend detection issues on Python 3.12+.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcrypt has a hard 72-byte limit on the input password.
_BCRYPT_MAX_BYTES = 72

# Upper bound on an accepted JWT. Ours are ~300 bytes; anything far larger is
# either malformed or an attempt to burn CPU in the parser.
_MAX_TOKEN_BYTES = 4096


def _truncate(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Return a salted bcrypt hash for storage."""
    return bcrypt.hashpw(_truncate(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time comparison of a plaintext password against a stored hash."""
    try:
        return bcrypt.checkpw(_truncate(plain_password), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# Pre-computed hash of a value no user can hold. Verifying against it costs the
# same as a real bcrypt check, which is exactly the point: see `dummy_verify`.
_DUMMY_HASH = bcrypt.hashpw(b"invalid-account-placeholder", bcrypt.gensalt())


def dummy_verify(plain_password: str) -> None:
    """Spend one bcrypt round and discard the result.

    Called on the "email not found" branch of login so that a request for a
    non-existent account costs the same wall-clock time as one for an existing
    account with a wrong password. Skipping this makes login a timing oracle
    for user enumeration (CWE-208).
    """
    try:
        bcrypt.checkpw(_truncate(plain_password), _DUMMY_HASH)
    except (ValueError, TypeError):
        pass


def create_access_token(
    subject: str | int,
    role: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Sign a JWT carrying the user id (`sub`) and their role."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Return the decoded claims, or None if invalid/expired.

    Hardening notes:
      * `algorithms` is an explicit single-item allowlist. This is what blocks
        the classic `alg: none` / algorithm-confusion forgery (CWE-347) — the
        token header can never talk the library into a weaker verifier.
        `Settings` additionally refuses to start with a non-HMAC algorithm.
      * `require_exp` makes an omitted expiry a hard failure instead of a
        token that silently never expires.
      * Any oversized input is rejected before parsing: JWT libraries have a
        history of decompression/parsing DoS on hostile blobs, and a legitimate
        access token here is a few hundred bytes.
    """
    if not token or len(token) > _MAX_TOKEN_BYTES:
        return None
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={
                "require_exp": True,
                "verify_exp": True,
                "verify_signature": True,
            },
        )
    except (JWTError, ValueError, TypeError):
        return None
