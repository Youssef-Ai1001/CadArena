# Authentication System Setup Guide

## ✅ What's Been Completed

I've built a **complete, production-ready authentication system** with all the features you requested:

### ✨ Features Implemented

1. ✅ **Signup** - Username + Email + Password with strong validation
2. ✅ **Email Verification** - Token-based verification system
3. ✅ **Login** - Email or username with JWT tokens
4. ✅ **Refresh Tokens** - Automatic token refresh system
5. ✅ **Password Reset** - Secure token-based reset
6. ✅ **Brute Force Protection** - Account lockout after 5 failed attempts
7. ✅ **Rate Limiting** - Protection on sensitive endpoints
8. ✅ **Password Strength** - Comprehensive validation
9. ✅ **Input Sanitization** - XSS protection
10. ✅ **Security Best Practices** - Bcrypt hashing, secure tokens

## 🚀 Quick Start

### 1. Update Database

The database models have been updated. You need to recreate the database:

```bash
cd backend
# Delete old database (or it will auto-update)
rm cadarena.db  # Optional - SQLite will update schema
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `backend/.env` file:

```env
# Security - CHANGE THESE!
SECRET_KEY=your-super-secret-random-string-here
REFRESH_SECRET_KEY=your-refresh-secret-random-string-here

# Email (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@cadarena.com
EMAIL_ENABLED=false  # Set to true when SMTP is configured

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Note:** Email is currently **disabled by default**. Users can sign up, but verification emails won't be sent until SMTP is configured. You can manually verify users in the database if needed.

### 4. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

## 🔧 Important Notes

### Database Migration

The User model now includes:
- `username` field (required)
- `is_verified` field (default: false)
- `refresh_token` field
- `login_attempts` field
- `locked_until` field

**If you have existing users**, they will need to:
1. Set a username (you can do this manually in the database)
2. Verify their email (if email is enabled)

### Email Verification

**Currently Disabled:** Email verification is disabled by default (`EMAIL_ENABLED=false`).

To enable:
1. Configure SMTP settings in `.env`
2. Set `EMAIL_ENABLED=true`
3. Restart the backend

**For Development/Testing:**
- You can manually set `is_verified = True` in the database
- Or check the console logs - verification tokens are printed when email is disabled

### Token Storage

The frontend now stores:
- `access_token` - Short-lived (30 min)
- `refresh_token` - Long-lived (7 days)

Old code using `token` has been updated.

## 📝 Testing the Authentication

### 1. Signup Flow

1. Go to `http://localhost:3000/auth/signup`
2. Enter username, email, and strong password
3. Click "Create Account"
4. You'll see a success message (email verification info)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

### 2. Login Flow

1. Go to `http://localhost:3000/auth/login`
2. Enter email OR username
3. Enter password
4. If email not verified, you'll see an error
5. If verified, you'll be redirected to dashboard

### 3. Manual Email Verification (for testing)

Since email is disabled by default, you can:

1. Check backend console for verification token when user signs up
2. Use the token in: `POST /api/v1/auth/verify-email`
3. Or manually set `is_verified = True` in database

## 🔐 Security Features

### Password Strength
- Validated on both frontend and backend
- Must meet all requirements

### Account Lockout
- 5 failed login attempts → 15-minute lockout
- Lockout clears after time expires

### Rate Limiting
- Signup: 5 requests/minute
- Login: 10 requests/minute
- Password reset: 3 requests/hour

### Token Security
- Access tokens expire in 30 minutes
- Refresh tokens expire in 7 days
- Automatic token refresh on API calls

## 📚 API Documentation

See `backend/AUTHENTICATION.md` for complete API documentation including:
- All endpoints
- Request/response formats
- Error codes
- Security details

## 🐛 Troubleshooting

### "Can't signup/login"

1. **Check database**: Make sure database is running and models are created
2. **Check backend logs**: Look for errors
3. **Check email verification**: Users must verify email (or set `is_verified=true` manually)
4. **Check password requirements**: Must meet all criteria

### "Email verification not working"

1. **Email is disabled by default**: Check `EMAIL_ENABLED` in `.env`
2. **Check SMTP settings**: If enabled, verify SMTP credentials
3. **Check console logs**: Tokens are printed when email is disabled
4. **Manual verification**: Set `is_verified = True` in database

### "Token errors"

1. **Clear localStorage**: Remove old tokens
2. **Check token expiration**: Access tokens expire in 30 min
3. **Refresh token**: System should auto-refresh, but you can manually call `/auth/refresh`

## 📖 Next Steps

1. **Configure Email**: Set up SMTP for production
2. **Set Strong Secrets**: Change `SECRET_KEY` and `REFRESH_SECRET_KEY`
3. **Test All Flows**: Signup, login, password reset, etc.
4. **Monitor**: Check logs for any issues

## 🎯 What's Different from Before

1. **Username is now required** - Users must provide a username
2. **Email verification required** - Users must verify email before login
3. **Two tokens** - Access token + refresh token (instead of single token)
4. **Stronger passwords** - More strict validation
5. **Better security** - Rate limiting, brute force protection, etc.

The frontend has been updated to work with all these changes!

