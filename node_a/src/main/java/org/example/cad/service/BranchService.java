package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.VersionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * BranchService handles branch management:
 * - Creating branches when conflicts are detected
 * - Listing all branches for a given model
 */
@Service
public class BranchService {

    private final VersionRepository versionRepository;

    public BranchService(VersionRepository versionRepository) {
        this.versionRepository = versionRepository;
    }

    /**
     * Returns all distinct branch names for a model.
     */
    public List<String> getBranches(String modelId) {
        return versionRepository.findByModelId(modelId).stream()
                .map(VersionDoc::getBranchName)
                .distinct()
                .toList();
    }

    /**
     * Creates a new branch from the latest version of the main branch.
     * Does this by duplicating the latest VersionDoc with the new branch name.
     *
     * @return The newly created branch version
     */
    public VersionDoc createBranchFrom(String modelId, String sourceBranch, String newBranchName, String siteId) {
        List<VersionDoc> sourceBranchVersions = versionRepository.findByModelIdAndBranchName(modelId, sourceBranch);
        if (sourceBranchVersions.isEmpty()) {
            throw new IllegalArgumentException(
                    "Source branch '" + sourceBranch + "' has no versions for model " + modelId);
        }

        VersionDoc head = sourceBranchVersions.get(sourceBranchVersions.size() - 1);

        // Count the next version number across all branches
        List<VersionDoc> allVersions = versionRepository.findByModelId(modelId);
        int nextVersionNumber = allVersions.size() + 1;

        VersionDoc branchVersion = VersionDoc.createNew(
                modelId,
                nextVersionNumber,
                "Branch created from " + sourceBranch,
                head.getGeometryData(),
                siteId,
                siteId,
                newBranchName,
                String.valueOf(head.getVersionNumber()),
                true);

        return versionRepository.save(branchVersion);
    }
}
