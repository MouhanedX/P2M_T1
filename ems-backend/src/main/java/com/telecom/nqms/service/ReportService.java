package com.telecom.nqms.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.telecom.nqms.model.Alarm;
import com.telecom.nqms.model.Kpi;
import com.telecom.nqms.model.OtdrTestResult;
import com.telecom.nqms.model.Route;
import com.telecom.nqms.repository.AlarmRepository;
import com.telecom.nqms.repository.KpiRepository;
import com.telecom.nqms.repository.OtdrTestResultRepository;
import com.telecom.nqms.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter DAY_LABEL_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final Set<String> PASS_VALUES = Set.of("PASS", "PASSED", "OK", "SUCCESS", "SUCCESSFUL");
    private static final Set<String> FAIL_VALUES = Set.of("FAIL", "FAILED", "ERROR", "KO", "NOK");

    private final RouteRepository routeRepository;
    private final AlarmRepository alarmRepository;
    private final OtdrTestResultRepository otdrTestResultRepository;
    private final KpiRepository kpiRepository;

    public ReportResponse generateHealthReport(ReportRequest request) {
        ReportScope scope = parseScope(request.scope());
        Instant normalizedEnd = request.end() != null ? request.end() : Instant.now();
        Instant normalizedStart = request.start() != null ? request.start() : normalizedEnd.minus(7, ChronoUnit.DAYS);

        if (normalizedStart.isAfter(normalizedEnd)) {
            Instant swap = normalizedStart;
            normalizedStart = normalizedEnd;
            normalizedEnd = swap;
        }

        String normalizedRtuId = normalizeText(request.rtuId());
        List<Route> routes = scope == ReportScope.RTU && !normalizedRtuId.isBlank()
                ? routeRepository.findByRtuId(normalizedRtuId)
                : routeRepository.findAll();

        List<Alarm> alarms = scope == ReportScope.RTU && !normalizedRtuId.isBlank()
                ? alarmRepository.findByRtuIdAndLifecycleCreatedAtBetweenOrderByLifecycleCreatedAtAsc(normalizedRtuId, normalizedStart, normalizedEnd)
                : alarmRepository.findByLifecycleCreatedAtBetweenOrderByLifecycleCreatedAtAsc(normalizedStart, normalizedEnd);

        List<OtdrTestResult> tests = scope == ReportScope.RTU && !normalizedRtuId.isBlank()
                ? otdrTestResultRepository.findByRtuIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(normalizedRtuId, normalizedStart, normalizedEnd)
                : otdrTestResultRepository.findByMeasuredAtBetweenOrderByMeasuredAtAsc(normalizedStart, normalizedEnd);

        List<Kpi> kpis = scope == ReportScope.NETWORK
                ? kpiRepository.findByKpiTypeAndPeriodBetween(
                        Kpi.KpiType.NETWORK_HEALTH,
                        Kpi.Period.REALTIME,
                        normalizedStart,
                        normalizedEnd)
                : List.of();

        Map<String, String> routeNamesById = buildRouteNameMap(routes);
        List<RouteStatusPoint> routeStatusSeries = buildRouteStatusSeries(routes);
        List<AvailabilityPoint> availabilitySeries = scope == ReportScope.NETWORK
                ? buildAvailabilitySeriesFromKpis(kpis)
                : buildAvailabilitySeriesFromTests(tests);
        if (availabilitySeries.isEmpty() && !routes.isEmpty()) {
            double snapshotAvailability = calculateRouteAvailability(routes);
            availabilitySeries = List.of(new AvailabilityPoint(
                    normalizedEnd.atZone(ZoneOffset.UTC).toLocalDate(),
                    formatDayLabel(normalizedEnd.atZone(ZoneOffset.UTC).toLocalDate()),
                    round2(snapshotAvailability)
            ));
        }

        List<AlarmSeverityPoint> severitySeries = buildSeveritySeries(alarms);
        List<AlarmTrendPoint> alarmTrendSeries = buildAlarmTrendSeries(alarms, normalizedStart, normalizedEnd);
        List<TestTrendPoint> testTrendSeries = buildTestTrendSeries(tests, normalizedStart, normalizedEnd);
        List<AlarmEntry> alarmHistory = buildAlarmHistory(alarms, routeNamesById);
        Summary summary = buildSummary(scope, routes, alarms, tests, availabilitySeries, routeStatusSeries);
        RtuSnapshot rtuSnapshot = buildRtuSnapshot(scope, tests);

        String scopeLabel = scope == ReportScope.NETWORK
                ? "Entire network"
                : "RTU " + (normalizedRtuId.isBlank() ? "unknown" : normalizedRtuId);
        String title = scope == ReportScope.NETWORK
            ? "Network Health Report"
            : (normalizedRtuId.isBlank() ? "RTU Health Report" : "RTU " + normalizedRtuId + " Health Report");
        String overview = buildOverview(scopeLabel, summary, normalizedStart, normalizedEnd);

        return new ReportResponse(
                title,
                new ScopeInfo(scope.name(), scopeLabel, normalizedRtuId.isBlank() ? null : normalizedRtuId),
                new PeriodInfo(normalizedStart, normalizedEnd, formatPeriodLabel(normalizedStart, normalizedEnd)),
                summary,
            rtuSnapshot,
                routeStatusSeries,
                availabilitySeries,
                severitySeries,
                alarmTrendSeries,
                testTrendSeries,
                alarmHistory,
                overview,
                Instant.now()
        );
    }

    private Map<String, String> buildRouteNameMap(List<Route> routes) {
        Map<String, String> routeNamesById = new LinkedHashMap<>();
        for (Route route : routes) {
            if (route == null || route.getRouteId() == null || route.getRouteId().isBlank()) {
                continue;
            }
            String routeName = normalizeText(route.getRouteName());
            routeNamesById.put(route.getRouteId(), routeName.isBlank() ? route.getRouteId() : routeName);
        }
        return routeNamesById;
    }

    private RtuSnapshot buildRtuSnapshot(ReportScope scope, List<OtdrTestResult> tests) {
        if (scope != ReportScope.RTU || tests == null || tests.isEmpty()) {
            return null;
        }

        OtdrTestResult latestTest = tests.stream()
                .filter(test -> test != null && test.getRtuHealth() != null)
                .max(Comparator.comparing(this::testTimestamp, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        if (latestTest == null || latestTest.getRtuHealth() == null) {
            return null;
        }

        OtdrTestResult.RtuHealth health = latestTest.getRtuHealth();
        return new RtuSnapshot(
                health.getTemperatureC(),
                health.getCpuUsagePercent(),
                health.getMemoryUsagePercent(),
                health.getPowerSupplyStatus(),
                testTimestamp(latestTest)
        );
    }

    private Summary buildSummary(
            ReportScope scope,
            List<Route> routes,
            List<Alarm> alarms,
            List<OtdrTestResult> tests,
            List<AvailabilityPoint> availabilitySeries,
            List<RouteStatusPoint> routeStatusSeries
    ) {
        int totalRoutes = routes.size();
        int normalRoutes = 0;
        int degradedRoutes = 0;
        int brokenRoutes = 0;
        for (Route route : routes) {
            RouteHealthState state = normalizeRouteStatus(route != null ? route.getStatus() : null);
            switch (state) {
                case NORMAL -> normalRoutes += 1;
                case DEGRADED -> degradedRoutes += 1;
                case BROKEN -> brokenRoutes += 1;
                case OTHER -> {
                }
            }
        }

        int activeAlarms = 0;
        int resolvedAlarms = 0;
        int criticalAlarms = 0;
        int highAlarms = 0;
        int mediumAlarms = 0;
        int lowAlarms = 0;
        for (Alarm alarm : alarms) {
            if (isActiveAlarm(alarm)) {
                activeAlarms += 1;
            }
            if (isResolvedAlarm(alarm)) {
                resolvedAlarms += 1;
            }

            Alarm.AlarmSeverity severity = alarm != null ? alarm.getSeverity() : null;
            if (severity == Alarm.AlarmSeverity.CRITICAL) {
                criticalAlarms += 1;
            } else if (severity == Alarm.AlarmSeverity.HIGH) {
                highAlarms += 1;
            } else if (severity == Alarm.AlarmSeverity.MEDIUM) {
                mediumAlarms += 1;
            } else if (severity == Alarm.AlarmSeverity.LOW) {
                lowAlarms += 1;
            }
        }

        int totalTests = tests.size();
        int passTests = 0;
        for (OtdrTestResult test : tests) {
            if (isPassTest(test)) {
                passTests += 1;
            }
        }
        int failTests = Math.max(0, totalTests - passTests);

        double availabilityPercent = averageAvailability(availabilitySeries)
                .orElseGet(() -> totalRoutes > 0 ? calculateRouteAvailability(routes) : 0.0);
        double passRatePercent = totalTests > 0 ? (passTests * 100.0 / totalTests) : 0.0;
        double failRatePercent = totalTests > 0 ? (failTests * 100.0 / totalTests) : 0.0;
        double mttrHours = calculateMttrHours(alarms);
        double mtbfHours = calculateMtbfHours(alarms);
        double healthScore = clamp(
                (availabilityPercent * 0.52)
                        + (passRatePercent * 0.30)
                        + (Math.max(0.0, 100.0 - (mttrHours * 8.0)) * 0.08)
                        + (Math.max(0.0, 100.0 - (activeAlarms * 3.5)) * 0.10),
                0.0,
                100.0
        );

        return new Summary(
                round2(availabilityPercent),
                round2(mttrHours),
                round2(mtbfHours),
                totalRoutes,
                normalRoutes,
                degradedRoutes,
                brokenRoutes,
                alarms.size(),
                activeAlarms,
                resolvedAlarms,
                criticalAlarms,
                highAlarms,
                mediumAlarms,
                lowAlarms,
                totalTests,
                passTests,
                failTests,
                round2(passRatePercent),
                round2(failRatePercent),
                round2(healthScore),
                scope == ReportScope.NETWORK ? "Network KPI average" : "RTU test-backed availability"
        );
    }

    private List<RouteStatusPoint> buildRouteStatusSeries(List<Route> routes) {
        int normal = 0;
        int degraded = 0;
        int broken = 0;
        int other = 0;

        for (Route route : routes) {
            RouteHealthState state = normalizeRouteStatus(route != null ? route.getStatus() : null);
            switch (state) {
                case NORMAL -> normal += 1;
                case DEGRADED -> degraded += 1;
                case BROKEN -> broken += 1;
                case OTHER -> other += 1;
            }
        }

        List<RouteStatusPoint> points = new ArrayList<>();
        points.add(new RouteStatusPoint("Normal", normal));
        points.add(new RouteStatusPoint("Degraded", degraded));
        points.add(new RouteStatusPoint("Broken", broken));
        if (other > 0) {
            points.add(new RouteStatusPoint("Other", other));
        }
        return points;
    }

    private List<AvailabilityPoint> buildAvailabilitySeriesFromKpis(List<Kpi> kpis) {
        Map<LocalDate, List<Double>> valuesByDay = new LinkedHashMap<>();
        for (Kpi kpi : kpis) {
            Double availability = kpi != null && kpi.getMetrics() != null ? kpi.getMetrics().getNetworkAvailabilityPercent() : null;
            Instant timestamp = kpi != null ? Optional.ofNullable(kpi.getTimestamp()).orElse(kpi.getCalculatedAt()) : null;
            if (availability == null || timestamp == null) {
                continue;
            }

            LocalDate day = timestamp.atZone(ZoneOffset.UTC).toLocalDate();
            valuesByDay.computeIfAbsent(day, ignored -> new ArrayList<>()).add(availability);
        }

        List<AvailabilityPoint> points = new ArrayList<>();
        for (Map.Entry<LocalDate, List<Double>> entry : valuesByDay.entrySet()) {
            double average = average(entry.getValue());
            points.add(new AvailabilityPoint(entry.getKey(), formatDayLabel(entry.getKey()), round2(average)));
        }
        return points;
    }

    private List<AvailabilityPoint> buildAvailabilitySeriesFromTests(List<OtdrTestResult> tests) {
        Map<LocalDate, List<Double>> valuesByDay = new LinkedHashMap<>();
        for (OtdrTestResult test : tests) {
            Instant timestamp = testTimestamp(test);
            if (timestamp == null) {
                continue;
            }

            LocalDate day = timestamp.atZone(ZoneOffset.UTC).toLocalDate();
            valuesByDay.computeIfAbsent(day, ignored -> new ArrayList<>()).add(isPassTest(test) ? 100.0 : 0.0);
        }

        List<AvailabilityPoint> points = new ArrayList<>();
        for (Map.Entry<LocalDate, List<Double>> entry : valuesByDay.entrySet()) {
            double average = average(entry.getValue());
            points.add(new AvailabilityPoint(entry.getKey(), formatDayLabel(entry.getKey()), round2(average)));
        }
        return points;
    }

    private List<AlarmSeverityPoint> buildSeveritySeries(List<Alarm> alarms) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("Critical", 0);
        counts.put("High", 0);
        counts.put("Medium", 0);
        counts.put("Low", 0);

        for (Alarm alarm : alarms) {
            Alarm.AlarmSeverity severity = alarm != null ? alarm.getSeverity() : null;
            if (severity == Alarm.AlarmSeverity.CRITICAL) {
                counts.put("Critical", counts.get("Critical") + 1);
            } else if (severity == Alarm.AlarmSeverity.HIGH) {
                counts.put("High", counts.get("High") + 1);
            } else if (severity == Alarm.AlarmSeverity.MEDIUM) {
                counts.put("Medium", counts.get("Medium") + 1);
            } else if (severity == Alarm.AlarmSeverity.LOW) {
                counts.put("Low", counts.get("Low") + 1);
            }
        }

        List<AlarmSeverityPoint> points = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            points.add(new AlarmSeverityPoint(entry.getKey(), entry.getValue()));
        }
        return points;
    }

    private List<AlarmTrendPoint> buildAlarmTrendSeries(List<Alarm> alarms, Instant start, Instant end) {
        Map<LocalDate, AlarmTrendBucket> buckets = createAlarmTrendBuckets(start, end);
        for (Alarm alarm : alarms) {
            Instant createdAt = alarmCreatedAt(alarm);
            if (createdAt != null) {
                LocalDate day = createdAt.atZone(ZoneOffset.UTC).toLocalDate();
                AlarmTrendBucket bucket = buckets.computeIfAbsent(day, ignored -> new AlarmTrendBucket());
                bucket.opened += 1;
            }

            Instant resolvedAt = alarmResolvedAt(alarm);
            if (resolvedAt != null) {
                LocalDate day = resolvedAt.atZone(ZoneOffset.UTC).toLocalDate();
                AlarmTrendBucket bucket = buckets.computeIfAbsent(day, ignored -> new AlarmTrendBucket());
                bucket.resolved += 1;
            }
        }

        List<AlarmTrendPoint> points = new ArrayList<>();
        for (Map.Entry<LocalDate, AlarmTrendBucket> entry : buckets.entrySet()) {
            points.add(new AlarmTrendPoint(
                    entry.getKey(),
                    formatDayLabel(entry.getKey()),
                    entry.getValue().opened,
                    entry.getValue().resolved
            ));
        }
        return points;
    }

    private List<TestTrendPoint> buildTestTrendSeries(List<OtdrTestResult> tests, Instant start, Instant end) {
        Map<LocalDate, TestTrendBucket> buckets = createTestTrendBuckets(start, end);
        for (OtdrTestResult test : tests) {
            Instant timestamp = testTimestamp(test);
            if (timestamp == null) {
                continue;
            }

            LocalDate day = timestamp.atZone(ZoneOffset.UTC).toLocalDate();
            TestTrendBucket bucket = buckets.computeIfAbsent(day, ignored -> new TestTrendBucket());
            if (isPassTest(test)) {
                bucket.pass += 1;
            } else {
                bucket.fail += 1;
            }
        }

        List<TestTrendPoint> points = new ArrayList<>();
        for (Map.Entry<LocalDate, TestTrendBucket> entry : buckets.entrySet()) {
            points.add(new TestTrendPoint(
                    entry.getKey(),
                    formatDayLabel(entry.getKey()),
                    entry.getValue().pass,
                    entry.getValue().fail
            ));
        }
        return points;
    }

    private List<AlarmEntry> buildAlarmHistory(List<Alarm> alarms, Map<String, String> routeNamesById) {
        List<Alarm> sortedAlarms = new ArrayList<>(alarms);
        sortedAlarms.sort(Comparator.comparing(this::alarmCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<AlarmEntry> entries = new ArrayList<>();
        for (Alarm alarm : sortedAlarms) {
            Instant startedAt = alarmCreatedAt(alarm);
            Instant endedAt = alarmResolvedAt(alarm);
            Double durationHours = startedAt != null && endedAt != null && !endedAt.isBefore(startedAt)
                    ? round2(ChronoUnit.MINUTES.between(startedAt, endedAt) / 60.0)
                    : null;

            entries.add(new AlarmEntry(
                    nonBlankOrFallback(alarm != null ? alarm.getAlarmId() : null, nonBlankOrFallback(alarm != null ? alarm.getId() : null, "-")),
                    nonBlankOrFallback(alarm != null ? alarm.getRouteId() : null, "-"),
                    routeNamesById.getOrDefault(alarm != null ? alarm.getRouteId() : null, nonBlankOrFallback(alarm != null ? alarm.getRouteId() : null, "-")),
                    nonBlankOrFallback(alarm != null ? alarm.getRtuId() : null, "-"),
                    alarm != null && alarm.getAlarmType() != null ? alarm.getAlarmType().name() : "UNKNOWN",
                    alarm != null && alarm.getSeverity() != null ? alarm.getSeverity().name() : "UNKNOWN",
                    alarm != null && alarm.getStatus() != null ? alarm.getStatus().name() : "UNKNOWN",
                    startedAt,
                    endedAt,
                    durationHours,
                    alarm != null ? alarm.getDescription() : null
            ));
        }
        return entries;
    }

    private Map<LocalDate, AlarmTrendBucket> createAlarmTrendBuckets(Instant start, Instant end) {
        Map<LocalDate, AlarmTrendBucket> buckets = new LinkedHashMap<>();
        LocalDate current = start.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate last = end.atZone(ZoneOffset.UTC).toLocalDate();
        while (!current.isAfter(last)) {
            buckets.put(current, new AlarmTrendBucket());
            current = current.plusDays(1);
        }
        return buckets;
    }

    private Map<LocalDate, TestTrendBucket> createTestTrendBuckets(Instant start, Instant end) {
        Map<LocalDate, TestTrendBucket> buckets = new LinkedHashMap<>();
        LocalDate current = start.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate last = end.atZone(ZoneOffset.UTC).toLocalDate();
        while (!current.isAfter(last)) {
            buckets.put(current, new TestTrendBucket());
            current = current.plusDays(1);
        }
        return buckets;
    }

    private double calculateRouteAvailability(List<Route> routes) {
        if (routes == null || routes.isEmpty()) {
            return 0.0;
        }

        int normalRoutes = 0;
        for (Route route : routes) {
            if (normalizeRouteStatus(route != null ? route.getStatus() : null) == RouteHealthState.NORMAL) {
                normalRoutes += 1;
            }
        }
        return normalRoutes * 100.0 / routes.size();
    }

    private double calculateMttrHours(List<Alarm> alarms) {
        List<Double> durations = new ArrayList<>();
        for (Alarm alarm : alarms) {
            Instant startedAt = alarmCreatedAt(alarm);
            Instant endedAt = alarmResolvedAt(alarm);
            if (startedAt == null || endedAt == null || endedAt.isBefore(startedAt)) {
                continue;
            }
            durations.add(ChronoUnit.MINUTES.between(startedAt, endedAt) / 60.0);
        }

        if (durations.isEmpty()) {
            return 0.0;
        }
        return average(durations);
    }

    private double calculateMtbfHours(List<Alarm> alarms) {
        List<Instant> incidentTimes = new ArrayList<>();
        for (Alarm alarm : alarms) {
            Alarm.AlarmSeverity severity = alarm != null ? alarm.getSeverity() : null;
            if (severity == Alarm.AlarmSeverity.CRITICAL || severity == Alarm.AlarmSeverity.HIGH) {
                Instant createdAt = alarmCreatedAt(alarm);
                if (createdAt != null) {
                    incidentTimes.add(createdAt);
                }
            }
        }

        incidentTimes.sort(Comparator.naturalOrder());
        if (incidentTimes.size() < 2) {
            return 720.0;
        }

        long totalGapMinutes = 0;
        for (int index = 1; index < incidentTimes.size(); index++) {
            totalGapMinutes += Math.max(0, ChronoUnit.MINUTES.between(incidentTimes.get(index - 1), incidentTimes.get(index)));
        }

        return (totalGapMinutes / 60.0) / (incidentTimes.size() - 1);
    }

    private String buildOverview(String scopeLabel, Summary summary, Instant start, Instant end) {
        String periodLabel = formatPeriodLabel(start, end);
        return String.format(
                Locale.ENGLISH,
                "%s averaged %.1f%% availability across %d routes from %s, with %d alarms, %.1f%% test success, MTTR %.1f h, and MTBF %.1f h.",
                scopeLabel,
                summary.availabilityPercent(),
                summary.totalRoutes(),
                periodLabel,
                summary.totalAlarms(),
                summary.passRatePercent(),
                summary.mttrHours(),
                summary.mtbfHours()
        );
    }

    private String formatPeriodLabel(Instant start, Instant end) {
        return formatDayLabel(start.atZone(ZoneOffset.UTC).toLocalDate()) + " to " + formatDayLabel(end.atZone(ZoneOffset.UTC).toLocalDate());
    }

    private String formatDayLabel(LocalDate day) {
        return day.format(DAY_LABEL_FORMAT);
    }

    private double average(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return 0.0;
        }

        double sum = 0.0;
        for (Double value : values) {
            if (value != null) {
                sum += value;
            }
        }
        return sum / values.size();
    }

    private Optional<Double> averageAvailability(List<AvailabilityPoint> points) {
        if (points == null || points.isEmpty()) {
            return Optional.empty();
        }

        List<Double> values = new ArrayList<>();
        for (AvailabilityPoint point : points) {
            values.add(point.value());
        }
        return Optional.of(average(values));
    }

    private Instant testTimestamp(OtdrTestResult test) {
        if (test == null) {
            return null;
        }
        return test.getMeasuredAt() != null ? test.getMeasuredAt() : test.getCreatedAt();
    }

    private Instant alarmCreatedAt(Alarm alarm) {
        if (alarm == null) {
            return null;
        }
        if (alarm.getLifecycle() != null && alarm.getLifecycle().getCreatedAt() != null) {
            return alarm.getLifecycle().getCreatedAt();
        }
        return alarm.getUpdatedAt();
    }

    private Instant alarmResolvedAt(Alarm alarm) {
        if (alarm == null || alarm.getLifecycle() == null) {
            return null;
        }
        return alarm.getLifecycle().getResolvedAt();
    }

    private boolean isActiveAlarm(Alarm alarm) {
        if (alarm == null || alarm.getStatus() == null) {
            return false;
        }
        return alarm.getStatus() == Alarm.AlarmStatus.ACTIVE || alarm.getStatus() == Alarm.AlarmStatus.ACKNOWLEDGED;
    }

    private boolean isResolvedAlarm(Alarm alarm) {
        if (alarm == null || alarm.getStatus() == null) {
            return false;
        }
        return alarm.getStatus() == Alarm.AlarmStatus.RESOLVED || alarm.getStatus() == Alarm.AlarmStatus.CLEARED;
    }

    private boolean isPassTest(OtdrTestResult test) {
        String value = normalizeText(test != null ? test.getTestResult() : null).toUpperCase(Locale.ENGLISH);
        if (PASS_VALUES.contains(value)) {
            return true;
        }
        if (FAIL_VALUES.contains(value)) {
            return false;
        }
        return value.contains("PASS");
    }

    private RouteHealthState normalizeRouteStatus(Route.RouteStatus status) {
        if (status == null) {
            return RouteHealthState.OTHER;
        }

        return switch (status) {
            case NORMAL -> RouteHealthState.NORMAL;
            case DEGRADATION, DEGRADED -> RouteHealthState.DEGRADED;
            case BREAK, BROKEN -> RouteHealthState.BROKEN;
            default -> RouteHealthState.OTHER;
        };
    }

    private ReportScope parseScope(String scope) {
        try {
            return ReportScope.valueOf(normalizeText(scope).toUpperCase(Locale.ENGLISH));
        } catch (Exception ex) {
            return ReportScope.NETWORK;
        }
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String nonBlankOrFallback(String value, String fallback) {
        String normalized = normalizeText(value);
        return normalized.isEmpty() ? fallback : normalized;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static final class AlarmTrendBucket {
        private int opened;
        private int resolved;
    }

    private static final class TestTrendBucket {
        private int pass;
        private int fail;
    }

    private enum ReportScope {
        NETWORK,
        RTU
    }

    private enum RouteHealthState {
        NORMAL,
        DEGRADED,
        BROKEN,
        OTHER
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ReportRequest(String scope, String rtuId, Instant start, Instant end) {
    }

    public record ReportResponse(
            String title,
            ScopeInfo scope,
            PeriodInfo period,
            Summary summary,
            RtuSnapshot rtuSnapshot,
            List<RouteStatusPoint> routeStatusSeries,
            List<AvailabilityPoint> availabilitySeries,
            List<AlarmSeverityPoint> alarmSeveritySeries,
            List<AlarmTrendPoint> alarmTrendSeries,
            List<TestTrendPoint> testTrendSeries,
            List<AlarmEntry> alarmHistory,
            String executiveSummary,
            Instant generatedAt
    ) {
    }

    public record ScopeInfo(String type, String label, String rtuId) {
    }

    public record PeriodInfo(Instant start, Instant end, String label) {
    }

    public record Summary(
            double availabilityPercent,
            double mttrHours,
            double mtbfHours,
            int totalRoutes,
            int normalRoutes,
            int degradedRoutes,
            int brokenRoutes,
            int totalAlarms,
            int activeAlarms,
            int resolvedAlarms,
            int criticalAlarms,
            int highAlarms,
            int mediumAlarms,
            int lowAlarms,
            int totalTests,
            int passTests,
            int failTests,
            double passRatePercent,
            double failRatePercent,
            double healthScore,
            String availabilityLabel
    ) {
    }

            public record RtuSnapshot(
                Double temperatureC,
                Double cpuUsagePercent,
                Double memoryUsagePercent,
                String powerSupplyStatus,
                Instant capturedAt
            ) {
            }

    public record RouteStatusPoint(String label, int value) {
    }

    public record AvailabilityPoint(LocalDate day, String label, double value) {
    }

    public record AlarmSeverityPoint(String label, int value) {
    }

    public record AlarmTrendPoint(LocalDate day, String label, int opened, int resolved) {
    }

    public record TestTrendPoint(LocalDate day, String label, int passCount, int failCount) {
    }

    public record AlarmEntry(
            String alarmId,
            String routeId,
            String routeName,
            String rtuId,
            String alarmType,
            String severity,
            String status,
            Instant startedAt,
            Instant endedAt,
            Double durationHours,
            String description
    ) {
    }
}
