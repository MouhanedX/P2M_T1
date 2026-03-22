package com.telecom.nqms.repository;

import com.telecom.nqms.model.Route;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends MongoRepository<Route, String> {
    
    Optional<Route> findByRouteId(String routeId);
    
    List<Route> findByRtuId(String rtuId);
    
    List<Route> findByStatus(Route.RouteStatus status);
    
    List<Route> findByRegion(String region);
    
    List<Route> findByPriority(Route.Priority priority);
    
    @Query("{'rtuId': ?0, 'status': ?1}")
    List<Route> findByRtuIdAndStatus(String rtuId, Route.RouteStatus status);
    
    @Query("{'currentCondition.activeAlarms': {$gt: 0}}")
    List<Route> findRoutesWithActiveAlarms();
    
    Long countByStatus(Route.RouteStatus status);
    
    Long countByRtuId(String rtuId);
}
