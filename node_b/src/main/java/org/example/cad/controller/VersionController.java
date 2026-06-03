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
}
