"""
Middleware and dependencies for rate limiting and security.
"""
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address


def check_rate_limit(request: Request, limit: str = "10/minute"):
    """
    Dependency to check rate limit for an endpoint.
    
    Args:
        request: FastAPI request object
        limit: Rate limit string (e.g., "10/minute")
        
    Raises:
        HTTPException if rate limit exceeded
    """
    if hasattr(request.app.state, "limiter"):
        limiter: Limiter = request.app.state.limiter
        # Check rate limit
        try:
            limiter.check()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

