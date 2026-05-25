package org.example.cad.service.version;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.dto.request.CreateVersionRequest;
import org.example.cad.repository.VersionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VersionService {

    private final VersionRepository versionRepository;
    private final ConflictService conflictService;

    public VersionService(VersionRepository versionRepository, ConflictService conflictService) {
        this.versionRepository = versionRepository;
        this.conflictService = conflictService;
    }

    /**
     * Create a new version for a model.
     * Uses ConflictService to check for conflict against the latest version.
     */
    public VersionDoc createVersion(CreateVersionRequest request, String siteId) {
        List<VersionDoc> existingVersions = versionRepository.findByModelId(request.getModelId());
        
        VersionDoc currentHead = existingVersions.isEmpty() ? null : existingVersions.get(existingVersions.size() - 1);
        int nextVersionNumber = existingVersions.isEmpty() ? 1 : existingVersions.size() + 1;
        
        String branchName = request.getBranchName() != null ? request.getBranchName() : "main";
        
        VersionDoc newVersion = VersionDoc.createNew(
                request.getModelId(),
                nextVersionNumber,
                request.getCommitMessage(),
                request.getGeometryData(),
                request.getAuthor() != null ? request.getAuthor() : "system",
                siteId,
                branchName,
                request.getParentVersion(),
                request.isFullSnapshot()
        );
        
        // Conflict detection
        if (currentHead != null && conflictService.detectConflict(newVersion, currentHead)) {
            // Apply branching strategy: preserve both versions by placing incoming version on separate branch
            String altBranch = "feature/conflict-" + siteId + "-v" + nextVersionNumber;
            conflictService.resolveWithBranching(newVersion, altBranch);
        }
        
        return saveVersion(newVersion);
    }

    /**
     * Save a version document to MongoDB.
     */
    public VersionDoc saveVersion(VersionDoc version) {
        return versionRepository.save(version);
    }

    /**
     * Get the latest version by model ID.
     */
    public VersionDoc getLatestVersion(String modelId) {
        Optional<VersionDoc> latest = versionRepository.findFirstByModelIdOrderByVersionNumberDesc(modelId);
        return latest.orElse(null);
    }
}
