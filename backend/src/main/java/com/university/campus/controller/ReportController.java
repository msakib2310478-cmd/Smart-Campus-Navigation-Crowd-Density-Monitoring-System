package com.university.campus.controller;

import com.university.campus.model.Report;
import com.university.campus.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public List<Report> getAllReports() {
        return reportService.getAllReports();
    }

    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Report report) {
        if (report.getZoneId() == null || report.getIssue() == null) {
            return ResponseEntity.badRequest().build();
        }

        Report created = reportService.createReport(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
