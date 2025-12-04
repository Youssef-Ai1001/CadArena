# Comprehensive Authentication System Documentation

## Overview

CAD ARENA includes a production-ready, secure authentication system with email verification, password reset, JWT tokens (access + refresh), rate limiting, and brute-force protection.

## Features

### ✅ Implemented Features

1. **User Registration (Signup)**
   - Username + Email + Password
   - Strong password validation (8+ chars, uppercase, lowercase, digit, special char)
   - Unique email and username validation
   - Bcrypt password hashing
   - Automatic email verification token generation
   - Email verification sent on signup

2. **Email Verification**
   - Token-based email verification
   - 24-hour token expiration
   - Resend verification email (rate limited)
   - Users must verify email before login

3. **Login**
   - Login with email OR username
   - JWT access token (30 min expiration)
   - JWT refresh token (7 days expiration)
   - Brute-force protection (5 attempts → 15 min lockout)
   - Account lockout after failed attempts

4. **Password Reset**
   - Forgot password endpoint
   - Email with secure reset token
   - One-time use tokens
   - 1-hour token expiration
   - Secure password change with validation

5. **Token Management**
   - Access token for API authentication
   - Refresh token for obtaining new access tokens
   - Token refresh endpoint
   - Logout invalidates refresh tokens

6. **Security Features**
   - Rate limiting on sensitive endpoints
   - Input sanitization (XSS prevention)
   - SQL injection protection (SQLAlchemy ORM)
   - Password strength validation
   - Account lockout mechanism
   - Secure token generation

## API Endpoints

### Authentication Endpoints

#### 1. Signup
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "is_verified": false,
  "created_at": "2024-12-04T10:00:00Z"
}
```

#### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "john@example.com",  // or username
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### 3. Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "success": true
}
```

#### 4. Resend Verification Email
```http
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Rate Limited:** 3 requests per hour

#### 5. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_from_login"
}
```

**Response (200):**
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "token_type": "bearer"
}
```

#### 6. Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Rate Limited:** 3 requests per hour

#### 7. Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

#### 8. Change Password (Authenticated)
```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

#### 9. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

#### 10. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## Database Models

### User Model
- `id`: Primary key
- `username`: Unique username (indexed)
- `email`: Unique email (indexed)
- `hashed_password`: Bcrypt hashed password
- `is_verified`: Email verification status
- `refresh_token`: Current refresh token
- `login_attempts`: Failed login counter
- `locked_until`: Account lockout expiration
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### VerificationToken Model
- `id`: Primary key
- `user_id`: Foreign key to User
- `token`: Unique verification token (indexed)
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp

### PasswordResetToken Model
- `id`: Primary key
- `user_id`: Foreign key to User
- `token`: Unique reset token (indexed)
- `expires_at`: Token expiration timestamp
- `used`: Whether token has been used
- `created_at`: Token creation timestamp

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=sqlite:///./cadarena.db

# Security - JWT
SECRET_KEY=your-super-secret-key-change-this
REFRESH_SECRET_KEY=your-refresh-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security Settings
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
VERIFICATION_TOKEN_EXPIRE_HOURS=24
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=1

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@cadarena.com
SMTP_FROM_NAME=CAD ARENA
EMAIL_ENABLED=true

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

### Email Setup (Gmail Example)

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASSWORD`

## Security Best Practices

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one digit
   - At least one special character

2. **Rate Limiting:**
   - Signup: 5 requests/minute
   - Login: 10 requests/minute
   - Resend verification: 3 requests/hour
   - Forgot password: 3 requests/hour

3. **Account Protection:**
   - 5 failed login attempts → 15-minute lockout
   - Email verification required before login
   - Secure token generation using `secrets.token_urlsafe()`

4. **Token Security:**
   - Access tokens expire in 30 minutes
   - Refresh tokens expire in 7 days
   - Tokens stored securely in database
   - Token invalidation on logout

## Frontend Integration

### Example: Login Flow

```typescript
// Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password123'
  })
});

const { access_token, refresh_token } = await response.json();

// Store tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Use access token for authenticated requests
const projects = await fetch('/api/v1/projects', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Example: Token Refresh

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  const { access_token, refresh_token } = await response.json();
  
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  
  return access_token;
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created (signup)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials/token)
- `403`: Forbidden (email not verified)
- `404`: Not Found
- `423`: Locked (account locked)
- `429`: Too Many Requests (rate limited)

## Testing

### Using cURL

**Signup:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"TestPass123!"}'
```

**Get Current User:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Migration from Old System

If you have existing users without the new fields:

1. The database will automatically add new columns when models are updated
2. Existing users will have:
   - `is_verified = False` (must verify email)
   - `login_attempts = 0`
   - `locked_until = None`
   - `refresh_token = None`
   - Username will need to be set manually or via migration script

## Next Steps

1. Configure SMTP settings for email sending
2. Set strong SECRET_KEY and REFRESH_SECRET_KEY
3. Update frontend to handle new authentication flow
4. Test email verification flow
5. Test password reset flow
6. Monitor rate limiting in production

## Support

For issues or questions, please refer to the main README.md or create an issue.

