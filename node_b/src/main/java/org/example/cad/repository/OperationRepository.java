package org.example.cad.repository;

import org.example.cad.domain.model.Operation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationRepository extends MongoRepository<Operation, String> {

//    /**
//     * Find all operations for a specific model
//     */
//    List<Operation> findByModelId(String modelId);
//
//    /**
//     * Find operations by model and version
//     */
//    List<Operation> findByModelIdAndVersionId(String modelId, String versionId);
//
//    /**
//     * Find operations by site
//     */
//    List<Operation> findBySiteId(String siteId);
//
//    /**
//     * Find operations in timestamp range
//     */
//    List<Operation> findByTimestampBetween(long startTime, long endTime);
}

