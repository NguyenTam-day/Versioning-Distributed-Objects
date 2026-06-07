package org.example.cad.controller;

import org.example.cad.dto.request.CreateVersionRequest;
import org.example.cad.dto.response.VersionResponse;
import org.example.cad.dto.common.ApiResponse;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.VersionRepository;
import org.example.cad.service.VersionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.google.gson.Gson;
import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;

import java.util.*;
import java.util.stream.Collectors;

import org.example.cad.service.SyncService;

@RestController
@RequestMapping("/api/version")
@CrossOrigin(origins = "*")
public class VersionController {

    private final VersionRepository versionRepository;
    private final VersionService versionService;
    private final SyncService syncService;

    @Value("${app.site-id}")
    private String currentSiteId;

    public VersionController(VersionRepository versionRepository, VersionService versionService,
            SyncService syncService) {
        this.versionRepository = versionRepository;
        this.versionService = versionService;
        this.syncService = syncService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<VersionResponse>> checkout(
            @RequestParam(required = false) String modelId,
            @RequestParam(defaultValue = "main") String branchName,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String targetModelId = modelId;
            String targetBranch = branchName;

            if (body != null) {
                if (body.containsKey("modelId"))
                    targetModelId = body.get("modelId");
                if (body.containsKey("branchName"))
                    targetBranch = body.get("branchName");
            }

            if (targetModelId == null || targetModelId.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "modelId is required", null));
            }

            List<VersionDoc> modelVersions = versionRepository.findByModelIdAndBranchName(targetModelId, targetBranch);
            if (modelVersions.isEmpty()) {
                return ResponseEntity.status(404)
                        .body(new ApiResponse<>(false, "No versions found for model " + targetModelId, null));
            }

            VersionDoc latest = modelVersions.get(modelVersions.size() - 1);
            VersionResponse response = mapToResponse(latest);
            return ResponseEntity.ok(new ApiResponse<>(true, "Checkout successful", response));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(new ApiResponse<>(false, "Checkout failed: " + e.getMessage(), null));
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<VersionResponse>> checkin(
            @RequestParam(required = false) String modelId,
            @RequestParam(defaultValue = "1") Integer baseVersion,
            @RequestParam(required = false) String commitMessage,
            @RequestParam(required = false) String geometry,
            @RequestParam(defaultValue = "system") String author,
            @RequestParam(defaultValue = "main") String branchName,
            @RequestParam(defaultValue = "default-site") String siteId,
            @RequestBody(required = false) CreateVersionRequest request) {
        try {
            CreateVersionRequest req = request;
            if (req == null) {
                req = new CreateVersionRequest(
                        modelId,
                        baseVersion != null ? baseVersion : 1,
                        commitMessage,
                        geometry,
                        author,
                        branchName,
                        siteId,
                        null,
                        true);
            }

            if (req.getModelId() == null || req.getModelId().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "modelId is required", null));
            }

            VersionDoc saved = versionService.createVersion(req, currentSiteId);
            VersionResponse response = mapToResponse(saved);

            try {
                syncService.syncVersionToPeersAsync(saved);
            } catch (Exception e) {
                // Non-blocking sync
            }

            return ResponseEntity.ok(new ApiResponse<>(true, "Checkin successful", response));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(new ApiResponse<>(false, "Checkin failed: " + e.getMessage(), null));
        }
    }

    @PostMapping("/versions")
    public ResponseEntity<ApiResponse<VersionResponse>> createVersion(@RequestBody CreateVersionRequest request) {
        try {
            VersionDoc saved = versionService.createVersion(request, currentSiteId);
            VersionResponse response = mapToResponse(saved);

            try {
                syncService.syncVersionToPeersAsync(saved);
            } catch (Exception e) {
                // Non-blocking sync
            }

            return ResponseEntity.ok(new ApiResponse<>(true, "Version created successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                    .body(new ApiResponse<>(false, "Failed to create version: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{modelId}/history")
    public ResponseEntity<ApiResponse<List<VersionResponse>>> getHistory(@PathVariable String modelId) {
        List<VersionDoc> modelVersions = versionRepository.findByModelId(modelId);
        List<VersionResponse> responses = modelVersions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "History retrieved", responses));
    }

    @GetMapping("/{modelId}/branches")
    public ResponseEntity<ApiResponse<List<String>>> getBranches(@PathVariable String modelId) {
        List<VersionDoc> modelVersions = versionRepository.findByModelId(modelId);
        Set<String> branches = modelVersions.stream()
                .map(VersionDoc::getBranchName)
                .collect(Collectors.toSet());
        return ResponseEntity.ok(new ApiResponse<>(true, "Branches retrieved", new ArrayList<>(branches)));
    }

    @GetMapping("/{modelId}/version/{versionNumber}")
    public ResponseEntity<ApiResponse<VersionResponse>> getVersion(
            @PathVariable String modelId,
            @PathVariable int versionNumber) {
        Optional<VersionDoc> version = versionRepository.findByModelIdAndVersionNumber(modelId, versionNumber);
        if (version.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "Version not found", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Version retrieved", mapToResponse(version.get())));
    }

    private VersionResponse mapToResponse(VersionDoc doc) {
        VersionResponse response = new VersionResponse();
        response.id = doc.getId();
        response.modelId = doc.getModelId();
        response.versionNumber = doc.getVersionNumber();
        response.commitMessage = doc.getCommitMessage();
        response.timestamp = Date.from(doc.getTimestamp());
        response.author = doc.getAuthor();
        response.geometryData = doc.getGeometryData();
        response.branchName = doc.getBranchName();
        response.parentVersion = doc.getParentVersion();
        response.fullSnapshot = doc.isFullSnapshot();
        response.siteId = doc.getSiteId();
        response.syncStatus = doc.getSyncStatus();
        response.versionName = doc.getVersionName();
        response.conflicted = doc.getBranchName() != null && doc.getBranchName().startsWith("conflict/");
        return response;
    }

    // ─────────────────────────────────────────────────────────
    // DEMO ENDPOINTS
    // ─────────────────────────────────────────────────────────

    @GetMapping("/{modelId}/chain")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVersionChain(
            @PathVariable String modelId) {
        List<VersionDoc> versions = versionRepository.findByModelId(modelId);
        versions.sort(Comparator.comparingInt(VersionDoc::getVersionNumber));

        List<Map<String, Object>> chain = new ArrayList<>();
        for (VersionDoc v : versions) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("versionNumber", v.getVersionNumber());
            entry.put("versionName", v.getVersionName());
            entry.put("type", v.isFullSnapshot() ? "Snapshot" : "Delta");
            entry.put("branchName", v.getBranchName());
            entry.put("parentVersion", v.getParentVersion());
            entry.put("siteId", v.getSiteId());
            entry.put("commitMessage", v.getCommitMessage());
            entry.put("timestamp", v.getTimestamp());
            entry.put("storageBytes", v.getGeometryData() != null ? v.getGeometryData().getBytes().length : 0);
            chain.add(entry);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Version chain retrieved", chain));
    }

    @GetMapping("/{modelId}/restore/{versionNumber}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restoreVersion(
            @PathVariable String modelId,
            @PathVariable int versionNumber) {

        Optional<VersionDoc> targetOpt = versionRepository.findByModelIdAndVersionNumber(modelId, versionNumber);
        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Version not found", null));
        }

        VersionDoc target = targetOpt.get();
        List<VersionDoc> allVersions = versionRepository.findByModelId(modelId);

        List<VersionDoc> chain = new ArrayList<>();
        VersionDoc current = target;
        while (current != null && !current.isFullSnapshot()) {
            chain.add(0, current);
            String parentName = current.getParentVersion();
            if (parentName == null || parentName.isEmpty()) break;
            final String pn = parentName;
            current = allVersions.stream()
                    .filter(v -> pn.equals(v.getVersionName()))
                    .findFirst().orElse(null);
        }
        VersionDoc baseSnapshot = (current != null && current.isFullSnapshot()) ? current : null;

        List<Map<String, Object>> steps = new ArrayList<>();
        if (baseSnapshot != null) {
            Map<String, Object> snapStep = new LinkedHashMap<>();
            snapStep.put("action", "LOAD_SNAPSHOT");
            snapStep.put("versionName", baseSnapshot.getVersionName());
            snapStep.put("versionNumber", baseSnapshot.getVersionNumber());
            snapStep.put("storageBytes", baseSnapshot.getGeometryData() != null ? baseSnapshot.getGeometryData().getBytes().length : 0);
            steps.add(snapStep);
        }
        for (VersionDoc d : chain) {
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("action", "APPLY_DELTA");
            step.put("versionName", d.getVersionName());
            step.put("versionNumber", d.getVersionNumber());
            step.put("storageBytes", d.getGeometryData() != null ? d.getGeometryData().getBytes().length : 0);
            steps.add(step);
        }

        long t0 = System.currentTimeMillis();
        org.example.dv.Geometry3D reconstructed = versionService.reconstructGeometry(target);
        long restoreMs = System.currentTimeMillis() - t0;

        long snapshotMs = 0;
        if (baseSnapshot != null) {
            long ts0 = System.currentTimeMillis();
            new Gson().fromJson(baseSnapshot.getGeometryData(), org.example.dv.Geometry3D.class);
            snapshotMs = System.currentTimeMillis() - ts0;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("targetVersion", versionNumber);
        result.put("targetVersionName", target.getVersionName());
        result.put("baseSnapshot", baseSnapshot != null ? baseSnapshot.getVersionName() : null);
        result.put("deltaStepsApplied", chain.size());
        result.put("restoreSteps", steps);
        result.put("restoreTimeMs", restoreMs);
        result.put("snapshotOnlyTimeMs", snapshotMs);
        result.put("vertexCount", reconstructed != null && reconstructed.getVertices() != null ? reconstructed.getVertices().size() : 0);
        result.put("faceCount", reconstructed != null && reconstructed.getFaces() != null ? reconstructed.getFaces().size() : 0);
        result.put("success", reconstructed != null);

        return ResponseEntity.ok(new ApiResponse<>(true, "Restore completed", result));
    }

    @GetMapping("/{modelId}/benchmark/{versionNumber}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> benchmark(
            @PathVariable String modelId,
            @PathVariable int versionNumber) {

        Optional<VersionDoc> targetOpt = versionRepository.findByModelIdAndVersionNumber(modelId, versionNumber);
        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Version not found", null));
        }
        VersionDoc target = targetOpt.get();
        List<VersionDoc> allVersions = versionRepository.findByModelId(modelId);

        List<VersionDoc> deltaChain = new ArrayList<>();
        VersionDoc current = target;
        while (current != null && !current.isFullSnapshot()) {
            deltaChain.add(0, current);
            String pn = current.getParentVersion();
            if (pn == null || pn.isEmpty()) break;
            final String parentName = pn;
            current = allVersions.stream().filter(v -> parentName.equals(v.getVersionName())).findFirst().orElse(null);
        }
        VersionDoc baseSnapshot = (current != null && current.isFullSnapshot()) ? current : null;

        long snapshotBytes = baseSnapshot != null && baseSnapshot.getGeometryData() != null
                ? baseSnapshot.getGeometryData().getBytes().length : 0;
        long deltaBytes = deltaChain.stream()
                .mapToLong(v -> v.getGeometryData() != null ? v.getGeometryData().getBytes().length : 0)
                .sum();

        long t0 = System.currentTimeMillis();
        org.example.dv.Geometry3D reconstructed = versionService.reconstructGeometry(target);
        long deltaRestoreMs = System.currentTimeMillis() - t0;

        long snapshotRestoreMs = 0;
        if (baseSnapshot != null) {
            long ts0 = System.currentTimeMillis();
            new Gson().fromJson(baseSnapshot.getGeometryData(), org.example.dv.Geometry3D.class);
            snapshotRestoreMs = System.currentTimeMillis() - ts0;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("modelId", modelId);
        result.put("targetVersionNumber", versionNumber);
        result.put("baseSnapshot", baseSnapshot != null ? baseSnapshot.getVersionName() : null);
        result.put("deltaCount", deltaChain.size());
        result.put("snapshotSizeBytes", snapshotBytes);
        result.put("deltaTotalBytes", deltaBytes);
        result.put("totalStorageBytes", snapshotBytes + deltaBytes);
        result.put("snapshotRestoreMs", snapshotRestoreMs);
        result.put("deltaChainRestoreMs", deltaRestoreMs);
        result.put("storageSavedBytes", snapshotBytes > 0 ? snapshotBytes * (1 + deltaChain.size()) - (snapshotBytes + deltaBytes) : 0);
        result.put("vertexCount", reconstructed != null && reconstructed.getVertices() != null ? reconstructed.getVertices().size() : 0);
        result.put("faceCount", reconstructed != null && reconstructed.getFaces() != null ? reconstructed.getFaces().size() : 0);

        return ResponseEntity.ok(new ApiResponse<>(true, "Benchmark completed", result));
    }

    @GetMapping("/{modelId}/delta/{versionNumber}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> showDelta(
            @PathVariable String modelId,
            @PathVariable int versionNumber) {

        Optional<VersionDoc> versionOpt = versionRepository.findByModelIdAndVersionNumber(modelId, versionNumber);
        if (versionOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new ApiResponse<>(false, "Version not found", null));
        }
        VersionDoc version = versionOpt.get();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("versionName", version.getVersionName());
        result.put("versionNumber", versionNumber);
        result.put("isSnapshot", version.isFullSnapshot());

        if (version.isFullSnapshot()) {
            result.put("message", "This version is a full snapshot — all geometry data is stored.");
            Gson gson = new Gson();
            org.example.dv.Geometry3D geo = gson.fromJson(version.getGeometryData(), org.example.dv.Geometry3D.class);
            if (geo != null) {
                result.put("vertexCount", geo.getVertices() != null ? geo.getVertices().size() : 0);
                result.put("faceCount", geo.getFaces() != null ? geo.getFaces().size() : 0);
            }
        } else {
            Gson gson = new Gson();
            org.example.dv.Geometry3DDiff.DiffReport report = gson.fromJson(version.getGeometryData(),
                    org.example.dv.Geometry3DDiff.DiffReport.class);
            if (report != null) {
                result.put("newVertexCount", report.newVertexCount);
                result.put("newFaceCount", report.newFaceCount);

                List<Map<String, Object>> vertexChanges = new ArrayList<>();
                if (report.vertexChanges != null) {
                    for (org.example.dv.Geometry3DDiff.VertexChange vc : report.vertexChanges) {
                        Map<String, Object> c = new LinkedHashMap<>();
                        c.put("index", vc.index);
                        c.put("type", vc.type);
                        if (vc.newValue != null) c.put("newValue", vc.newValue);
                        vertexChanges.add(c);
                    }
                }
                result.put("vertexChanges", vertexChanges);

                List<Map<String, Object>> faceChanges = new ArrayList<>();
                if (report.faceChanges != null) {
                    for (org.example.dv.Geometry3DDiff.FaceChange fc : report.faceChanges) {
                        Map<String, Object> c = new LinkedHashMap<>();
                        c.put("index", fc.index);
                        c.put("type", fc.type);
                        if (fc.newValue != null) c.put("newValue", fc.newValue);
                        faceChanges.add(c);
                    }
                }
                result.put("faceChanges", faceChanges);
                result.put("storageSizeBytes", version.getGeometryData() != null ? version.getGeometryData().getBytes().length : 0);
            } else {
                result.put("message", "Could not parse delta data for this version.");
            }
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Delta retrieved", result));
    }
}

