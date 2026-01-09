package com.uiu.campus.service;

import com.uiu.campus.model.AuditLog;
import com.uiu.campus.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public void logAuthEvent(Long userId, AuditLog.AuditAction action, String ipAddress, 
                            String userAgent, boolean success, String errorMessage) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setSuccess(success);
        auditLog.setErrorMessage(errorMessage);
        
        auditLogRepository.save(auditLog);
        
        log.info("Audit log created: userId={}, action={}, success={}, ip={}", 
                userId, action, success, ipAddress);
    }

    public List<AuditLog> getUserAuditLogs(Long userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public List<AuditLog> getAuditLogsByAction(AuditLog.AuditAction action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByTimestampBetween(start, end);
    }

    public List<AuditLog> getAuditLogsByIpAddress(String ipAddress) {
        return auditLogRepository.findByIpAddress(ipAddress);
    }
}

