"""Basic in-memory rate limiting via slowapi (per client IP).

Suitable for a template / single-instance deployment. For horizontal
scaling swap the storage backend for Redis in `Limiter(storage_uri=...)`.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
