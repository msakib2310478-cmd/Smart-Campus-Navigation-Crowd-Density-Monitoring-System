package com.uiu.campus.service;

import com.uiu.campus.model.LoginAttempt;
import com.uiu.campus.repository.LoginAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptService {
    private final LoginAttemptRepository loginAttemptRepository;
    
    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_DURATION_MINUTES = 15;
    private static final int RESET_DURATION_MINUTES = 30;

    @Transactional
    public void recordLoginAttempt(String identifier, boolean success) {
        Optional<LoginAttempt> existingAttempt = loginAttemptRepository.findByIdentifier(identifier);
        
        if (success) {
            // Reset attempts on successful login
            existingAttempt.ifPresent(loginAttemptRepository::delete);
            log.info("Login successful for identifier: {}, attempts reset", identifier);
        } else {
            LoginAttempt attempt = existingAttempt.orElse(new LoginAttempt());
            attempt.setIdentifier(identifier);
            
            // Reset count if last attempt was too long ago
            if (attempt.getLastAttemptTime() != null && 
                attempt.getLastAttemptTime().plusMinutes(RESET_DURATION_MINUTES).isBefore(LocalDateTime.now())) {
                attempt.setAttemptCount(1);
            } else {
                attempt.setAttemptCount((attempt.getAttemptCount() == null ? 0 : attempt.getAttemptCount()) + 1);
            }
            
            // Block if max attempts reached
            if (attempt.getAttemptCount() >= MAX_ATTEMPTS) {
                attempt.setBlockedUntil(LocalDateTime.now().plusMinutes(BLOCK_DURATION_MINUTES));
                log.warn("Login blocked for identifier: {} until {}", identifier, attempt.getBlockedUntil());
            }
            
            loginAttemptRepository.save(attempt);
            log.info("Failed login attempt for identifier: {}, total attempts: {}", 
                    identifier, attempt.getAttemptCount());
        }
    }

    public boolean isBlocked(String identifier) {
        Optional<LoginAttempt> attempt = loginAttemptRepository.findByIdentifier(identifier);
        
        if (attempt.isEmpty()) {
            return false;
        }
        
        LoginAttempt loginAttempt = attempt.get();
        
        // Check if block has expired
        if (loginAttempt.getBlockedUntil() != null) {
            if (loginAttempt.getBlockedUntil().isAfter(LocalDateTime.now())) {
                return true;
            } else {
                // Block expired, reset
                loginAttemptRepository.delete(loginAttempt);
                return false;
            }
        }
        
        return false;
    }

    public int getRemainingAttempts(String identifier) {
        Optional<LoginAttempt> attempt = loginAttemptRepository.findByIdentifier(identifier);
        
        if (attempt.isEmpty()) {
            return MAX_ATTEMPTS;
        }
        
        int remaining = MAX_ATTEMPTS - attempt.get().getAttemptCount();
        return Math.max(0, remaining);
    }

    public LocalDateTime getBlockedUntil(String identifier) {
        Optional<LoginAttempt> attempt = loginAttemptRepository.findByIdentifier(identifier);
        return attempt.map(LoginAttempt::getBlockedUntil).orElse(null);
    }
}
