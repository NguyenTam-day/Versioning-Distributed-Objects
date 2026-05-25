package org.example.cad.controller;

import org.example.cad.dto.response.GeometryVersionResponse;
import org.example.cad.dto.response.GeometryDiffResponse;
import org.example.cad.dto.common.ApiResponse;
import org.example.cad.service.geometry.Geometry3DService;
import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;

import org.springframework.beans.factory.annotation.Value;
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

    /**
     * siteId lấy từ application.yml (app.site-id)
     * Không nhận từ request — tránh client gửi sai node
     */
    @Value("${app.site-id}")
    private String siteId;

    public GeometryController(Geometry3DService geometry3DService) {
        this.geometry3DService = geometry3DService;
    }

    /**
     * Upload geometry version — parse OBJ, lưu vào collection "geometries"
     */
    @PostMapping("/upload")
    public ResponseEntity<GeometryVersionResponse> uploadGeometry(
            @RequestParam("objectId") String objectId,
            @RequestParam("file") MultipartFile file) {

        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(400).build();
            }

            geometry3DService.uploadGeometry(
                    objectId,
                    file.getInputStream(),
                    file.getOriginalFilename()
            );

            int versionCount = geometry3DService.getVersionCount(objectId);

            Geometry3D geom = geometry3DService.getGeometry(objectId, versionCount);

            String json = geometry3DService.getGeometryAsJson(objectId, versionCount);

            GeometryVersionResponse response = new GeometryVersionResponse(
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
            throw new RuntimeException("Failed to upload geometry: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả versions của một object
     */
    @GetMapping("/{objectId}/versions")
    public ResponseEntity<List<GeometryVersionResponse>> getAllVersions(
            @PathVariable String objectId) {

        List<Geometry3D> versions = geometry3DService.getAllVersions(objectId);

        List<GeometryVersionResponse> responses = new ArrayList<>();

        for (int i = 0; i < versions.size(); i++) {
            Geometry3D geom = versions.get(i);
            String json = geometry3DService.getGeometryAsJson(objectId, i + 1);
            responses.add(new GeometryVersionResponse(
                    objectId, i + 1,
                    geom.getName(), geom.getFormat(),
                    geom.getVertices().size(), geom.getFaces().size(),
                    json
            ));
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * Lấy một version cụ thể
     */
    @GetMapping("/{objectId}/version/{versionNumber}")
    public ResponseEntity<GeometryVersionResponse> getVersion(
            @PathVariable String objectId,
            @PathVariable int versionNumber) {

        Geometry3D geom = geometry3DService.getGeometry(objectId, versionNumber);

        if (geom == null) {
            return ResponseEntity.notFound().build();
        }

        String json = geometry3DService.getGeometryAsJson(objectId, versionNumber);

        return ResponseEntity.ok(new GeometryVersionResponse(
                objectId, versionNumber,
                geom.getName(), geom.getFormat(),
                geom.getVertices().size(), geom.getFaces().size(),
                json
        ));
    }

    /**
     * So sánh diff giữa 2 versions
     */
    @GetMapping("/{objectId}/diff")
    public ResponseEntity<GeometryDiffResponse> diffVersions(
            @PathVariable String objectId,
            @RequestParam int from,
            @RequestParam int to) {

        Geometry3DDiff.DiffReport report = geometry3DService.diffVersions(objectId, from, to);

        if (report == null) {
            return ResponseEntity.notFound().build();
        }

        GeometryDiffResponse response = new GeometryDiffResponse(objectId, from, to);
        response.geometryName = report.geometryName;

        return ResponseEntity.ok(response);
    }
}
