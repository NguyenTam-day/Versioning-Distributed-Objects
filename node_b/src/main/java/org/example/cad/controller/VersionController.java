package org.example.cad.controller;

import org.example.cad.dto.response.VersionResponse;
import org.example.cad.dto.common.ApiResponse;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.VersionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST Controller for version management.
 * Uses MongoDB persistence via VersionRepository
 */
@RestController
@RequestMapping("/api/version")
@CrossOrigin(origins = "*")
public class VersionController {

    private final VersionRepository versionRepository;

    public VersionController(VersionRepository versionRepository) {
        this.versionRepository = versionRepository;
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<VersionResponse>> checkout(
            @RequestParam String modelId,
            @RequestParam(defaultValue = "main") String branchName) {
        try {
            List<VersionDoc> modelVersions = versionRepository.findByModelIdAndBranchName(modelId, branchName);
            if (modelVersions.isEmpty()) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "No versions found for model", null));
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
            @RequestParam String modelId,
            @RequestParam(defaultValue = "1") int baseVersion,
            @RequestParam String commitMessage,
            @RequestParam String geometry,
            @RequestParam(defaultValue = "system") String author,
            @RequestParam(defaultValue = "main") String branchName,
            @RequestParam(defaultValue = "default-site") String siteId) {
        try {
            List<VersionDoc> modelVersions = versionRepository.findByModelId(modelId);
            int nextVersion = modelVersions.isEmpty() ? 1 : modelVersions.size() + 1;

            VersionDoc versionDoc = VersionDoc.createNew(
                    modelId,
                    nextVersion,
                    commitMessage,
                    geometry,
                    author,
                    siteId,
                    branchName
            );

            VersionDoc saved = versionRepository.save(versionDoc);
            VersionResponse response = mapToResponse(saved);

            return ResponseEntity.ok(new ApiResponse<>(true, "Checkin successful", response));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Checkin failed: " + e.getMessage(), null));
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

    /**
     * Helper method to convert VersionDoc to VersionResponse
     */
    private VersionResponse mapToResponse(VersionDoc doc) {
        VersionResponse response = new VersionResponse();
        response.id = doc.getId();
        response.modelId = doc.getModelId();
        response.versionNumber = doc.getVersionNumber();
        response.commitMessage = doc.getCommitMessage();
        response.timestamp = new Date(doc.getTimestamp());
        response.author = doc.getAuthor();
        response.geometryData = doc.getGeometryData();
        response.branchName = doc.getBranchName();
        return response;
    }
}
