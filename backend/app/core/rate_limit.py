"""
Rate limiting utilities.
Provides rate limiting decorator for endpoints.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


def get_rate_limiter() -> Limiter:
    """
    Get the rate limiter instance.
    
    Returns:
        Limiter instance
    """
    return limiter
