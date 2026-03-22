package com.telecom.nqms.repository;

import com.telecom.nqms.model.Rtu;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RtuRepository extends MongoRepository<Rtu, String> {
    
    Optional<Rtu> findByRtuId(String rtuId);
    
    List<Rtu> findByStatus(Rtu.RtuStatus status);
    
    @Query("{'location.region': ?0}")
    List<Rtu> findByRegion(String region);
    
    @Query("{'health.lastHeartbeat': {$gte: ?0}}")
    List<Rtu> findByLastHeartbeatAfter(Instant since);
    
    @Query("{'isMonitoring': true}")
    List<Rtu> findAllMonitoring();
    
    Long countByStatus(Rtu.RtuStatus status);
}
