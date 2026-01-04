# Smart Campus Navigation - Security Enhancements Implementation

## Overview
This document describes the security enhancements implemented to protect user login data and improve overall system security.

## Implemented Features

### 1. ✅ Audit Logging System
**Files Created:**
- `backend/src/main/java/com/uiu/campus/model/AuditLog.java`
- `backend/src/main/java/com/uiu/campus/repository/AuditLogRepository.java`
- `backend/src/main/java/com/uiu/campus/service/AuditLogService.java`

**Features:**
- Tracks all authentication events (LOGIN, LOGOUT, SIGNUP, LOGIN_FAILED, TOKEN_REFRESH, PASSWORD_CHANGE)
- Records IP address and user agent for each event
- Stores success/failure status and error messages
- Automatic timestamp generation

**Database Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    success BOOLEAN,
    error_message VARCHAR(500),
    timestamp TIMESTAMP
);
```

### 2. ✅ Login Attempt Tracking & Rate Limiting
**Files Created:**
- `backend/src/main/java/com/uiu/campus/model/LoginAttempt.java`
- `backend/src/main/java/com/uiu/campus/repository/LoginAttemptRepository.java`
- `backend/src/main/java/com/uiu/campus/service/LoginAttemptService.java`

**Features:**
- Tracks failed login attempts per identifier (email/studentId)
- Blocks accounts after 5 failed attempts
- 15-minute block duration
- Automatic reset after 30 minutes of inactivity
- Provides remaining attempt count to users

**Protection Against:**
- Brute force password attacks
- Credential stuffing attacks
- Dictionary attacks

**Database Table: `login_attempts`**
```sql
CREATE TABLE login_attempts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255),
    attempt_count INT,
    last_attempt_time TIMESTAMP,
    blocked_until TIMESTAMP
);
```

### 3. ✅ Password Strength Validation
**File Created:**
- `backend/src/main/java/com/uiu/campus/util/PasswordValidator.java`

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (@#$%^&+=!)
- No whitespace allowed

**Pattern:** `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$`

### 4. ✅ Enhanced Authentication Service
**File Modified:**
- `backend/src/main/java/com/uiu/campus/service/AuthService.java`

**Enhancements:**
- Password strength validation on signup
- Login attempt tracking integration
- Audit logging for all auth operations
- IP address and user agent tracking
- Detailed error messages with attempt counts
- Automatic blocking after failed attempts

### 5. ✅ IP Address Tracking
**File Modified:**
- `backend/src/main/java/com/uiu/campus/controller/AuthController.java`

**Features:**
- Captures client IP address from multiple headers:
  - `X-Forwarded-For` (for proxies/load balancers)
  - `X-Real-IP` (for nginx)
  - `RemoteAddr` (direct connection)
- Handles comma-separated proxy chains
- Trims and validates IP addresses

### 6. ✅ User Profile Endpoint
**Endpoint Added:** `GET /api/auth/me`

**Features:**
- Retrieves current user details from JWT token
- Returns user profile without password
- Validates token before returning data
- Protected by Bearer authentication

**Response:**
```json
{
    "id": 1,
    "email": "student@uiu.edu",
    "studentId": "123456789",
    "fullName": "John Doe",
    "createdAt": "2026-01-04T10:30:00"
}
```

### 7. ✅ Frontend API Interceptors
**File Modified:**
- `frontend/src/services/api.ts`

**Enhancements:**
- Automatic token attachment to requests
- Response error handling with status codes
- Auto-logout on 401 (Unauthorized)
- Redirect to login page on authentication failure
- Rate limit detection (429)
- Network error handling
- Server error handling (5xx)

**Error Handling:**
- 401: Clears local storage and redirects to login
- 403: Access forbidden
- 429: Rate limited (too many requests)
- 500+: Server errors
- Network errors: Connection issues

### 8. ✅ Environment-Specific Configuration
**Files Created:**
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`

**File Modified:**
- `backend/src/main/resources/application.properties`

**Profiles:**

#### Development (`application-dev.properties`)
- H2/MySQL database with auto-update
- SQL logging enabled
- Debug logging
- CORS for localhost
- Development tools enabled

#### Production (`application-prod.properties`)
- Environment variable configuration
- Validate-only DDL mode
- Minimal logging
- Configurable CORS origins
- Connection pooling optimized
- Health monitoring endpoints
- SSL configuration ready

**Usage:**
```bash
# Run in development mode
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Run in production mode
./mvnw spring-boot:run -Dspring.profiles.active=prod
```

## Security Flow Diagrams

### Login with Rate Limiting
```
User submits credentials
    ↓
Check if identifier is blocked
    ↓
YES → Return "Account temporarily blocked" (401)
NO  → Continue
    ↓
Verify credentials
    ↓
VALID → 
    - Reset login attempts
    - Generate JWT token
    - Log successful login (audit)
    - Return token
    ↓
INVALID →
    - Increment login attempts
    - Log failed login (audit)
    - Check if max attempts reached
    - Block account if needed
    - Return error with remaining attempts
```

### Signup with Password Validation
```
User submits signup form
    ↓
Validate email/student ID format
    ↓
Validate password strength
    ↓
WEAK → Return requirements (400)
STRONG → Continue
    ↓
Check if user exists
    ↓
EXISTS → Return "Already registered" (400)
NOT EXISTS → Continue
    ↓
Hash password with BCrypt
    ↓
Save user to database
    ↓
Generate JWT token
    ↓
Log signup event (audit)
    ↓
Return token and user data
```

## API Changes

### New Endpoints

#### `GET /api/auth/me`
Get current authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
    "id": 1,
    "email": "student@uiu.edu",
    "studentId": "123456789",
    "fullName": "John Doe",
    "createdAt": "2026-01-04T10:30:00"
}
```

**Error (401 Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

### Modified Endpoints

#### `POST /api/auth/signup`
Now includes:
- Password strength validation
- IP address tracking
- Audit logging
- User agent tracking

**Error Messages:**
```json
// Weak password
{
    "message": "Password must be at least 8 characters long and contain: 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (@#$%^&+=!)"
}
```

#### `POST /api/auth/login`
Now includes:
- Rate limiting check
- Login attempt tracking
- IP address tracking
- Audit logging
- Remaining attempt count

**Error Messages:**
```json
// Rate limited
{
    "message": "Account temporarily blocked due to multiple failed login attempts. Please try again later."
}

// Invalid credentials with attempts
{
    "message": "Invalid credentials. 3 attempts remaining before account is temporarily blocked."
}
```

## Database Schema Updates

### New Tables

#### `audit_logs`
Stores all authentication events.

```sql
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    success BOOLEAN NOT NULL,
    error_message VARCHAR(500),
    timestamp TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp),
    INDEX idx_ip_address (ip_address)
);
```

#### `login_attempts`
Tracks failed login attempts for rate limiting.

```sql
CREATE TABLE login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL UNIQUE,
    attempt_count INT NOT NULL,
    last_attempt_time TIMESTAMP NOT NULL,
    blocked_until TIMESTAMP,
    INDEX idx_identifier (identifier),
    INDEX idx_blocked_until (blocked_until)
);
```

## Configuration

### JWT Settings
```properties
# Token expiration: 24 hours (86400000 milliseconds)
jwt.expiration=86400000

# Secret key (use environment variable in production)
jwt.secret=${JWT_SECRET:fallback-secret}
```

### Rate Limiting Settings
Configured in `LoginAttemptService`:
- `MAX_ATTEMPTS = 5` - Maximum failed login attempts
- `BLOCK_DURATION_MINUTES = 15` - Account block duration
- `RESET_DURATION_MINUTES = 30` - Inactivity reset period

### Password Policy
Configured in `PasswordValidator`:
- Minimum length: 8 characters
- Required: uppercase, lowercase, digit, special character
- Allowed special characters: `@#$%^&+=!`

## Testing

### Test Password Strength
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@uiu.edu",
    "studentId": "123456789",
    "fullName": "Test User",
    "password": "weak"
  }'

# Should return: "Password must be at least 8 characters..."
```

### Test Rate Limiting
```bash
# Try 6 failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@uiu.edu",
      "password": "wrongpassword"
    }'
  echo "\nAttempt $i"
done

# 6th attempt should return: "Account temporarily blocked..."
```

### Test Audit Logging
```sql
-- Check audit logs
SELECT * FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check login attempts
SELECT * FROM login_attempts;
```

### Test User Profile Endpoint
```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@uiu.edu",
    "password": "Test@123"
  }' | jq -r '.token')

# Get user profile
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Migration Guide

### Updating Existing Installation

1. **Pull latest code**
2. **Database migration** - New tables will be auto-created:
   - `audit_logs`
   - `login_attempts`
3. **Update environment variables** (production):
   ```bash
   export JWT_SECRET="your-strong-secret-key-here"
   export DATABASE_URL="jdbc:mysql://host:3306/db"
   export DATABASE_USERNAME="username"
   export DATABASE_PASSWORD="password"
   ```
4. **Restart application**

### Breaking Changes
⚠️ **Password requirements changed** - Users with weak passwords can still login, but new signups require strong passwords.

## Monitoring & Maintenance

### View Audit Logs
```sql
-- Recent login failures
SELECT * FROM audit_logs 
WHERE action = 'LOGIN_FAILED' 
  AND timestamp > NOW() - INTERVAL 24 HOUR;

-- User activity
SELECT user_id, action, COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL 7 DAY
GROUP BY user_id, action;

-- Suspicious IP addresses
SELECT ip_address, COUNT(*) as failed_attempts
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
  AND timestamp > NOW() - INTERVAL 1 HOUR
GROUP BY ip_address
HAVING failed_attempts > 10;
```

### Clear Blocked Accounts
```sql
-- Unblock all accounts
DELETE FROM login_attempts;

-- Unblock specific account
DELETE FROM login_attempts WHERE identifier = 'user@example.com';
```

## Security Best Practices

### ✅ Implemented
- [x] Password hashing with BCrypt
- [x] JWT token authentication
- [x] Rate limiting (5 attempts, 15 min block)
- [x] Password strength requirements
- [x] Audit logging
- [x] IP address tracking
- [x] Environment-specific configuration
- [x] Input validation
- [x] Error handling
- [x] Automatic token expiration (24 hours)

### 🔄 Recommended for Production
- [ ] **HTTPS/TLS** - Enable SSL certificates
- [ ] **HttpOnly cookies** - Store tokens in secure cookies instead of localStorage
- [ ] **Refresh tokens** - Implement token refresh mechanism
- [ ] **Email verification** - Verify email addresses before activation
- [ ] **2FA/MFA** - Add two-factor authentication
- [ ] **Session management** - Track active sessions
- [ ] **Token blacklist** - Revoke tokens on logout
- [ ] **Database encryption** - Encrypt sensitive columns
- [ ] **Regular backups** - Automated database backups
- [ ] **Security headers** - Add CORS, CSP, HSTS headers
- [ ] **Penetration testing** - Regular security audits

## Summary

All relevant security enhancements have been implemented:

1. ✅ **Audit Logging** - Complete tracking of authentication events
2. ✅ **Rate Limiting** - Protection against brute force attacks
3. ✅ **Password Validation** - Strong password requirements
4. ✅ **IP Tracking** - Monitor login sources
5. ✅ **User Profile API** - Secure user data retrieval
6. ✅ **Enhanced Error Handling** - Better frontend error management
7. ✅ **Environment Configuration** - Separate dev/prod settings

The system now provides enterprise-level security for user login data with comprehensive audit trails and protection against common attack vectors.
