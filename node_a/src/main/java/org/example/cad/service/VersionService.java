package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.dto.request.CreateVersionRequest;
import org.example.cad.repository.VersionRepository;
import org.example.cad.repository.Geometry3DRepository;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * VersionService quản lý vòng đời version trong hệ thống distributed CAD.
 *
 * <p>
 * <b>Distributed Conflict Workflow:</b>
 *
 * <pre>
 * Scenario:
 *
 *   1. Node A checkout v1_A
 *   2. Node B checkout v1_A
 *
 *   3. Node A edit OBJ externally and push:
 *        -> creates v2_A
 *        -> parentVersion = v1_A
 *        -> branch = main
 *
 *   4. Node B vẫn đang edit working copy cũ từ v1_A
 *
 *   5. Node B push:
 *        -> creates v2_B
 *        -> parentVersion = v1_A
 *
 *   6. Conflict detected:
 *        because:
 *            v2_A.parent = v1_A
 *            v2_B.parent = v1_A
 *
 *   7. System resolves using branching strategy:
 *
 *        v1_A
 *        ├── v2_A (main)
 *        └── v2_B (conflict/2_B)
 * </pre>
 */
@Service
public class VersionService {

    private static final Logger log = LoggerFactory.getLogger(VersionService.class);

    private final VersionRepository versionRepository;
    private final ConflictService conflictService;
    private final Geometry3DRepository geometry3DRepository;
    private final Gson gson = new Gson();

    public VersionService(
            VersionRepository versionRepository,
            ConflictService conflictService,
            Geometry3DRepository geometry3DRepository) {
        this.versionRepository = versionRepository;
        this.conflictService = conflictService;
        this.geometry3DRepository = geometry3DRepository;
    }

    /**
     * Create a new version.
     */
    public VersionDoc createVersion(CreateVersionRequest request, String siteId) {

        // Load all existing versions for this model
        List<VersionDoc> existingVersions = versionRepository.findByModelId(request.getModelId());

        // Get latest version safely
        VersionDoc currentHead = getLatestVersion(request.getModelId());

        // ---------------------------------------------------------------------
        // Validate geometry changes
        // ---------------------------------------------------------------------

        if (currentHead != null
                && request.getGeometryData() != null
                && !request.getGeometryData().isEmpty()
                && currentHead.getGeometryData() != null
                && !currentHead.getGeometryData().isEmpty()) {

            try {

                com.google.gson.Gson gson = new com.google.gson.Gson();

                org.example.dv.Geometry3D newGeo = gson.fromJson(
                        request.getGeometryData(),
                        org.example.dv.Geometry3D.class);

                org.example.dv.Geometry3D oldGeo = gson.fromJson(
                        currentHead.getGeometryData(),
                        org.example.dv.Geometry3D.class);

                if (newGeo != null && oldGeo != null) {

                    org.example.dv.Geometry3DDiff.DiffReport diffReport = org.example.dv.Geometry3DDiff.diff(oldGeo,
                            newGeo);

                    boolean hasChanges = diffReport.vertexModifications > 0
                            || diffReport.vertexAdditions > 0
                            || diffReport.vertexDeletions > 0
                            || diffReport.faceModifications > 0
                            || diffReport.faceAdditions > 0
                            || diffReport.faceDeletions > 0;

                    if (!hasChanges) {
                        throw new IllegalArgumentException(
                                "Geometry data has not changed. Version creation aborted.");
                    }
                }

            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                // Ignore JSON parse errors and continue
            }
        }

        // ---------------------------------------------------------------------
        // IMPORTANT:
        // parentVersion MUST come from client checkout version
        // NOT automatically from latest DB version
        // ---------------------------------------------------------------------

        String parentVersion = request.getParentVersion();

        // Fallback: only auto-assign currentHead as parent when:
        //   - client did not supply an explicit parentVersion
        //   - AND there is already a SYNCED/ACTIVE version on main
        //     (i.e. this is NOT the very first upload)
        if ((parentVersion == null || parentVersion.isEmpty()) && currentHead != null) {
            boolean hasActivePredecessor = existingVersions.stream()
                    .anyMatch(v -> "main".equals(v.getBranchName())
                            && ("SYNCED".equals(v.getSyncStatus())
                                    || "ACTIVE".equals(v.getSyncStatus())));
            if (hasActivePredecessor) {
                parentVersion = currentHead.getVersionName();
            }
        }

        // ---------------------------------------------------------------------
        // Calculate next version number (relative to parentVersion)
        // ---------------------------------------------------------------------

        int nextVersionNumber = 1;
        if (parentVersion != null && !parentVersion.isEmpty()) {
            final String targetParent = parentVersion;
            Optional<VersionDoc> parentDocOpt = existingVersions.stream()
                    .filter(v -> targetParent.equals(v.getVersionName()))
                    .findFirst();
            if (parentDocOpt.isPresent()) {
                nextVersionNumber = parentDocOpt.get().getVersionNumber() + 1;
            } else if (currentHead != null) {
                nextVersionNumber = currentHead.getVersionNumber() + 1;
            }
        } else if (currentHead != null) {
            nextVersionNumber = currentHead.getVersionNumber() + 1;
        }

        // ---------------------------------------------------------------------
        // Default branch
        // ---------------------------------------------------------------------

        String branchName = (request.getBranchName() != null
                && !request.getBranchName().isEmpty())
                        ? request.getBranchName()
                        : "main";

        // ---------------------------------------------------------------------
        // Create new version
        // ---------------------------------------------------------------------

        VersionDoc newVersion = VersionDoc.createNew(
                request.getModelId(),
                nextVersionNumber,
                request.getCommitMessage(),
                request.getGeometryData(),
                request.getAuthor() != null
                        ? request.getAuthor()
                        : "system",
                siteId,
                branchName,
                parentVersion,
                request.isFullSnapshot());

        // ---------------------------------------------------------------------
        // CONFLICT DETECTION
        //
        // Conflict occurs when:
        // multiple versions share same parentVersion
        //
        // Example:
        // v2_A.parent = v1_A
        // v2_B.parent = v1_A
        // ---------------------------------------------------------------------

        boolean hasConflict = conflictService.detectConflict(
                newVersion,
                existingVersions);

        if (hasConflict) {
            Optional<VersionDoc> siblingOpt = conflictService.findConflictingVersion(newVersion, existingVersions);
            if (siblingOpt.isPresent()) {
                VersionDoc existing = siblingOpt.get();
                VersionDoc winner = conflictService.determineWinner(newVersion, existing);
                VersionDoc loser = conflictService.determineLoser(newVersion, existing);

                // Move loser to conflict branch
                String conflictBranch = conflictService.buildConflictBranchName(
                        loser.getVersionNumber(), loser.getSiteId());
                loser.setBranchName(conflictBranch);
                loser.setSyncStatus("CONFLICT");
                
                // Winner remains on main
                winner.setBranchName("main");
                winner.setSyncStatus("ACTIVE");

                // Persist the existing sibling since it might have changed
                saveVersion(existing);

                // Log audit
                log.info("\n--------------------------------------------------\n" +
                        "CONFLICT DETECTED\n\n" +
                        "Parent: {}\n\n" +
                        "Existing: {}\n" +
                        "Timestamp: {}\n\n" +
                        "Incoming: {}\n" +
                        "Timestamp: {}\n\n" +
                        "Winner: {}\n\n" +
                        "Loser moved to:\n" +
                        "{}\n" +
                        "--------------------------------------------------",
                        newVersion.getParentVersion(),
                        existing.getVersionName(),
                        existing.getTimestamp(),
                        newVersion.getVersionName(),
                        newVersion.getTimestamp(),
                        winner.getVersionName(),
                        loser.getBranchName()
                );
            }
        }

        return saveVersion(newVersion);
    }

    private void saveGeometryFromVersion(VersionDoc versionDoc) {
        if (versionDoc.getGeometryData() != null && !versionDoc.getGeometryData().isEmpty()) {
            try {
                org.example.dv.Geometry3D geometry = gson.fromJson(versionDoc.getGeometryData(),
                        org.example.dv.Geometry3D.class);
                if (geometry != null) {
                    if (!geometry3DRepository.findByObjectIdAndVersionAndSiteId(versionDoc.getModelId(),
                            versionDoc.getVersionNumber(), versionDoc.getSiteId()).isPresent()) {
                        org.example.cad.domain.model.Geometry3DModel geoModel = org.example.cad.domain.model.Geometry3DModel
                                .createNew(
                                        versionDoc.getModelId(),
                                        versionDoc.getVersionNumber(),
                                        geometry.getName() != null ? geometry.getName() : "model",
                                        geometry.getFormat() != null ? geometry.getFormat() : "obj",
                                        gson.toJson(geometry.getVertices()),
                                        gson.toJson(geometry.getFaces()),
                                        versionDoc.getGeometryData(),
                                        versionDoc.getSiteId());
                        geoModel.setTimestamp(versionDoc.getTimestamp().toEpochMilli());
                        geometry3DRepository.save(geoModel);
                    }
                }
            } catch (Exception e) {
                // Non-blocking sync error
            }
        }
    }

    /**
     * Save version to MongoDB.
     */
    public VersionDoc saveVersion(VersionDoc version) {
        VersionDoc saved = versionRepository.save(version);
        saveGeometryFromVersion(saved);
        return saved;
    }

    /**
     * Get latest version safely using descending sort.
     */
    public VersionDoc getLatestVersion(String modelId) {

        Optional<VersionDoc> latest = versionRepository
                .findFirstByModelIdOrderByVersionNumberDesc(modelId);

        return latest.orElse(null);
    }
}