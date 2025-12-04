"""
Pydantic schemas for request/response validation.
Provides type safety and automatic validation for API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional


# ==================== User Schemas ====================

class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72, description="Password (8-72 characters)")
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format (alphanumeric and underscores only)."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v.lower()


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)."""
    id: int
    username: str
    email: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Authentication Schemas ====================

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Schema for login request (email or username)."""
    identifier: str = Field(..., description="Email address or username")
    password: str


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


# ==================== Email Verification Schemas ====================

class VerifyEmailRequest(BaseModel):
    """Schema for email verification request."""
    token: str


class ResendVerificationRequest(BaseModel):
    """Schema for resending verification email."""
    email: EmailStr


# ==================== Password Reset Schemas ====================

class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset request."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=72, description="New password (8-72 characters)")


class ChangePasswordRequest(BaseModel):
    """Schema for changing password (authenticated user)."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72, description="New password (8-72 characters)")


# ==================== Project Schemas ====================

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Conversation Schemas ====================

class ConversationResponse(BaseModel):
    id: int
    project_id: int
    prompt_text: str
    dxf_output_data: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


# ==================== Message Schemas ====================

class MessageResponse(BaseModel):
    """Schema for API response messages."""
    message: str
    success: bool = True
