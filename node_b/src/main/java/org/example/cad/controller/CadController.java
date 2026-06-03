package org.example.cad.controller;

import org.example.cad.dto.request.CreateCadRequest;
import org.example.cad.dto.common.ApiResponse;
import org.example.cad.domain.model.CadModel;
import org.example.cad.domain.model.Version;
import org.example.cad.repository.CadModelRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cad")
@CrossOrigin(origins = "*")
public class CadController {

    private final CadModelRepository repository;

    public CadController(CadModelRepository repository) {
        this.repository = repository;
    }

    // =========================
    // CREATE MODEL
    // =========================
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CadModel>> createModel(
            @RequestBody CreateCadRequest request) {

        String partId = request.name.toLowerCase().replaceAll("\\s+", "-");

        CadModel model = new CadModel(partId, request.name);

        // initial version (v1)
        Version v1 = new Version();
        v1.setVersionNumber(1);
        v1.setGeometryData(request.name);
        v1.setTimestamp(System.currentTimeMillis());
        v1.setSiteId("node_a");
        v1.setFullSnapshot(true);
        v1.setParentVersion(null);

        model.addVersion(v1);

        CadModel saved = repository.save(model);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "CAD model created", saved)
        );
    }

    // =========================
    // GET MODEL
    // =========================
    @GetMapping("/{partId}")
    public ResponseEntity<ApiResponse<CadModel>> getModel(
            @PathVariable String partId) {

        Optional<CadModel> model = repository.findById(partId);

        return model.map(value ->
                        ResponseEntity.ok(new ApiResponse<>(true, "OK", value)))
                .orElseGet(() ->
                        ResponseEntity.status(404)
                                .body(new ApiResponse<>(false, "Not found", null)));
    }

    // =========================
    // LIST MODELS
    // =========================
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CadModel>>> list() {

        return ResponseEntity.ok(
                new ApiResponse<>(true, "OK", repository.findAll())
        );
    }

    // =========================
    // ADD VERSION
    // =========================
    @PostMapping("/{partId}/version")
    public ResponseEntity<ApiResponse<CadModel>> addVersion(
            @PathVariable String partId,
            @RequestBody Version requestVersion) {

        Optional<CadModel> optional = repository.findById(partId);

        if (optional.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "Model not found", null));
        }

        CadModel model = optional.get();

        int nextVersion = model.getVersions().size() + 1;

        Version version = new Version();
        version.setVersionNumber(nextVersion);
        version.setGeometryData(requestVersion.getGeometryData());
        version.setTimestamp(System.currentTimeMillis());
        version.setSiteId(requestVersion.getSiteId());
        version.setFullSnapshot(requestVersion.isFullSnapshot());

        // safe parent linking
        Version latest = model.getLatestVersion();
        version.setParentVersion(
                latest != null ? String.valueOf(latest.getVersionNumber()) : null
        );

        model.addVersion(version);

        CadModel saved = repository.save(model);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Version added", saved)
        );
    }

    // =========================
    // UPDATE BASE GEOMETRY
    // =========================
    @PutMapping("/{partId}/geometry")
    public ResponseEntity<ApiResponse<CadModel>> updateGeometry(
            @PathVariable String partId,
            @RequestBody String geometry) {

        Optional<CadModel> optional = repository.findById(partId);

        if (optional.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "Model not found", null));
        }

        CadModel model = optional.get();

        model.setGeometry(geometry);

        // OPTIONAL: also create implicit version
        int nextVersion = model.getVersions().size() + 1;

        Version autoVersion = new Version();
        autoVersion.setVersionNumber(nextVersion);
        autoVersion.setGeometryData(geometry);
        autoVersion.setTimestamp(System.currentTimeMillis());
        autoVersion.setSiteId("node_a");
        autoVersion.setFullSnapshot(true);
        autoVersion.setParentVersion(
                model.getLatestVersion() != null
                        ? String.valueOf(model.getLatestVersion().getVersionNumber())
                        : null
        );

        model.addVersion(autoVersion);

        CadModel saved = repository.save(model);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Geometry updated", saved)
        );
    }

    // =========================
    // DELETE MODEL
    // =========================
    @DeleteMapping("/{partId}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable String partId) {

        if (!repository.existsById(partId)) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse<>(false, "Not found", null));
        }

        repository.deleteById(partId);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Deleted", partId)
        );
    }
}