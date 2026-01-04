package com.uiu.campus.repository;

import com.uiu.campus.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    Optional<LoginAttempt> findByIdentifier(String identifier);
    void deleteByIdentifier(String identifier);
}
