package com.telecom.nqms.controller;

import com.telecom.nqms.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Executive network and RTU report generation APIs")
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/health")
    @Operation(summary = "Generate a network or RTU health report")
    public ResponseEntity<ReportService.ReportResponse> generateHealthReport(@RequestBody ReportService.ReportRequest request) {
        return ResponseEntity.ok(reportService.generateHealthReport(request));
    }
}