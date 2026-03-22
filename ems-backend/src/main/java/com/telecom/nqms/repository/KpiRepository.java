package com.telecom.nqms.repository;

import com.telecom.nqms.model.Kpi;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface KpiRepository extends MongoRepository<Kpi, String> {
    
    List<Kpi> findByKpiTypeAndPeriod(Kpi.KpiType kpiType, Kpi.Period period, Sort sort);
    
    @Query("{'kpiType': ?0, 'period': ?1, 'timestamp': {$gte: ?2, $lte: ?3}}")
    List<Kpi> findByKpiTypeAndPeriodBetween(Kpi.KpiType kpiType, Kpi.Period period, Instant start, Instant end);
    
    @Query("{'kpiType': ?0, 'period': ?1, 'scope.type': ?2}")
    Optional<Kpi> findLatestByKpiTypeAndPeriodAndScopeType(Kpi.KpiType kpiType, Kpi.Period period, Kpi.ScopeType scopeType, Sort sort);
    
    @Query("{'period': ?0, 'timestamp': {$gte: ?1}}")
    List<Kpi> findByPeriodSince(Kpi.Period period, Instant since);
    
    @Query(value = "{'timestamp': {$lt: ?0}}", delete = true)
    void deleteOlderThan(Instant timestamp);
}
