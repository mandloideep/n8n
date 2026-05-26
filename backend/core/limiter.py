"""Shared slowapi limiter — imported by main.py for middleware wiring and by
routers for per-endpoint @limiter.limit decorators. Lives outside main.py to
avoid the routers ↔ main circular import.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=[])
