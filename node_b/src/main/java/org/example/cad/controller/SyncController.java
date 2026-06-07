package org.example.cad.controller;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.repository.VersionRepository;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.service.SyncService;
import org.example.cad.service.SyncControlService;
import org.example.cad.service.VersionService;
import org.example.dv.Geometry3D;
import com.google.gson.Gson;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    private final VersionRepository versionRepository;
    private final SyncService syncService;
    private final Geometry3DRepository geometry3DRepository;
    private final org.example.cad.service.ConflictService conflictService;
    private final SyncControlService syncControlService;
    private final VersionService versionService;

    public SyncController(VersionRepository versionRepository,
            SyncService syncService,
            Geometry3DRepository geometry3DRepository,
            org.example.cad.service.ConflictService conflictService,
            SyncControlService syncControlService,
            VersionService versionService) {
        this.versionRepository = versionRepository;
        this.syncService = syncService;
        this.geometry3DRepository = geometry3DRepository;
        this.conflictService = conflictService;
        this.syncControlService = syncControlService;
        this.versionService = versionService;
    }

    private void saveGeometryFromVersion(VersionDoc versionDoc) {
        try {
            versionService.saveGeometryFromVersion(versionDoc);
        } catch (Exception e) {
            // Non-blocking sync error
        }
    }

    /**
     * Core conflict resolution logic used by both /push and /receive-version.
     *
     * Processes the incoming version doc against local DB state and returns
     * a list of ALL version docs that changed state (the incoming + any siblings).
     * The caller must save all returned docs locally.
     */
    private List<VersionDoc> resolveAndPersist(VersionDoc versionDoc) {
        List<VersionDoc> changed = new ArrayList<>();

        // If the incoming is already marked as CONFLICT (peer already resolved it),
        // just accept and persist it as-is.
        boolean isAlreadyConflicted = "CONFLICT".equals(versionDoc.getSyncStatus())
                || (versionDoc.getBranchName() != null && versionDoc.getBranchName().startsWith("conflict/"));

        if (isAlreadyConflicted) {
            versionDoc.setSyncStatus("CONFLICT");
            versionRepository.save(versionDoc);
            saveGeometryFromVersion(versionDoc);
            changed.add(versionDoc);
            return changed;
        }

        // Load all existing local versions for conflict sibling detection
        List<VersionDoc> existingVersions = versionRepository.findByModelId(versionDoc.getModelId());

        String parent = versionDoc.getParentVersion();
        if (parent == null || parent.isEmpty()) {
            // No parent → root version, always SYNCED
            versionDoc.setSyncStatus("SYNCED");
            versionRepository.save(versionDoc);
            saveGeometryFromVersion(versionDoc);
            changed.add(versionDoc);
            return changed;
        }

        // Find siblings = versions with same parent that are not this very doc
        List<VersionDoc> siblings = existingVersions.stream()
                .filter(v -> parent.equals(v.getParentVersion()) && !v.getId().equals(versionDoc.getId()))
                .collect(java.util.stream.Collectors.toList());

        if (siblings.isEmpty()) {
            // No siblings → no conflict, accept as SYNCED
            versionDoc.setSyncStatus("SYNCED");
            versionRepository.save(versionDoc);
            saveGeometryFromVersion(versionDoc);
            changed.add(versionDoc);
            return changed;
        }

        // --- Conflict detected: siblings exist with same parent ---
        //
        // Always apply deterministic timestamp-based consensus.
        // Do NOT shortcut on siblingAlreadyBranched — the incoming version might be
        // the WINNER that was incorrectly not yet given main status on this node.
        //
        // All candidates (incoming + siblings) are sorted: older timestamp first.
        // The FIRST in sorted list is the canonical winner → stays on main.
        // All others → conflict branch.

        List<VersionDoc> candidates = new ArrayList<>();
        candidates.add(versionDoc);
        candidates.addAll(siblings);

        candidates.sort((c1, c2) -> {
            if (c1.getTimestamp() == null && c2.getTimestamp() == null) return 0;
            if (c1.getTimestamp() == null) return 1;
            if (c2.getTimestamp() == null) return -1;
            int cmp = c1.getTimestamp().compareTo(c2.getTimestamp()); // ASCENDING: older first
            if (cmp != 0)
                return cmp;
            // Tie-breaker: lower siteId wins
            String s1 = c1.getSiteId() != null ? c1.getSiteId() : "";
            String s2 = c2.getSiteId() != null ? c2.getSiteId() : "";
            return s1.compareTo(s2);
        });

        VersionDoc canonical = candidates.get(0);

        // Resolve incoming version
        if (canonical.getId().equals(versionDoc.getId())) {
            // Incoming is the winner — ensure it is on main and SYNCED
            versionDoc.setBranchName("main");
            versionDoc.setSyncStatus("SYNCED");
        } else {
            // Incoming is a loser — move to conflict branch
            String conflictBranch = conflictService.buildConflictBranchName(
                    versionDoc.getVersionNumber(), versionDoc.getSiteId());
            conflictService.resolveWithBranching(versionDoc, conflictBranch);
        }
        versionRepository.save(versionDoc);
        saveGeometryFromVersion(versionDoc);
        changed.add(versionDoc);

        // Resolve siblings: losers get conflict branch, winner gets main + SYNCED
        for (VersionDoc sibling : siblings) {
            if (!canonical.getId().equals(sibling.getId())) {
                // This sibling lost — ensure it is in a conflict branch
                if (sibling.getBranchName() == null || !sibling.getBranchName().startsWith("conflict/")) {
                    String siblingBranch = conflictService.buildConflictBranchName(
                            sibling.getVersionNumber(), sibling.getSiteId());
                    conflictService.resolveWithBranching(sibling, siblingBranch);
                    versionRepository.save(sibling);
                    saveGeometryFromVersion(sibling);
                    changed.add(sibling); // CRITICAL: sender will apply this to its own DB
                }
            } else {
                // This sibling is the winner — ensure it is on main and SYNCED
                boolean needsUpdate = !("main".equals(sibling.getBranchName()))
                        || !("SYNCED".equals(sibling.getSyncStatus()) || "ACTIVE".equals(sibling.getSyncStatus()));
                if (needsUpdate) {
                    sibling.setBranchName("main");
                    sibling.setSyncStatus("SYNCED");
                    versionRepository.save(sibling);
                    saveGeometryFromVersion(sibling);
                    changed.add(sibling);
                }
            }
        }

        return changed;
    }

    /**
     * Receive a version from a peer (legacy endpoint, kept for backward compat).
     * Returns just the resolved incoming doc.
     */
    @PostMapping("/receive-version")
    public ResponseEntity<VersionDoc> receiveVersion(@RequestBody VersionDoc versionDoc) {
        if (!syncControlService.isSyncEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        List<VersionDoc> changed = resolveAndPersist(versionDoc);
        // Return the first element which is always the incoming version
        return ResponseEntity.ok(changed.isEmpty() ? versionDoc : changed.get(0));
    }

    /**
     * Push endpoint: receives a version from a peer, resolves conflict state,
     * and returns ALL affected version docs (incoming + any sibling state changes).
     * The sender MUST apply all returned docs to its own local DB.
     */
    @PostMapping("/push")
    public ResponseEntity<List<VersionDoc>> push(@RequestBody VersionDoc versionDoc) {
        if (!syncControlService.isSyncEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        List<VersionDoc> changed = resolveAndPersist(versionDoc);
        return ResponseEntity.ok(changed);
    }

    /**
     * Pull endpoint: returns all versions for a given model that the caller doesn't
     * have.
     * Used on sync re-enable to fetch missing versions from peers.
     */
    @PostMapping("/pull")
    public ResponseEntity<List<VersionDoc>> pull(@RequestBody Map<String, Object> payload) {
        if (!syncControlService.isSyncEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        String modelId = (String) payload.get("modelId");
        @SuppressWarnings("unchecked")
        List<String> knownIds = payload.containsKey("knownIds")
                ? (List<String>) payload.get("knownIds")
                : new ArrayList<>();

        List<VersionDoc> allLocal = versionRepository.findByModelId(modelId);
        List<VersionDoc> unknown = allLocal.stream()
                .filter(v -> !knownIds.contains(v.getId()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(unknown);
    }

    @PostMapping("/trigger-push")
    public ResponseEntity<Void> triggerPush(@RequestBody Map<String, String> payload) {
        if (!syncControlService.isSyncEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        String modelId = payload.get("modelId");
        String targetNode = payload.get("targetNode");
        if (modelId != null && targetNode != null) {
            syncService.pushToRemote(modelId, targetNode);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/disable")
    public ResponseEntity<Map<String, String>> disableSync() {
        syncControlService.disableSync();
        return ResponseEntity.ok(Map.of("message", "Synchronization disabled"));
    }

    @PostMapping("/enable")
    public ResponseEntity<Map<String, String>> enableSync() {
        syncControlService.enableSync();
        return ResponseEntity.ok(Map.of("message", "Synchronization enabled"));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        return ResponseEntity.ok(Map.of("syncEnabled", syncControlService.isSyncEnabled()));
    }
}
