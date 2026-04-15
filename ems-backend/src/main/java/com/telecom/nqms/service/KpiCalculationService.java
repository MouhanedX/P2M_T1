package com.telecom.nqms.service;

import com.telecom.nqms.model.Alarm;
import com.telecom.nqms.model.Kpi;
import com.telecom.nqms.model.Route;
import com.telecom.nqms.model.Rtu;
import com.telecom.nqms.repository.AlarmRepository;
import com.telecom.nqms.repository.KpiRepository;
import com.telecom.nqms.repository.RouteRepository;
import com.telecom.nqms.repository.RtuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KpiCalculationService {
    
    private final KpiRepository kpiRepository;
    private final RouteRepository routeRepository;
    private final RtuRepository rtuRepository;
    private final AlarmRepository alarmRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Calculate and store KPIs every 5 minutes
     */
        @Scheduled(fixedRateString = "#{${nqms.kpi.calculation-interval-minutes:5} * 60000}", initialDelay = 60000)
    public void calculateAndStoreKpis() {
        log.info("Starting KPI calculation...");
        
        try {
            // Calculate global network health KPIs
            Kpi networkHealthKpi = calculateNetworkHealthKpi();
            kpiRepository.save(networkHealthKpi);
            
            // Send KPI update via WebSocket
            messagingTemplate.convertAndSend("/topic/kpis", networkHealthKpi);
            
            log.info("KPI calculation completed successfully");
        } catch (Exception e) {
            log.error("Error calculating KPIs", e);
        }
    }
    
    /**
     * Calculate network health KPI
     */
    public Kpi calculateNetworkHealthKpi() {
        Instant now = Instant.now();
        Instant last30Days = now.minus(30, ChronoUnit.DAYS);
        
        // Get all routes and RTUs
        List<Route> allRoutes = routeRepository.findAll();
        List<Rtu> allRtus = rtuRepository.findAll();
        List<Alarm> activeAlarms = alarmRepository.findAllActiveAlarms();
        List<Alarm> resolvedAlarms = alarmRepository.findResolvedSince(last30Days);
        List<Alarm> recentAlarms = alarmRepository.findCreatedSince(last30Days);

        Map<String, List<Alarm>> activeAlarmsByRoute = activeAlarms.stream()
                .filter(a -> a.getRouteId() != null && !a.getRouteId().isBlank())
                .collect(Collectors.groupingBy(Alarm::getRouteId));
        
        // Calculate route status counts from current active alarms
        long routesNormal = allRoutes.stream()
                .filter(r -> !activeAlarmsByRoute.containsKey(r.getRouteId()))
                .count();
        long routesDegraded = allRoutes.stream()
                .filter(r -> {
                    List<Alarm> routeAlarms = activeAlarmsByRoute.get(r.getRouteId());
                    if (routeAlarms == null || routeAlarms.isEmpty()) {
                        return false;
                    }
                    boolean hasBreak = routeAlarms.stream().anyMatch(a ->
                            a.getSeverity() == Alarm.AlarmSeverity.CRITICAL ||
                                    a.getAlarmType() == Alarm.AlarmType.FIBER_BREAK);
                    return !hasBreak;
                })
                .count();
        long routesBroken = allRoutes.stream()
                .filter(r -> {
                    List<Alarm> routeAlarms = activeAlarmsByRoute.get(r.getRouteId());
                    return routeAlarms != null && routeAlarms.stream().anyMatch(a ->
                            a.getSeverity() == Alarm.AlarmSeverity.CRITICAL ||
                                    a.getAlarmType() == Alarm.AlarmType.FIBER_BREAK);
                })
                .count();
        
        // Calculate alarm severity counts
        long criticalAlarms = activeAlarms.stream()
                .filter(a -> a.getSeverity() == Alarm.AlarmSeverity.CRITICAL)
                .count();
        long highAlarms = activeAlarms.stream()
                .filter(a -> a.getSeverity() == Alarm.AlarmSeverity.HIGH)
                .count();
        long mediumAlarms = activeAlarms.stream()
                .filter(a -> a.getSeverity() == Alarm.AlarmSeverity.MEDIUM)
                .count();
        long lowAlarms = activeAlarms.stream()
                .filter(a -> a.getSeverity() == Alarm.AlarmSeverity.LOW)
                .count();
        
        // Calculate network availability
        double networkAvailability = allRoutes.isEmpty() ? 0.0 :
                (double) routesNormal / allRoutes.size() * 100.0;
        
        // Calculate performance metrics
        double avgFiberLoss = allRoutes.stream()
                .filter(r -> r.getCurrentCondition() != null && r.getCurrentCondition().getTotalLossDb() != null)
                .mapToDouble(r -> r.getCurrentCondition().getTotalLossDb())
                .average()
                .orElse(0.0);
        
        double maxFiberLoss = allRoutes.stream()
                .filter(r -> r.getCurrentCondition() != null && r.getCurrentCondition().getTotalLossDb() != null)
                .mapToDouble(r -> r.getCurrentCondition().getTotalLossDb())
                .max()
                .orElse(0.0);
        
        int totalEvents = allRoutes.stream()
                .filter(r -> r.getCurrentCondition() != null && r.getCurrentCondition().getEventCount() != null)
                .mapToInt(r -> r.getCurrentCondition().getEventCount())
                .sum();
        
        // Calculate availability metrics
        double uptimePercent = allRtus.isEmpty() ? networkAvailability :
                (double) allRtus.stream().filter(r -> r.getStatus() == Rtu.RtuStatus.ONLINE).count() / allRtus.size() * 100.0;

        double mttrHours = calculateMttrHours(resolvedAlarms);
        double mtbfHours = calculateMtbfHours(recentAlarms, now);
        
        // Calculate trend (compare with previous KPI)
        Kpi.Trend trend = calculateTrend(networkAvailability, now);
        
        return Kpi.builder()
                .kpiType(Kpi.KpiType.NETWORK_HEALTH)
                .period(Kpi.Period.REALTIME)
                .timestamp(now)
                .scope(Kpi.Scope.builder()
                        .type(Kpi.ScopeType.GLOBAL)
                        .build())
                .metrics(Kpi.Metrics.builder()
                        .totalRoutes(allRoutes.size())
                        .routesNormal((int) routesNormal)
                        .routesDegraded((int) routesDegraded)
                        .routesBroken((int) routesBroken)
                        .networkAvailabilityPercent(Math.round(networkAvailability * 100.0) / 100.0)
                        .totalAlarmsActive(activeAlarms.size())
                        .criticalAlarms((int) criticalAlarms)
                        .highAlarms((int) highAlarms)
                        .mediumAlarms((int) mediumAlarms)
                        .lowAlarms((int) lowAlarms)
                        .build())
                .performance(Kpi.Performance.builder()
                        .avgFiberLossDb(Math.round(avgFiberLoss * 100.0) / 100.0)
                        .maxFiberLossDb(Math.round(maxFiberLoss * 100.0) / 100.0)
                        .totalEventsDetected(totalEvents)
                        .unusualEvents((int) activeAlarms.size())
                        .build())
                .availability(Kpi.Availability.builder()
                        .uptimePercent(Math.round(uptimePercent * 100.0) / 100.0)
                        .mttrHours(mttrHours)
                        .mtbfHours(mtbfHours)
                        .slaCompliancePercent(networkAvailability > 99.0 ? 100.0 : networkAvailability)
                        .build())
                .trend(trend)
                .calculatedAt(now)
                .build();
    }
    
    /**
     * Calculate trend compared to previous period
     */
    private Kpi.Trend calculateTrend(double currentAvailability, Instant now) {
        try {
            Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
            List<Kpi> previousKpis = kpiRepository.findByKpiTypeAndPeriodBetween(
                    Kpi.KpiType.NETWORK_HEALTH,
                    Kpi.Period.REALTIME,
                    oneHourAgo.minus(10, ChronoUnit.MINUTES),
                    oneHourAgo
            );

            Instant oneDayAgo = now.minus(1, ChronoUnit.DAYS);
            List<Kpi> previousDayKpis = kpiRepository.findByKpiTypeAndPeriodBetween(
                    Kpi.KpiType.NETWORK_HEALTH,
                    Kpi.Period.REALTIME,
                    oneDayAgo.minus(30, ChronoUnit.MINUTES),
                    oneDayAgo.plus(30, ChronoUnit.MINUTES)
            );

            Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
            List<Kpi> previousWeekKpis = kpiRepository.findByKpiTypeAndPeriodBetween(
                    Kpi.KpiType.NETWORK_HEALTH,
                    Kpi.Period.REALTIME,
                    oneWeekAgo.minus(1, ChronoUnit.HOURS),
                    oneWeekAgo.plus(1, ChronoUnit.HOURS)
            );

            double previousAvailability = extractAverageAvailability(previousKpis, currentAvailability);
            double previousDayAvailability = extractAverageAvailability(previousDayKpis, currentAvailability);
            double previousWeekAvailability = extractAverageAvailability(previousWeekKpis, currentAvailability);
            
            double hourChange = calculatePercentageChange(currentAvailability, previousAvailability);
            double dayChange = calculatePercentageChange(currentAvailability, previousDayAvailability);
            double weekChange = calculatePercentageChange(currentAvailability, previousWeekAvailability);

            return Kpi.Trend.builder()
                    .hourOverHourChangePercent(Math.round(hourChange * 100.0) / 100.0)
                    .dayOverDayChangePercent(Math.round(dayChange * 100.0) / 100.0)
                    .weekOverWeekChangePercent(Math.round(weekChange * 100.0) / 100.0)
                    .build();
        } catch (Exception e) {
            log.warn("Could not calculate trend", e);
        }
        
        return Kpi.Trend.builder()
                .hourOverHourChangePercent(0.0)
                .dayOverDayChangePercent(0.0)
                .weekOverWeekChangePercent(0.0)
                .build();
    }

        private double calculateMttrHours(List<Alarm> resolvedAlarms) {
                if (resolvedAlarms == null || resolvedAlarms.isEmpty()) {
                        return 0.0;
                }

                double avgSeconds = resolvedAlarms.stream()
                                .filter(a -> a.getLifecycle() != null && a.getLifecycle().getCreatedAt() != null && a.getLifecycle().getResolvedAt() != null)
                                .mapToLong(a -> ChronoUnit.SECONDS.between(a.getLifecycle().getCreatedAt(), a.getLifecycle().getResolvedAt()))
                                .filter(sec -> sec >= 0)
                                .average()
                                .orElse(0.0);

                return Math.round((avgSeconds / 3600.0) * 100.0) / 100.0;
        }

        private double calculateMtbfHours(List<Alarm> recentAlarms, Instant now) {
                List<Instant> incidentTimes = recentAlarms.stream()
                                .filter(a -> a.getLifecycle() != null && a.getLifecycle().getCreatedAt() != null)
                                .filter(a -> a.getSeverity() == Alarm.AlarmSeverity.CRITICAL || a.getSeverity() == Alarm.AlarmSeverity.HIGH)
                                .map(a -> a.getLifecycle().getCreatedAt())
                                .sorted(Comparator.naturalOrder())
                                .toList();

                if (incidentTimes.size() < 2) {
                        return 720.0;
                }

                long totalGapSeconds = 0;
                for (int i = 1; i < incidentTimes.size(); i++) {
                        totalGapSeconds += Math.max(0, ChronoUnit.SECONDS.between(incidentTimes.get(i - 1), incidentTimes.get(i)));
                }

                double avgGapHours = (totalGapSeconds / (double) (incidentTimes.size() - 1)) / 3600.0;
                return Math.round(avgGapHours * 100.0) / 100.0;
        }

        private double extractAverageAvailability(List<Kpi> kpis, double fallback) {
                if (kpis == null || kpis.isEmpty()) {
                        return fallback;
                }

                return kpis.stream()
                                .filter(k -> k.getMetrics() != null && k.getMetrics().getNetworkAvailabilityPercent() != null)
                                .mapToDouble(k -> k.getMetrics().getNetworkAvailabilityPercent())
                                .average()
                                .orElse(fallback);
        }

        private double calculatePercentageChange(double currentValue, double previousValue) {
                if (previousValue == 0.0) {
                        return currentValue == 0.0 ? 0.0 : 100.0;
                }
                return ((currentValue - previousValue) / previousValue) * 100.0;
        }
    
    /**
     * Get latest KPI
     */
    public Kpi getLatestKpi(Kpi.KpiType kpiType) {
        return kpiRepository.findByKpiTypeAndPeriod(kpiType, Kpi.Period.REALTIME, 
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"))
                .stream()
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Get KPI history
     */
    public List<Kpi> getKpiHistory(Kpi.KpiType kpiType, Kpi.Period period, int hours) {
        int safeHours = Math.max(hours, 1);
        Instant now = Instant.now();
        Instant since = now.minus(safeHours, ChronoUnit.HOURS);

        List<Kpi> kpis = new ArrayList<>(kpiRepository.findByKpiTypeAndPeriodBetween(
                kpiType, 
                period,
                since,
                now
        ));

        kpis.sort(Comparator.comparing(Kpi::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder())));
        return kpis;
    }

    /**
     * Get full KPI history for a KPI type and period
     */
    public List<Kpi> getKpiHistoryAll(Kpi.KpiType kpiType, Kpi.Period period) {
        return kpiRepository.findByKpiTypeAndPeriod(
                kpiType,
                period,
                Sort.by(Sort.Direction.ASC, "timestamp")
        );
    }
    
    /**
     * Clean up old KPIs
     */
    @Scheduled(cron = "0 0 2 * * ?")  // Run at 2 AM daily
    public void cleanupOldKpis() {
        int retentionDays = 365;  // From config
        Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        
        kpiRepository.deleteOlderThan(cutoffDate);
        log.info("Cleaned up KPIs older than {} days", retentionDays);
    }
}
