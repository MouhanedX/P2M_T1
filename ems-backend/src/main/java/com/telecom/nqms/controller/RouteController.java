package com.telecom.nqms.controller;

import com.telecom.nqms.model.OtdrTestResult;
import com.telecom.nqms.model.Route;
import com.telecom.nqms.repository.OtdrTestResultRepository;
import com.telecom.nqms.repository.RouteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "Routes", description = "Fiber route management APIs")
public class RouteController {

    private static final int STANDARD_WAVELENGTH_NM = 1625;
    private static final Pattern ROUTE_SUFFIX_PATTERN = Pattern.compile("(?:^|_)R(\\d+)(?:$|_)", Pattern.CASE_INSENSITIVE);

    private final RouteRepository routeRepository;
    private final OtdrTestResultRepository testResultRepository;

    @GetMapping
    @Operation(summary = "Get all routes")
    public ResponseEntity<List<Route>> getAllRoutes() {
        return ResponseEntity.ok(sortRoutesByRtuAndRouteId(routeRepository.findAll()));
    }

    @GetMapping("/{routeId}")
    @Operation(summary = "Get route by routeId")
    public ResponseEntity<Route> getRoute(@PathVariable String routeId) {
        return routeRepository.findByRouteId(routeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rtu/{rtuId}")
    @Operation(summary = "Get routes by RTU")
    public ResponseEntity<List<Route>> getRoutesByRtu(@PathVariable String rtuId) {
        return ResponseEntity.ok(sortRoutesByRouteId(routeRepository.findByRtuId(rtuId)));
    }

    @PostMapping("/telemetry")
    @Operation(summary = "Ingest OTDR telemetry for route update + test history")
    public ResponseEntity<Route> ingestTelemetry(@RequestBody RouteTelemetryRequest request) {
        if (request.routeId == null || request.routeId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Route route = routeRepository.findByRouteId(request.routeId)
                .orElseGet(() -> Route.builder()
                        .routeId(request.routeId)
                        .routeName(request.routeId)
                        .rtuId(request.rtuId)
                        .region("Unknown")
                        .status(Route.RouteStatus.UNKNOWN)
                        .currentCondition(Route.CurrentCondition.builder().wavelengthNm(STANDARD_WAVELENGTH_NM).build())
                        .build());

        if (route.getCurrentCondition() == null) {
            route.setCurrentCondition(Route.CurrentCondition.builder().wavelengthNm(STANDARD_WAVELENGTH_NM).build());
        }

        int normalizedWavelengthNm = STANDARD_WAVELENGTH_NM;
        Route.CurrentCondition condition = route.getCurrentCondition();
        condition.setLastTestTime(request.measuredAt != null ? request.measuredAt : Instant.now());
        condition.setTotalLossDb(request.totalLossDb);
        condition.setAttenuationDb(request.totalLossDb);
        condition.setEventCount(request.eventCount);
        condition.setTestMode(request.testMode);
        condition.setPulseWidthNs(request.pulseWidthNs);
        condition.setDynamicRangeDb(request.dynamicRangeDb);
        condition.setWavelengthNm(normalizedWavelengthNm);
        condition.setTestResult(request.testResult);
        condition.setFaultDistanceKm(request.faultDistanceKm);
        condition.setEventReferenceFile(request.eventReferenceFile);
        condition.setMeasurementReferenceFile(request.measurementReferenceFile);
        condition.setAveragePowerDb(request.averagePowerDb);
        condition.setPowerVariationDb(request.powerVariationDb);
        condition.setRouteStatus("NORMAL".equalsIgnoreCase(request.status) ? "Active" : "Inactive");

        if ("BREAK".equalsIgnoreCase(request.status)) {
            route.setStatus(Route.RouteStatus.BREAK);
        } else if ("DEGRADATION".equalsIgnoreCase(request.status)) {
            route.setStatus(Route.RouteStatus.DEGRADATION);
        } else if ("NORMAL".equalsIgnoreCase(request.status)) {
            route.setStatus(Route.RouteStatus.NORMAL);
        }

        Route savedRoute = routeRepository.save(route);

        OtdrTestResult result = OtdrTestResult.builder()
                .routeId(request.routeId)
                .rtuId(request.rtuId)
                .testMode(request.testMode)
                .pulseWidthNs(request.pulseWidthNs)
                .dynamicRangeDb(request.dynamicRangeDb)
                .wavelengthNm(normalizedWavelengthNm)
                .testResult(request.testResult)
                .totalLossDb(request.totalLossDb)
                .eventCount(request.eventCount)
                .faultDistanceKm(request.faultDistanceKm)
                .status(request.status)
                .eventReferenceFile(request.eventReferenceFile)
                .measurementReferenceFile(request.measurementReferenceFile)
                .averagePowerDb(request.averagePowerDb)
                .powerVariationDb(request.powerVariationDb)
                .measuredAt(request.measuredAt != null ? request.measuredAt : Instant.now())
                .rtuHealth(mapRtuHealth(request.rtuHealth))
                .build();
        testResultRepository.save(result);

        return ResponseEntity.ok(savedRoute);
    }

    private List<Route> sortRoutesByRtuAndRouteId(List<Route> routes) {
        return routes.stream()
                .sorted(Comparator
                        .comparing((Route route) -> sanitize(route.getRtuId()), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing((left, right) -> compareRouteIds(left.getRouteId(), right.getRouteId())))
                .toList();
    }

    private List<Route> sortRoutesByRouteId(List<Route> routes) {
        return routes.stream()
                .sorted((left, right) -> compareRouteIds(left.getRouteId(), right.getRouteId()))
                .toList();
    }

    private int compareRouteIds(String leftRouteId, String rightRouteId) {
        int leftOrder = extractRouteOrder(leftRouteId);
        int rightOrder = extractRouteOrder(rightRouteId);
        if (leftOrder != rightOrder) {
            return Integer.compare(leftOrder, rightOrder);
        }
        return sanitize(leftRouteId).compareToIgnoreCase(sanitize(rightRouteId));
    }

    private int extractRouteOrder(String routeId) {
        Matcher matcher = ROUTE_SUFFIX_PATTERN.matcher(sanitize(routeId));
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return Integer.MAX_VALUE;
            }
        }
        return Integer.MAX_VALUE;
    }

    private String sanitize(String value) {
        return value == null ? "" : value;
    }

    private static OtdrTestResult.RtuHealth mapRtuHealth(RouteTelemetryRequest.RtuHealthRequest healthRequest) {
        if (healthRequest == null) {
            return null;
        }
        return OtdrTestResult.RtuHealth.builder()
                .temperatureC(healthRequest.temperatureC)
                .cpuUsagePercent(healthRequest.cpuUsagePercent)
                .memoryUsagePercent(healthRequest.memoryUsagePercent)
                .powerSupplyStatus(healthRequest.powerSupplyStatus)
                .build();
    }

    @Data
    @NoArgsConstructor  
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RouteTelemetryRequest {
        private String routeId;
        private String rtuId;
        private String testMode;
        private Integer pulseWidthNs;
        private Double dynamicRangeDb;
        private Integer wavelengthNm;
        private String testResult;
        private Double totalLossDb;
        private Integer eventCount;
        private Double faultDistanceKm;
        private String status;
        private Instant measuredAt;
        private String eventReferenceFile;
        private String measurementReferenceFile;
        private Double averagePowerDb;
        private Double powerVariationDb;
        private RtuHealthRequest rtuHealth;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class RtuHealthRequest {
            @JsonProperty("temperatureC")
            private Double temperatureC;
            
            @JsonProperty("cpuUsagePercent")
            private Double cpuUsagePercent;
            
            @JsonProperty("memoryUsagePercent")
            private Double memoryUsagePercent;
            
            @JsonProperty("powerSupplyStatus")
            private String powerSupplyStatus;
        }
    }
}
