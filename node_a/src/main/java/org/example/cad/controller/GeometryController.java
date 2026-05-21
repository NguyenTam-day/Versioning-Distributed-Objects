package org.example.cad.controller;

import org.example.cad.dto.response.GeometryDiffResponse;
import org.example.cad.dto.response.GeometryVersionResponse;
import org.example.cad.service.geometry.Geometry3DService;
import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/geometry")
@CrossOrigin(origins = "*")
public class GeometryController {

    private final Geometry3DService geometry3DService;

    public GeometryController(Geometry3DService geometry3DService) {
        this.geometry3DService = geometry3DService;
    }

    /**
     * Upload geometry version (distributed-aware)
     * Supports multi-site collaboration
     */
    @PostMapping("/upload")
    public ResponseEntity<GeometryVersionResponse> uploadGeometry(
            @RequestParam("objectId") String objectId,
            @RequestParam(value = "siteId", required = false, defaultValue = "default-site") String siteId,
            @RequestParam("file") MultipartFile file) {

        try {

            // upload new version (service should handle version increment)
            geometry3DService.uploadGeometry(
                    objectId,
                    siteId,
                    file.getInputStream(),
                    file.getOriginalFilename()
            );

            int versionCount = geometry3DService.getVersionCount(objectId);

            Geometry3D geom =
                    geometry3DService.getGeometry(objectId, versionCount);

            String json =
                    geometry3DService.getGeometryAsJson(objectId, versionCount);

            GeometryVersionResponse response =
                    new GeometryVersionResponse(
                            objectId,
                            versionCount,
                            geom.getName(),
                            geom.getFormat(),
                            geom.getVertices().size(),
                            geom.getFaces().size(),
                            json
                    );

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to upload geometry: " + e.getMessage()
            );
        }
    }

    /**
     * Get all versions
     */
    @GetMapping("/{objectId}/versions")
    public ResponseEntity<List<GeometryVersionResponse>> getAllVersions(
            @PathVariable String objectId) {

        List<Geometry3D> versions =
                geometry3DService.getAllVersions(objectId);

        List<GeometryVersionResponse> responses = new ArrayList<>();

        for (int i = 0; i < versions.size(); i++) {

            Geometry3D geom = versions.get(i);

            String json =
                    geometry3DService.getGeometryAsJson(objectId, i + 1);

            responses.add(
                    new GeometryVersionResponse(
                            objectId,
                            i + 1,
                            geom.getName(),
                            geom.getFormat(),
                            geom.getVertices().size(),
                            geom.getFaces().size(),
                            json
                    )
            );
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * Get specific version
     */
    @GetMapping("/{objectId}/version/{versionNumber}")
    public ResponseEntity<GeometryVersionResponse> getVersion(
            @PathVariable String objectId,
            @PathVariable int versionNumber) {

        Geometry3D geom =
                geometry3DService.getGeometry(objectId, versionNumber);

        if (geom == null) {
            return ResponseEntity.notFound().build();
        }

        String json =
                geometry3DService.getGeometryAsJson(objectId, versionNumber);

        GeometryVersionResponse response =
                new GeometryVersionResponse(
                        objectId,
                        versionNumber,
                        geom.getName(),
                        geom.getFormat(),
                        geom.getVertices().size(),
                        geom.getFaces().size(),
                        json
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Diff versions (delta analysis)
     */
    @GetMapping("/{objectId}/diff")
    public ResponseEntity<GeometryDiffResponse> diffVersions(
            @PathVariable String objectId,
            @RequestParam int from,
            @RequestParam int to) {

        Geometry3DDiff.DiffReport report =
                geometry3DService.diffVersions(objectId, from, to);

        if (report == null) {
            return ResponseEntity.notFound().build();
        }

        GeometryDiffResponse response =
                new GeometryDiffResponse(objectId, from, to);

        response.geometryName = report.geometryName;

        return ResponseEntity.ok(response);
    }
}