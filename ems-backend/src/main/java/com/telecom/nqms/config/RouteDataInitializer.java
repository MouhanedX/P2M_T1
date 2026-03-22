package com.telecom.nqms.config;

import com.telecom.nqms.model.Route;
import com.telecom.nqms.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class RouteDataInitializer {

    private final RouteRepository routeRepository;

    @Bean
    CommandLineRunner seedDefaultRoutes() {
        return args -> {
            if (routeRepository.count() > 0) {
                return;
            }

            List<Route> defaults = List.of(
                    buildRoute("OR_1", "OR_1 Tunis Backbone", "RTU_01", "Tunis", 25.0, 5, Route.Priority.HIGH),
                    buildRoute("OR_2", "OR_2 Sfax Trunk", "RTU_01", "Sfax", 35.0, 7, Route.Priority.CRITICAL),
                    buildRoute("OR_3", "OR_3 Sousse Ring", "RTU_01", "Sousse", 18.0, 4, Route.Priority.MEDIUM),
                    buildRoute("OR_4", "OR_4 Tunis South", "RTU_01", "Tunis", 42.0, 8, Route.Priority.HIGH),
                    buildRoute("OR_5", "OR_5 Sfax Industrial", "RTU_01", "Sfax", 30.0, 6, Route.Priority.MEDIUM)
            );

            routeRepository.saveAll(defaults);
            log.info("Seeded {} default routes", defaults.size());
        };
    }

    private Route buildRoute(String routeId,
                             String routeName,
                             String rtuId,
                             String region,
                             double lengthKm,
                             int spliceCount,
                             Route.Priority priority) {
        return Route.builder()
                .routeId(routeId)
                .routeName(routeName)
                .rtuId(rtuId)
                .region(region)
                .status(Route.RouteStatus.NORMAL)
                .priority(priority)
                .fiberSpec(Route.FiberSpec.builder()
                        .type("SMF-28")
                        .coreDiameterUm(9)
                        .lengthKm(lengthKm)
                        .expectedAttenuationDbPerKm(0.2)
                        .build())
                .topology(Route.Topology.builder()
                        .startPoint("Central Exchange")
                        .endPoint(region + " POP")
                        .intermediatePoints(List.of())
                        .build())
                .baseline(Route.Baseline.builder()
                        .totalLossDb(lengthKm * 0.2)
                        .spliceCount(spliceCount)
                        .connectorCount(2)
                        .measuredAt(Instant.now())
                        .traceSignature(routeId + "-baseline")
                        .build())
                .currentCondition(Route.CurrentCondition.builder()
                        .lastTestTime(Instant.now())
                        .totalLossDb(lengthKm * 0.2)
                        .lossDeviationDb(0.0)
                        .eventCount(spliceCount + 2)
                        .activeAlarms(0)
                        .build())
                .maintenance(Route.Maintenance.builder()
                        .lastMaintenanceDate(LocalDate.now().minusDays(30))
                        .nextScheduledMaintenance(LocalDate.now().plusDays(60))
                        .maintenanceHistory(List.of("Baseline commissioning", "OTDR verification"))
                        .build())
                .sla(Route.Sla.builder()
                        .availabilityTarget(99.5)
                        .mttrTargetHours(4)
                        .mtbfHours(720)
                        .build())
                .build();
    }
}
