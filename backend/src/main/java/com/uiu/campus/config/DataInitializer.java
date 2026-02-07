package com.uiu.campus.config;

import com.uiu.campus.model.Role;
import com.uiu.campus.model.User;
import com.uiu.campus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initializes default data on application startup.
 * Creates a default admin account if none exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Default admin credentials (should be changed after first login in production)
    private static final String DEFAULT_ADMIN_EMAIL = "itamim2331054@bscse.uiu.ac.bd";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";
    private static final String DEFAULT_ADMIN_NAME = "Istiaq Ahmed Tamim";

    @Override
    public void run(String... args) {
        createDefaultAdminIfNotExists();
    }

    private void createDefaultAdminIfNotExists() {
        // Check if any admin exists
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(user -> Role.ADMIN.equals(user.getRole()));

        if (!adminExists) {
            // Check if the default admin email is already taken (as a regular user)
            if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
                // Upgrade existing user to admin
                User existingUser = userRepository.findByEmail(DEFAULT_ADMIN_EMAIL).orElse(null);
                if (existingUser != null) {
                    existingUser.setRole(Role.ADMIN);
                    userRepository.save(existingUser);
                    log.info("===========================================");
                    log.info("Upgraded existing user to ADMIN: {}", DEFAULT_ADMIN_EMAIL);
                    log.info("===========================================");
                }
            } else {
                // Create new admin user
                User admin = new User();
                admin.setEmail(DEFAULT_ADMIN_EMAIL);
                admin.setFullName(DEFAULT_ADMIN_NAME);
                admin.setPassword(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
                admin.setRole(Role.ADMIN);

                userRepository.save(admin);

                log.info("===========================================");
                log.info("DEFAULT ADMIN ACCOUNT CREATED");
                log.info("Email: {}", DEFAULT_ADMIN_EMAIL);
                log.info("Password: {}", DEFAULT_ADMIN_PASSWORD);
                log.info("Please change this password after first login!");
                log.info("===========================================");
            }
        } else {
            log.info("Admin account already exists, skipping creation");
        }
    }
}
