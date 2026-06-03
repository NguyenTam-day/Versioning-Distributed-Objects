package org.example.cad.repository;

import org.example.cad.domain.model.Geometry3DModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Geometry3DRepository extends MongoRepository<Geometry3DModel, String> {

    /**
     * Find all versions for a specific object
     */
    List<Geometry3DModel> findByObjectId(String objectId);

    /**
     * Find specific version by object and version number
     */
    Optional<Geometry3DModel> findByObjectIdAndVersion(String objectId, int version);

    Optional<Geometry3DModel> findByObjectIdAndVersionAndSiteId(String objectId, int version, String siteId);

    /**
     * Find latest version for an object
     */
    Optional<Geometry3DModel> findFirstByObjectIdOrderByVersionDesc(String objectId);

    /**
     * Find all versions created by a specific site
     */
    List<Geometry3DModel> findByObjectIdAndSiteId(String objectId, String siteId);

    /**
     * Find versions in timestamp range
     */
    List<Geometry3DModel> findByObjectIdAndTimestampBetween(String objectId, long startTime, long endTime);
}

