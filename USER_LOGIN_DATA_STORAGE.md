# User Login Data Storage - Smart Campus Navigation System

## Table of Contents
1. [Overview](#overview)
2. [Backend Storage](#backend-storage)
3. [Frontend Storage](#frontend-storage)
4. [Authentication Flow](#authentication-flow)
5. [Security Implementation](#security-implementation)
6. [Data Lifecycle](#data-lifecycle)
7. [API Endpoints](#api-endpoints)
8. [Best Practices & Recommendations](#best-practices--recommendations)

---

## Overview

This document provides a comprehensive explanation of how user login details are stored, managed, and secured in the Smart Campus Navigation & Crowd Density Monitoring System.

**Key Components:**
- **Backend**: Spring Boot (Java) with JPA/Hibernate
- **Database**: Relational database with `users` table
- **Frontend**: React with TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: BCrypt password hashing

---

## Backend Storage

### 1. Database Schema

**Table Name**: `users`

**Location**: Defined in `/backend/src/main/java/com/uiu/campus/model/User.java`

#### Columns:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `email` | VARCHAR | UNIQUE, NULLABLE | User's email address |
| `student_id` | VARCHAR | UNIQUE, NULLABLE | University student ID (9-11 digits) |
| `password` | VARCHAR | NOT NULL | BCrypt hashed password |
| `full_name` | VARCHAR | NULLABLE | User's full name |
| `created_at` | TIMESTAMP | NOT NULL | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Important Notes:**
- Either `email` OR `student_id` must be provided (both are unique identifiers)
- Password is **NEVER** stored in plain text
- Timestamps are automatically managed via JPA lifecycle hooks

### 2. Entity Model

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String email;
    
    @Column(unique = true)
    private String studentId;
    
    private String password; // BCrypt hashed
    private String fullName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 3. Password Encryption

**Algorithm**: BCrypt with default strength (10 rounds)

**Implementation**: `/backend/src/main/java/com/uiu/campus/service/AuthService.java`

```java
private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

// During signup
user.setPassword(passwordEncoder.encode(request.getPassword()));

// During login
passwordEncoder.matches(request.getPassword(), user.getPassword())
```

**Why BCrypt?**
- Industry-standard password hashing algorithm
- Built-in salt generation
- Adaptive function (can increase work factor over time)
- Resistant to rainbow table attacks

### 4. Repository Layer

**File**: `/backend/src/main/java/com/uiu/campus/repository/UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByStudentId(String studentId);
    boolean existsByEmail(String email);
    boolean existsByStudentId(String studentId);
}
```

---

## Frontend Storage

### 1. Browser LocalStorage

**Location**: Client browser's localStorage

**Stored Items:**

| Key | Value | Format | Purpose |
|-----|-------|--------|---------|
| `token` | JWT string | String | Authentication token |
| `user` | User object | JSON string | User profile data |

**Example Storage:**
```javascript
// Token
localStorage.setItem('token', 'eyJhbGciOiJIUzUxMiJ9...');

// User Object
localStorage.setItem('user', JSON.stringify({
    id: 1,
    email: "student@uiu.edu",
    studentId: "123456789",
    fullName: "John Doe",
    token: "eyJhbGciOiJIUzUxMiJ9..."
}));
```

### 2. AuthContext Implementation

**File**: `/frontend/src/context/AuthContext.tsx`

**State Management:**
```typescript
interface AuthContextType {
    user: AuthResponse | null;      // Current user data
    token: string | null;            // JWT token
    login: (response: AuthResponse) => void;   // Login handler
    logout: () => void;              // Logout handler
    isAuthenticated: boolean;        // Auth status flag
}
```

**Auto-Login on Page Load:**
```typescript
useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
    }
}, []);
```

**Login Function:**
```typescript
const login = (response: AuthResponse) => {
    setToken(response.token);
    setUser(response);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
};
```

**Logout Function:**
```typescript
const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
```

---

## Authentication Flow

### 1. Signup Process

```
User Input (Frontend)
    ↓
POST /api/auth/signup
    ↓
AuthController.signup()
    ↓
AuthService.signup()
    ↓
1. Validate email/studentId format
2. Check if user exists
3. Hash password with BCrypt
4. Save user to database
5. Generate JWT token
    ↓
Return AuthResponse {token, id, email, studentId, fullName}
    ↓
Frontend stores in localStorage
    ↓
User redirected to dashboard
```

### 2. Login Process

```
User Input (Frontend)
    ↓
POST /api/auth/login
    ↓
AuthController.login()
    ↓
AuthService.login()
    ↓
1. Find user by email OR studentId
2. Verify password with BCrypt
3. Generate new JWT token
    ↓
Return AuthResponse {token, id, email, studentId, fullName}
    ↓
Frontend stores in localStorage
    ↓
User authenticated and redirected
```

### 3. Protected Route Access

```
User navigates to protected page
    ↓
PrivateRoute component checks isAuthenticated
    ↓
If authenticated:
    - Retrieve token from localStorage
    - Include token in API request headers
    - Backend validates JWT token
    - Extract userId from token
    - Process request
    ↓
If not authenticated:
    - Redirect to login page
```

---

## Security Implementation

### 1. JWT Token Structure

**File**: `/backend/src/main/java/com/uiu/campus/security/JwtTokenProvider.java`

**Token Configuration:**
- **Algorithm**: HS512 (HMAC with SHA-512)
- **Secret Key**: Configurable via `application.properties` (default: 64-character string)
- **Expiration**: 24 hours (86400000 milliseconds)
- **Payload**: User ID only

**Token Generation:**
```java
public String generateToken(String userId) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(key, SignatureAlgorithm.HS512)
            .compact();
}
```

**Token Validation:**
```java
public boolean validateToken(String token) {
    try {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

**Extract User ID:**
```java
public String getUserIdFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    Claims claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
    return claims.getSubject();
}
```

### 2. Input Validation

**Email Validation:**
```java
private static final String EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

private boolean isValidEmail(String email) {
    if (email == null || email.isEmpty()) return false;
    return Pattern.matches(EMAIL_PATTERN, email);
}
```

**Student ID Validation:**
```java
private static final String STUDENT_ID_PATTERN = "^\\d{9,11}$";

private boolean isValidStudentId(String studentId) {
    if (studentId == null || studentId.isEmpty()) return false;
    return Pattern.matches(STUDENT_ID_PATTERN, studentId);
}
```

### 3. CORS Configuration

**File**: `/backend/src/main/java/com/uiu/campus/controller/AuthController.java`

```java
@CrossOrigin(origins = "http://localhost:3000")
```

**Note**: For production, configure proper CORS policies to allow only trusted domains.

---

## Data Lifecycle

### 1. Data Creation (Signup)

1. User submits signup form
2. Frontend sends POST request to `/api/auth/signup`
3. Backend validates input
4. Password is hashed with BCrypt
5. User record created in database with timestamps
6. JWT token generated
7. Response sent to frontend
8. Frontend stores token and user data in localStorage

### 2. Data Retrieval (Login)

1. User submits login credentials
2. Frontend sends POST request to `/api/auth/login`
3. Backend queries database by email or studentId
4. Password verified using BCrypt
5. New JWT token generated
6. User data retrieved from database
7. Response sent to frontend
8. Frontend updates localStorage

### 3. Data Update

1. User modifies profile (future feature)
2. `updatedAt` timestamp automatically updated via `@PreUpdate`
3. New data persisted to database

### 4. Session Persistence

1. User closes/refreshes browser
2. On app initialization, `useEffect` hook runs
3. localStorage checked for `token` and `user`
4. If found, user automatically logged in
5. Token validated on subsequent API calls

### 5. Data Deletion (Logout)

1. User clicks logout
2. Frontend removes `token` and `user` from localStorage
3. User state cleared from React context
4. User redirected to login page
5. Database record remains intact (soft logout)

---

## API Endpoints

### 1. Signup

**Endpoint**: `POST /api/auth/signup`

**Request Body:**
```json
{
    "email": "student@uiu.edu",
    "studentId": "123456789",
    "fullName": "John Doe",
    "password": "securePassword123"
}
```

**Success Response (201 Created):**
```json
{
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "id": 1,
    "email": "student@uiu.edu",
    "studentId": "123456789",
    "fullName": "John Doe"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or user already exists
- `500 Internal Server Error`: Server-side error

### 2. Login

**Endpoint**: `POST /api/auth/login`

**Request Body:**
```json
{
    "email": "student@uiu.edu",
    "password": "securePassword123"
}
```

OR

```json
{
    "studentId": "123456789",
    "password": "securePassword123"
}
```

**Success Response (200 OK):**
```json
{
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "id": 1,
    "email": "student@uiu.edu",
    "studentId": "123456789",
    "fullName": "John Doe"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server-side error

---

## Best Practices & Recommendations

### ✅ Currently Implemented

1. **Password Hashing**: BCrypt with salt
2. **JWT Authentication**: Stateless token-based auth
3. **Input Validation**: Email and student ID format validation
4. **Unique Constraints**: Email and student ID uniqueness enforced
5. **Automatic Timestamps**: Created/updated tracking
6. **CORS Protection**: Configured for development

### ⚠️ Security Enhancements Recommended

#### 1. **HttpOnly Cookies Instead of localStorage**

**Current Risk**: localStorage is vulnerable to XSS attacks

**Recommendation**:
```java
// Backend: Set token in httpOnly cookie
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody AuthRequest request, 
                                HttpServletResponse response) {
    AuthResponse authResponse = authService.login(request);
    
    Cookie cookie = new Cookie("token", authResponse.getToken());
    cookie.setHttpOnly(true);
    cookie.setSecure(true); // HTTPS only
    cookie.setPath("/");
    cookie.setMaxAge(86400); // 24 hours
    response.addCookie(cookie);
    
    return ResponseEntity.ok(authResponse);
}
```

#### 2. **Refresh Token Implementation**

**Current Risk**: Long-lived access tokens increase security risk

**Recommendation**:
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) stored in httpOnly cookie
- Automatic token refresh before expiration

#### 3. **Rate Limiting for Login Attempts**

**Current Risk**: Vulnerable to brute force attacks

**Recommendation**:
```java
// Add dependency: spring-boot-starter-data-redis
// Implement login attempt tracking
@Service
public class LoginAttemptService {
    private final LoadingCache<String, Integer> attemptsCache;
    
    public void loginFailed(String key) {
        int attempts = attemptsCache.get(key);
        attemptsCache.put(key, attempts + 1);
    }
    
    public boolean isBlocked(String key) {
        return attemptsCache.get(key) >= MAX_ATTEMPTS;
    }
}
```

#### 4. **Database Column Encryption**

**Current Risk**: Sensitive data stored in plain text

**Recommendation**:
```java
@Convert(converter = EmailEncryptor.class)
@Column(unique = true)
private String email;
```

#### 5. **Audit Logging**

**Recommendation**: Log all authentication events
```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    private Long userId;
    private String action; // LOGIN, LOGOUT, SIGNUP
    private String ipAddress;
    private LocalDateTime timestamp;
}
```

#### 6. **Password Strength Requirements**

**Recommendation**:
```java
private static final String PASSWORD_PATTERN = 
    "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$";
```

#### 7. **Environment-Specific Configuration**

**File**: `/backend/src/main/resources/application.properties`

```properties
# Production settings
jwt.secret=${JWT_SECRET_ENV_VAR}
jwt.expiration=900000  # 15 minutes
spring.datasource.url=${DATABASE_URL}
server.ssl.enabled=true
```

#### 8. **Token Blacklisting for Logout**

**Recommendation**: Implement token blacklist in Redis
```java
@Service
public class TokenBlacklistService {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    public void blacklistToken(String token, long expirationTime) {
        redisTemplate.opsForValue().set(token, "blacklisted", 
            expirationTime, TimeUnit.MILLISECONDS);
    }
    
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey(token)
        );
    }
}
```

---

## Configuration Files

### Backend Configuration

**File**: `/backend/src/main/resources/application.properties`

```properties
# JWT Configuration
jwt.secret=MyVerySecureSecretKeyForJWTTokenGenerationAndValidation12345
jwt.expiration=86400000  # 24 hours in milliseconds

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/campus_navigation
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update

# Logging
logging.level.com.uiu.campus=INFO
```

### Frontend API Configuration

**File**: `/frontend/src/services/api.ts`

```typescript
const API_BASE_URL = 'http://localhost:8080/api';

// Include token in requests
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

---

## Testing the Storage

### Test Signup
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@uiu.edu",
    "studentId": "123456789",
    "fullName": "Test User",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@uiu.edu",
    "password": "password123"
  }'
```

### Check Database
```sql
-- View all users
SELECT id, email, student_id, full_name, created_at 
FROM users;

-- Verify password is hashed
SELECT password FROM users WHERE email = 'test@uiu.edu';
```

### Check Browser Storage
```javascript
// Open browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

---

## Troubleshooting

### Common Issues

1. **Token Expired**: User needs to login again
2. **CORS Errors**: Check backend CORS configuration
3. **Password Mismatch**: Verify BCrypt encoding/matching
4. **localStorage Not Available**: Check browser privacy settings
5. **Database Connection Failed**: Verify database credentials

### Debug Logging

Enable debug logging in `application.properties`:
```properties
logging.level.com.uiu.campus.service.AuthService=DEBUG
logging.level.com.uiu.campus.security.JwtTokenProvider=DEBUG
```

---

## Summary

**Where User Login Details Are Saved:**

1. **Database** (Persistent):
   - Email, Student ID, Hashed Password, Full Name
   - Stored in `users` table
   - Password encrypted with BCrypt

2. **Browser localStorage** (Session):
   - JWT token (for authentication)
   - User profile (id, email, studentId, fullName)
   - Auto-loaded on page refresh

3. **JWT Token** (Temporary):
   - Contains user ID
   - Valid for 24 hours
   - Used for API authentication

**Security**: Passwords are never stored in plain text, JWT tokens are signed and validated, and sensitive operations are logged.

**Lifecycle**: Data created on signup, retrieved on login, persisted across sessions via localStorage, and removed on logout.
