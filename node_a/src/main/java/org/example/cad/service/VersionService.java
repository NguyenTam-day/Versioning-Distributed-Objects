package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.dto.request.CreateVersionRequest;
import org.example.cad.repository.VersionRepository;
import org.example.cad.repository.Geometry3DRepository;
import com.google.gson.Gson;
import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
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
        // Snapshot / Delta cycle:
        //   v1, v6, v11, v16, ...  → fullSnapshot = true  (store full geometry)
        //   v2–v5, v7–v10, ...     → fullSnapshot = false (store diff only)
        //
        // Rule: versionNumber % 5 == 1  →  snapshot
        // ---------------------------------------------------------------------

        boolean isSnapshot = (nextVersionNumber % 5 == 1);

        // Compute storage payload
        String storageData = request.getGeometryData();
        if (!isSnapshot && currentHead != null
                && currentHead.getGeometryData() != null
                && !currentHead.getGeometryData().isEmpty()
                && request.getGeometryData() != null
                && !request.getGeometryData().isEmpty()) {
            // For delta versions, resolve the previous snapshot geometry to compute diff
            String baseGeometryJson = resolveSnapshotGeometry(request.getModelId(), currentHead, existingVersions);
            if (baseGeometryJson != null) {
                try {
                    Geometry3D oldGeo = gson.fromJson(baseGeometryJson, Geometry3D.class);
                    Geometry3D newGeo = gson.fromJson(request.getGeometryData(), Geometry3D.class);
                    if (oldGeo != null && newGeo != null) {
                        Geometry3DDiff.DiffReport diff = Geometry3DDiff.diff(oldGeo, newGeo);
                        storageData = gson.toJson(diff);
                    }
                } catch (Exception e) {
                    // Fallback to full geometry if diff fails
                    log.warn("Delta computation failed for v{}, falling back to full snapshot", nextVersionNumber);
                    isSnapshot = true;
                    storageData = request.getGeometryData();
                }
            } else {
                // Cannot find base snapshot, force full snapshot
                isSnapshot = true;
            }
        } else if (!isSnapshot) {
            // No previous head available – force snapshot
            isSnapshot = true;
        }

        // ---------------------------------------------------------------------
        // Create new version
        // ---------------------------------------------------------------------

        VersionDoc newVersion = VersionDoc.createNew(
                request.getModelId(),
                nextVersionNumber,
                request.getCommitMessage(),
                storageData,
                request.getAuthor() != null
                        ? request.getAuthor()
                        : "system",
                siteId,
                branchName,
                parentVersion,
                isSnapshot);

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

    /**
     * Snapshot / Delta cycle helper:
     * Walk backwards from currentHead to find the nearest full-snapshot VersionDoc
     * and return its geometryData (the full geometry JSON to base the diff on).
     */
    private String resolveSnapshotGeometry(String modelId, VersionDoc currentHead, List<VersionDoc> allVersions) {
        if (currentHead.isFullSnapshot()) {
            return currentHead.getGeometryData();
        }
        // Walk backwards through version numbers to find the closest snapshot
        int searchVersion = currentHead.getVersionNumber() - 1;
        while (searchVersion >= 1) {
            final int sv = searchVersion;
            Optional<VersionDoc> candidate = allVersions.stream()
                    .filter(v -> v.getVersionNumber() == sv && v.isFullSnapshot())
                    .findFirst();
            if (candidate.isPresent()) {
                return candidate.get().getGeometryData();
            }
            searchVersion--;
        }
        return null;
    }

    public org.example.dv.Geometry3D reconstructGeometry(VersionDoc versionDoc) {
        if (versionDoc == null) return null;
        if (versionDoc.isFullSnapshot()) {
            try {
                return gson.fromJson(versionDoc.getGeometryData(), org.example.dv.Geometry3D.class);
            } catch (Exception e) {
                log.error("Failed to parse full snapshot geometry for version {}", versionDoc.getVersionName(), e);
                return null;
            }
        }

        // It is a delta. We must traverse backwards via parentVersion.
        List<VersionDoc> path = new java.util.ArrayList<>();
        VersionDoc current = versionDoc;
        while (current != null && !current.isFullSnapshot()) {
            path.add(0, current); // add to the front so we process from oldest to newest
            String parentName = current.getParentVersion();
            if (parentName == null || parentName.isEmpty()) {
                break;
            }
            Optional<VersionDoc> parentOpt = versionRepository.findByModelIdAndVersionName(versionDoc.getModelId(), parentName);
            if (parentOpt.isPresent()) {
                current = parentOpt.get();
            } else {
                current = null;
            }
        }

        if (current == null || !current.isFullSnapshot()) {
            log.warn("Cannot reconstruct geometry for version {} because base snapshot is missing", versionDoc.getVersionName());
            return null;
        }

        // Start with the base snapshot geometry
        org.example.dv.Geometry3D geometry = gson.fromJson(current.getGeometryData(), org.example.dv.Geometry3D.class);
        if (geometry == null) return null;

        // Apply diffs sequentially
        for (VersionDoc doc : path) {
            try {
                Geometry3DDiff.DiffReport report = gson.fromJson(doc.getGeometryData(), Geometry3DDiff.DiffReport.class);
                geometry = Geometry3DDiff.apply(geometry, report);
            } catch (Exception e) {
                log.error("Error applying diff for version {}", doc.getVersionName(), e);
                return null;
            }
        }

        return geometry;
    }

    public void saveGeometryFromVersion(VersionDoc versionDoc) {
        if (versionDoc.getGeometryData() != null && !versionDoc.getGeometryData().isEmpty()) {
            try {
                org.example.dv.Geometry3D geometry = reconstructGeometry(versionDoc);
                if (geometry != null) {
                    if (!geometry3DRepository.findByObjectIdAndVersionAndSiteId(versionDoc.getModelId(),
                            versionDoc.getVersionNumber(), versionDoc.getSiteId()).isPresent()) {
                        org.example.cad.domain.model.Geometry3DModel geoModel = org.example.cad.domain.model.Geometry3DModel
                                .createNew(
                                        versionDoc.getModelId(),
                                        versionDoc.getVersionNumber(),
                                        geometry.getName() != null ? geometry.getName() : "model",
                                        geometry.getFormat() != null ? geometry.getFormat() : "obj",
                                        versionDoc.getSiteId());

                        geoModel.setTimestamp(versionDoc.getTimestamp().toEpochMilli());
                        geometry3DRepository.save(geoModel);
                    }
                }
            } catch (Exception e) {
                log.error("Error reconstructing and saving geometry from version: {}", e.getMessage(), e);
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