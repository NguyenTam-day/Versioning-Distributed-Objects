package org.example.cad.repository;

import org.example.cad.domain.model.Geometry3DModel;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Geometry Repository
 *
 * Handles:
 * - version queries
 * - distributed node queries
 * - conflict detection
 * - history lookup
 */
@Repository
public interface Geometry3DRepository
        extends MongoRepository<Geometry3DModel, String> {

    /**
     * Get all versions
     * sorted ascending
     */
    List<Geometry3DModel> findByObjectIdOrderByVersionAsc(
            String objectId);

    /**
     * Get all versions
     */
    List<Geometry3DModel> findByObjectId(
            String objectId);

    /**
     * Get specific version
     */
    Optional<Geometry3DModel> findByObjectIdAndVersion(
            String objectId,
            int version);

    /**
     * Get latest version
     */
    Optional<Geometry3DModel> findFirstByObjectIdOrderByVersionDesc(
            String objectId);

    /**
     * Count total versions
     */
    long countByObjectId(
            String objectId);

    /**
     * Get all versions
     * from specific site/node
     */
    List<Geometry3DModel> findByObjectIdAndSiteId(
            String objectId,
            String siteId);

    /**
     * Get versions
     * inside time range
     */
    List<Geometry3DModel> findByObjectIdAndTimestampBetween(
            String objectId,
            long startTime,
            long endTime);

    /**
     * Delete all versions
     * of an object
     */
    void deleteByObjectId(
            String objectId);

    /**
     * Check object exists
     */
    boolean existsByObjectId(
            String objectId);

    /**
     * Find all objects
     * created by site/node
     */
    List<Geometry3DModel> findBySiteId(
            String siteId);
}