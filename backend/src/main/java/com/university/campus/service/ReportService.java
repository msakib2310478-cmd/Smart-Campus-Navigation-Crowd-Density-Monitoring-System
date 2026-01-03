package com.university.campus.service;

import com.university.campus.model.Report;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ReportService {

    private final Map<String, Report> reports = new ConcurrentHashMap<>();
    private final AtomicInteger idCounter = new AtomicInteger(1);

    public List<Report> getAllReports() {
        return new ArrayList<>(reports.values());
    }

    public Report createReport(Report report) {
        String id = "REPORT-" + idCounter.getAndIncrement();
        report.setId(id);
        reports.put(id, report);
        return report;
    }

    public Optional<Report> getReportById(String id) {
        return Optional.ofNullable(reports.get(id));
    }
}
