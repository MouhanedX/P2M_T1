package com.telecom.nqms.repository;

import com.telecom.nqms.model.OtdrTestResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OtdrTestResultRepository extends MongoRepository<OtdrTestResult, String> {

    List<OtdrTestResult> findByOrderByMeasuredAtDesc(Pageable pageable);

    List<OtdrTestResult> findByRouteIdOrderByMeasuredAtDesc(String routeId, Pageable pageable);

    List<OtdrTestResult> findByRtuIdOrderByMeasuredAtDesc(String rtuId, Pageable pageable);

    List<OtdrTestResult> findByRouteIdAndRtuIdOrderByMeasuredAtDesc(String routeId, String rtuId, Pageable pageable);

    List<OtdrTestResult> findByMeasuredAtBetweenOrderByMeasuredAtAsc(Instant start, Instant end);

    List<OtdrTestResult> findByRtuIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(String rtuId, Instant start, Instant end);
}
