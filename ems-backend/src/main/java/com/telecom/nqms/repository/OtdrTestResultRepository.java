package com.telecom.nqms.repository;

import com.telecom.nqms.model.OtdrTestResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OtdrTestResultRepository extends MongoRepository<OtdrTestResult, String> {

    List<OtdrTestResult> findByOrderByMeasuredAtDesc(Pageable pageable);

    List<OtdrTestResult> findByRouteIdOrderByMeasuredAtDesc(String routeId, Pageable pageable);
}
