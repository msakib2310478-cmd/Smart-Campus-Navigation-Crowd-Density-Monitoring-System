package com.uiu.campus.service;

import com.uiu.campus.dto.AuthRequest;
import com.uiu.campus.dto.AuthResponse;
import com.uiu.campus.model.AuditLog;
import com.uiu.campus.model.User;
import com.uiu.campus.repository.UserRepository;
import com.uiu.campus.security.JwtTokenProvider;
import com.uiu.campus.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;
    private final LoginAttemptService loginAttemptService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final String EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
    private static final String STUDENT_ID_PATTERN = "^\\d{9,11}$";

    public AuthResponse signup(AuthRequest request) {
        return signup(request, null, null);
    }

    public AuthResponse signup(AuthRequest request, String ipAddress, String userAgent) {
        Long userId = null;
        try {
            // Validate email or student ID (either is acceptable)
            if (!isValidEmail(request.getEmail()) && !isValidStudentId(request.getStudentId())) {
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                        false, "Invalid email or student ID format");
                throw new IllegalArgumentException("Provide a valid email address or a 9-11 digit student ID");
            }

            // Validate password strength
            if (!PasswordValidator.isValid(request.getPassword())) {
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                        false, "Password does not meet requirements");
                throw new IllegalArgumentException(PasswordValidator.getRequirements());
            }

            // Check if user already exists
            if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                        false, "Email already registered");
                throw new IllegalArgumentException("Email already registered");
            }
            if (request.getStudentId() != null && userRepository.existsByStudentId(request.getStudentId())) {
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                        false, "Student ID already registered");
                throw new IllegalArgumentException("Student ID already registered");
            }

            // Create new user
            User user = new User();
            user.setEmail(request.getEmail());
            user.setStudentId(request.getStudentId());
            user.setFullName(request.getFullName());
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            user = userRepository.save(user);
            userId = user.getId();
            log.info("User signed up: {}", user.getId());

            String token = jwtTokenProvider.generateToken(user.getId().toString());
            
            auditLogService.logAuthEvent(user.getId(), AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                    true, null);
            
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getStudentId(), user.getFullName());
        } catch (IllegalArgumentException e) {
            if (userId != null) {
                auditLogService.logAuthEvent(userId, AuditLog.AuditAction.SIGNUP, ipAddress, userAgent, 
                        false, e.getMessage());
            }
            throw e;
        }
    }

    public AuthResponse login(AuthRequest request) {
        return login(request, null, null);
    }

    public AuthResponse login(AuthRequest request, String ipAddress, String userAgent) {
        User user = null;
        String identifier = request.getEmail() != null ? request.getEmail() : request.getStudentId();

        try {
            // Check if login is blocked
            if (loginAttemptService.isBlocked(identifier)) {
                log.warn("Login attempt for blocked identifier: {}", identifier);
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.LOGIN_FAILED, ipAddress, userAgent, 
                        false, "Account temporarily blocked due to multiple failed attempts");
                throw new IllegalArgumentException("Account temporarily blocked due to multiple failed login attempts. Please try again later.");
            }

            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
                if (optionalUser.isPresent() && passwordEncoder.matches(request.getPassword(), optionalUser.get().getPassword())) {
                    user = optionalUser.get();
                }
            }

            if (user == null && request.getStudentId() != null && !request.getStudentId().isEmpty()) {
                Optional<User> optionalUser = userRepository.findByStudentId(request.getStudentId());
                if (optionalUser.isPresent() && passwordEncoder.matches(request.getPassword(), optionalUser.get().getPassword())) {
                    user = optionalUser.get();
                }
            }

            if (user == null) {
                loginAttemptService.recordLoginAttempt(identifier, false);
                int remainingAttempts = loginAttemptService.getRemainingAttempts(identifier);
                
                auditLogService.logAuthEvent(null, AuditLog.AuditAction.LOGIN_FAILED, ipAddress, userAgent, 
                        false, "Invalid credentials");
                
                String errorMsg = "Invalid credentials";
                if (remainingAttempts > 0 && remainingAttempts < 5) {
                    errorMsg += ". " + remainingAttempts + " attempts remaining before account is temporarily blocked.";
                }
                throw new IllegalArgumentException(errorMsg);
            }

            // Successful login
            loginAttemptService.recordLoginAttempt(identifier, true);
            
            log.info("User logged in: {}", user.getId());
            String token = jwtTokenProvider.generateToken(user.getId().toString());
            
            auditLogService.logAuthEvent(user.getId(), AuditLog.AuditAction.LOGIN, ipAddress, userAgent, 
                    true, null);
            
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getStudentId(), user.getFullName());
        } catch (IllegalArgumentException e) {
            throw e;
        }
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User getUserFromToken(String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("Invalid token");
        }
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        return getUserById(Long.parseLong(userId));
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) return false;
        return Pattern.matches(EMAIL_PATTERN, email);
    }

    private boolean isValidStudentId(String studentId) {
        if (studentId == null || studentId.isEmpty()) return false;
        return Pattern.matches(STUDENT_ID_PATTERN, studentId);
    }
}
