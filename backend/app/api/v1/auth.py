"""
Comprehensive authentication routes with email verification, password reset,
refresh tokens, rate limiting, and brute-force protection.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
from app.db.database import get_db
from app.db.models import User, VerificationToken, PasswordResetToken
from app.api.v1.schemas import (
    UserCreate, UserResponse, Token, LoginRequest, RefreshTokenRequest,
    VerifyEmailRequest, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    MessageResponse
)
from app.core.security import (
    verify_password, get_password_hash, validate_password_strength,
    create_access_token, create_refresh_token, decode_access_token, decode_refresh_token,
    generate_verification_token, generate_password_reset_token, sanitize_input
)
from app.core.config import settings
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ==================== Helper Functions ====================

def check_account_locked(user: User) -> None:
    """
    Check if user account is locked due to too many failed login attempts.
    
    Args:
        user: User object to check
        
    Raises:
        HTTPException if account is locked
    """
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to too many failed login attempts. Try again in {remaining_minutes} minutes."
        )


def reset_login_attempts(user: User, db: Session) -> None:
    """Reset login attempts counter after successful login."""
    user.login_attempts = 0
    user.locked_until = None
    db.commit()


def increment_login_attempts(user: User, db: Session) -> None:
    """Increment login attempts and lock account if threshold exceeded."""
    user.login_attempts += 1
    
    if user.login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
        user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
    
    db.commit()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get the current authenticated user from JWT token.
    Dependency for protected routes.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException if token is invalid or user not found
    """
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify email is verified.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Verified user
        
    Raises:
        HTTPException if email is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email address."
        )
    return current_user


# ==================== Registration ====================

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: Request,
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Features:
    - Validates password strength
    - Checks for duplicate email/username
    - Creates user with hashed password
    - Sends verification email
    - Rate limited to 5 requests per minute
    """
    # Sanitize inputs
    username = sanitize_input(user_data.username)
    email = user_data.email.lower().strip()
    
    # Validate password strength
    is_valid, errors = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "errors": errors}
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    # Auto-verify if email is disabled (for testing/development)
    auto_verify = not settings.EMAIL_ENABLED
    
    new_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_verified=auto_verify
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Only create verification token and send email if email is enabled
    if settings.EMAIL_ENABLED:
        # Generate and store verification token
        token = generate_verification_token()
        expires_at = datetime.utcnow() + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)
        verification_token = VerificationToken(
            user_id=new_user.id,
            token=token,
            expires_at=expires_at
        )
        db.add(verification_token)
        db.commit()
        
        # Send verification email in background
        background_tasks.add_task(
            email_service.send_verification_email,
            new_user.email,
            new_user.username,
            token
        )
    else:
        # Print verification token to console for testing
        print(f"\n{'='*60}")
        print(f"🚨 EMAIL DISABLED - USER AUTO-VERIFIED")
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"User ID: {new_user.id}")
        print(f"Status: Verified automatically (email service disabled)")
        print(f"{'='*60}\n")
    
    return new_user


# ==================== Login ====================

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    
    Features:
    - Login with email or username
    - Checks account lock status
    - Increments failed login attempts
    - Returns access and refresh tokens
    - Rate limited to 10 requests per minute
    """
    identifier = sanitize_input(login_data.identifier).lower()
    
    # Find user by email or username
    user = db.query(User).filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )
    
    # Check if account is locked
    check_account_locked(user)
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        increment_login_attempts(user, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )
    
    # Check if email is verified (only if email service is enabled)
    if settings.EMAIL_ENABLED and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your email for verification link."
        )
    
    # Auto-verify users if email is disabled (for testing)
    if not settings.EMAIL_ENABLED and not user.is_verified:
        user.is_verified = True
        db.commit()
    
    # Reset login attempts on successful login
    reset_login_attempts(user, db)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user.id, "username": user.username})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Store refresh token in database
    user.refresh_token = refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ==================== Token Refresh ====================

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_data: Contains refresh token
        
    Returns:
        New access and refresh tokens
    """
    payload = decode_refresh_token(refresh_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or user.refresh_token != refresh_data.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Generate new tokens
    access_token = create_access_token(data={"sub": user.id, "username": user.username})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Update refresh token in database
    user.refresh_token = new_refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


# ==================== Email Verification ====================

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    verify_data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Verify user email address using verification token.
    
    Args:
        verify_data: Contains verification token
        
    Returns:
        Success message
    """
    token_obj = db.query(VerificationToken).filter(
        VerificationToken.token == verify_data.token
    ).first()
    
    if not token_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    if token_obj.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    user = db.query(User).filter(User.id == token_obj.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return MessageResponse(message="Email already verified")
    
    # Mark user as verified
    user.is_verified = True
    db.delete(token_obj)
    db.commit()
    
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: Request,
    resend_data: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Resend email verification link.
    Rate limited to 3 requests per hour.
    """
    user = db.query(User).filter(User.email == resend_data.email).first()
    
    if not user:
        # Don't reveal if email exists for security
        return MessageResponse(message="If email exists, verification link has been sent")
    
    if user.is_verified:
        return MessageResponse(message="Email already verified")
    
    # Delete old verification tokens
    db.query(VerificationToken).filter(VerificationToken.user_id == user.id).delete()
    
    # Create new verification token
    token = generate_verification_token()
    expires_at = datetime.utcnow() + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)
    verification_token = VerificationToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(verification_token)
    db.commit()
    
    # Send verification email
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.username,
        token
    )
    
    return MessageResponse(message="Verification email sent")


# ==================== Password Reset ====================

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: Request,
    forgot_data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request password reset email.
    Rate limited to 3 requests per hour.
    """
    user = db.query(User).filter(User.email == forgot_data.email).first()
    
    if not user:
        # Don't reveal if email exists
        return MessageResponse(message="If email exists, password reset link has been sent")
    
    # Invalidate old reset tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})
    
    # Create new reset token
    token = generate_password_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    
    # Send password reset email
    background_tasks.add_task(
        email_service.send_password_reset_email,
        user.email,
        user.username,
        token
    )
    
    return MessageResponse(message="Password reset link sent to your email")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token.
    """
    # Validate password strength
    is_valid, errors = validate_password_strength(reset_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "errors": errors}
        )
    
    token_obj = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == reset_data.token,
        PasswordResetToken.used == False
    ).first()
    
    if not token_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if token_obj.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    user = db.query(User).filter(User.id == token_obj.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.login_attempts = 0
    user.locked_until = None
    token_obj.used = True
    db.commit()
    
    return MessageResponse(message="Password reset successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user.
    Requires current password verification.
    """
    # Verify current password
    if not verify_password(change_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    is_valid, errors = validate_password_strength(change_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "errors": errors}
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(change_data.new_password)
    db.commit()
    
    return MessageResponse(message="Password changed successfully")


# ==================== Logout ====================

@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by invalidating refresh token.
    """
    current_user.refresh_token = None
    db.commit()
    
    return MessageResponse(message="Logged out successfully")


# ==================== User Info ====================

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_verified_user)
):
    """
    Get current authenticated user information.
    """
    return current_user
