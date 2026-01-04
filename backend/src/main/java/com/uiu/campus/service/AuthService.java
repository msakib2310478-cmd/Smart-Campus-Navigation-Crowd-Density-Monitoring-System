package com.uiu.campus.service;

import com.uiu.campus.dto.AuthRequest;
import com.uiu.campus.dto.AuthResponse;
import com.uiu.campus.model.User;
import com.uiu.campus.repository.UserRepository;
import com.uiu.campus.security.JwtTokenProvider;
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
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final String EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
    private static final String STUDENT_ID_PATTERN = "^\\d{9,11}$";

    public AuthResponse signup(AuthRequest request) {
        // Validate email or student ID (either is acceptable)
        if (!isValidEmail(request.getEmail()) && !isValidStudentId(request.getStudentId())) {
            throw new IllegalArgumentException("Provide a valid email address or a 9-11 digit student ID");
        }

        // Check if user already exists
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (request.getStudentId() != null && userRepository.existsByStudentId(request.getStudentId())) {
            throw new IllegalArgumentException("Student ID already registered");
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setStudentId(request.getStudentId());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user = userRepository.save(user);
        log.info("User signed up: {}", user.getId());

        String token = jwtTokenProvider.generateToken(user.getId().toString());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getStudentId(), user.getFullName());
    }

    public AuthResponse login(AuthRequest request) {
        User user = null;

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
            throw new IllegalArgumentException("Invalid credentials");
        }

        log.info("User logged in: {}", user.getId());
        String token = jwtTokenProvider.generateToken(user.getId().toString());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getStudentId(), user.getFullName());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
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
