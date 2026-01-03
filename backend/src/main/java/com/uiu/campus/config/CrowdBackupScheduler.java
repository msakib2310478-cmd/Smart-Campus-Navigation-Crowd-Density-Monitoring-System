package com.uiu.campus.config;

import com.uiu.campus.service.CrowdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class CrowdBackupScheduler {
    private final CrowdService crowdService;

    @Scheduled(fixedRate = 3600000) // 1 hour
    public void backupCrowdData() {
        log.info("Running scheduled crowd data backup");
        crowdService.backupCrowdData();
    }
}
