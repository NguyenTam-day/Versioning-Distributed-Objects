package org.example.cad.controller;

import org.example.cad.dto.response.VersionResponse;
import org.example.cad.dto.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for version management.
 */
@RestController
@RequestMapping("/api/version")
@CrossOrigin(origins = "*")
public class VersionController {

    // Mock storage for versions
    private static final Map<String, List<VersionResponse>> versions = new HashMap<>();

    /**
     * Checkout a model (get current version for editing)
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<VersionResponse>> checkout(
            @RequestParam String modelId,
            @RequestParam(defaultValue = "main") String branchName) {
        try {
            List<VersionResponse> modelVersions = versions.getOrDefault(modelId, new ArrayList<>());
            if (modelVersions.isEmpty()) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "No versions found for model", null));
            }

            VersionResponse latest = modelVersions.get(modelVersions.size() - 1);
            return ResponseEntity.ok(new ApiResponse<>(true, "Checkout successful", latest));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Checkout failed: " + e.getMessage(), null));
        }
    }

    /**
     * Checkin a new version
     */
    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<VersionResponse>> checkin(
            @RequestParam String modelId,
            @RequestParam(defaultValue = "1") int version,
            @RequestParam String commitMessage,
            @RequestParam String geometry) {
        try {
            VersionResponse versionResponse = new VersionResponse();
            versionResponse.id = UUID.randomUUID().toString();
            versionResponse.modelId = modelId;
            versionResponse.versionNumber = version + 1;
            versionResponse.commitMessage = commitMessage;
            versionResponse.timestamp = new Date();
            versionResponse.author = "system";
            versionResponse.geometryData = geometry;
            versionResponse.branchName = "main";

            versions.computeIfAbsent(modelId, k -> new ArrayList<>()).add(versionResponse);

            return ResponseEntity.ok(new ApiResponse<>(true, "Checkin successful", versionResponse));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Checkin failed: " + e.getMessage(), null));
        }
    }

    /**
     * Get version history
     */
    @GetMapping("/{modelId}/history")
    public ResponseEntity<ApiResponse<List<VersionResponse>>> getHistory(@PathVariable String modelId) {
        List<VersionResponse> modelVersions = versions.getOrDefault(modelId, new ArrayList<>());
        return ResponseEntity.ok(new ApiResponse<>(true, "History retrieved", modelVersions));
    }

    /**
     * Get branches of a model
     */
    @GetMapping("/{modelId}/branches")
    public ResponseEntity<ApiResponse<List<String>>> getBranches(@PathVariable String modelId) {
        List<VersionResponse> modelVersions = versions.getOrDefault(modelId, new ArrayList<>());
        Set<String> branches = new HashSet<>();
        for (VersionResponse v : modelVersions) {
            branches.add(v.branchName);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Branches retrieved", new ArrayList<>(branches)));
    }

    /**
     * Get specific version
     */
    @GetMapping("/{modelId}/version/{versionNumber}")
    public ResponseEntity<ApiResponse<VersionResponse>> getVersion(
            @PathVariable String modelId,
            @PathVariable int versionNumber) {
        List<VersionResponse> modelVersions = versions.getOrDefault(modelId, new ArrayList<>());
        for (VersionResponse v : modelVersions) {
            if (v.versionNumber == versionNumber) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Version retrieved", v));
            }
        }
        return ResponseEntity.status(404)
            .body(new ApiResponse<>(false, "Version not found", null));
    }
}
