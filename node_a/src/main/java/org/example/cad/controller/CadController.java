package org.example.cad.controller;

import org.example.cad.dto.request.CreateCadRequest;
import org.example.cad.dto.response.CadResponse;
import org.example.cad.dto.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for CAD model management.
 */
@RestController
@RequestMapping("/api/cad")
@CrossOrigin(origins = "*")
public class CadController {

    // Mock storage for demo
    private static final Map<String, CadResponse> cadModels = new HashMap<>();

    /**
     * Create a new CAD model
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CadResponse>> createModel(@RequestBody CreateCadRequest request) {
        try {
            String modelId = request.name.toLowerCase().replaceAll("\\s+", "-");
            
            CadResponse response = new CadResponse();
            response.id = modelId;
            response.name = request.name;
            response.description = request.description;
            response.versionCount = 1;
            response.createdAt = new Date();
            response.updatedAt = new Date();
            
            cadModels.put(modelId, response);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Model created successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(400)
                .body(new ApiResponse<>(false, "Failed to create model: " + e.getMessage(), null));
        }
    }

    /**
     * Get model info
     */
    @GetMapping("/{modelId}")
    public ResponseEntity<ApiResponse<CadResponse>> getModel(@PathVariable String modelId) {
        CadResponse model = cadModels.get(modelId);
        if (model == null) {
            return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, "Model not found", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Model retrieved", model));
    }

    /**
     * List all CAD models
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<CadResponse>>> listModels() {
        List<CadResponse> models = new ArrayList<>(cadModels.values());
        return ResponseEntity.ok(new ApiResponse<>(true, "Models retrieved", models));
    }

    /**
     * Update model info
     */
    @PutMapping("/{modelId}")
    public ResponseEntity<ApiResponse<CadResponse>> updateModel(
            @PathVariable String modelId,
            @RequestBody CreateCadRequest request) {
        
        CadResponse model = cadModels.get(modelId);
        if (model == null) {
            return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, "Model not found", null));
        }

        model.name = request.name;
        model.description = request.description;
        model.updatedAt = new Date();
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Model updated", model));
    }

    /**
     * Delete model
     */
    @DeleteMapping("/{modelId}")
    public ResponseEntity<ApiResponse<String>> deleteModel(@PathVariable String modelId) {
        if (!cadModels.containsKey(modelId)) {
            return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, "Model not found", null));
        }

        cadModels.remove(modelId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Model deleted", modelId));
    }
}
