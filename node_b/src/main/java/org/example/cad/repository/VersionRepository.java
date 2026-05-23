package org.example.cad.repository;

import org.example.cad.domain.model.VersionDoc;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VersionRepository extends MongoRepository<VersionDoc, String> {
    
    /**
     * Find all versions for a specific model
     */
    List<VersionDoc> findByModelId(String modelId);
    
    /**
     * Find versions by model and branch
     */
    List<VersionDoc> findByModelIdAndBranchName(String modelId, String branchName);
    
    /**
     * Find specific version by model and version number
     */
    Optional<VersionDoc> findByModelIdAndVersionNumber(String modelId, int versionNumber);
    
    /**
     * Find latest version for a model
     */
    Optional<VersionDoc> findFirstByModelIdOrderByVersionNumberDesc(String modelId);
    
    /**
     * Find all branches for a model
     */
    List<VersionDoc> findDistinctByModelId(String modelId);
    
    /**
     * Find versions created by specific site
     */
    List<VersionDoc> findByModelIdAndSiteId(String modelId, String siteId);
}

