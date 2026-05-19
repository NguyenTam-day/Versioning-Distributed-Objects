package org.example.cad.controller;

import org.example.cad.service.geometry.Geometry3DService;
import org.example.cad.dto.response.GeometryVersionResponse;
import org.example.cad.dto.response.GeometryDiffResponse;
import org.example.dv.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * REST Controller for 3D Geometry upload, parsing, and diff operations.
 * Endpoints (for demo, without Spring annotations):
 *  POST   /api/geometry upload
 *  GET    /api/geometry/{id}/versions
 *  GET    /api/geometry/{id}/version/{versionNumber}
 *  GET    /api/geometry/{id}/diff
 */
public class GeometryController {
    private final Geometry3DService geometry3DService;

    public GeometryController(Geometry3DService geometry3DService) {
        this.geometry3DService = geometry3DService;
    }

    /**
     * Upload a 3D file and parse it.
     * Mock: returns summary of parsed geometry.
     */
    public GeometryVersionResponse uploadGeometry(String objectId, InputStream fileInputStream, String filename) {
        try {
            geometry3DService.uploadGeometry(objectId, fileInputStream, filename);
            int versionCount = geometry3DService.getVersionCount(objectId);
            Geometry3D geom = geometry3DService.getGeometry(objectId, versionCount);
            String json = geometry3DService.getGeometryAsJson(objectId, versionCount);

            return new GeometryVersionResponse(
                objectId,
                versionCount,
                geom.getName(),
                geom.getFormat(),
                geom.getVertices().size(),
                geom.getFaces().size(),
                json
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload geometry: " + e.getMessage());
        }
    }

    /**
     * Get all versions of a geometry object.
     */
    public List<GeometryVersionResponse> getAllVersions(String objectId) {
        List<Geometry3D> versions = geometry3DService.getAllVersions(objectId);
        List<GeometryVersionResponse> responses = new ArrayList<>();

        for (int i = 0; i < versions.size(); i++) {
            Geometry3D geom = versions.get(i);
            String json = geometry3DService.getGeometryAsJson(objectId, i + 1);
            responses.add(new GeometryVersionResponse(
                objectId,
                i + 1,
                geom.getName(),
                geom.getFormat(),
                geom.getVertices().size(),
                geom.getFaces().size(),
                json
            ));
        }

        return responses;
    }

    /**
     * Get a specific version of a geometry object.
     */
    public GeometryVersionResponse getVersion(String objectId, int versionNumber) {
        Geometry3D geom = geometry3DService.getGeometry(objectId, versionNumber);
        if (geom == null) {
            throw new RuntimeException("Version not found");
        }

        String json = geometry3DService.getGeometryAsJson(objectId, versionNumber);
        return new GeometryVersionResponse(
            objectId,
            versionNumber,
            geom.getName(),
            geom.getFormat(),
            geom.getVertices().size(),
            geom.getFaces().size(),
            json
        );
    }

    /**
     * Compute diff between two versions.
     */
    public GeometryDiffResponse diffVersions(String objectId, int fromVersion, int toVersion) {
        Geometry3DDiff.DiffReport report = geometry3DService.diffVersions(objectId, fromVersion, toVersion);
        if (report == null) {
            throw new RuntimeException("Cannot compute diff: one or both versions not found");
        }

        GeometryDiffResponse response = new GeometryDiffResponse(objectId, fromVersion, toVersion);
        response.geometryName = report.geometryName;
        response.oldVertexCount = report.oldVertexCount;
        response.newVertexCount = report.newVertexCount;
        response.vertexAdditions = report.vertexAdditions;
        response.vertexModifications = report.vertexModifications;
        response.vertexDeletions = report.vertexDeletions;
        response.oldFaceCount = report.oldFaceCount;
        response.newFaceCount = report.newFaceCount;
        response.faceAdditions = report.faceAdditions;
        response.faceDeletions = report.faceDeletions;

        // Convert vertex changes to maps for JSON serialization
        response.vertexChanges = new ArrayList<>();
        for (Geometry3DDiff.VertexChange vc : report.vertexChanges) {
            Map<String, Object> change = new HashMap<>();
            change.put("index", vc.index);
            change.put("type", vc.type);
            if (vc.oldValue != null) {
                change.put("oldValue", String.format("(%.2f, %.2f, %.2f)", vc.oldValue.getX(), vc.oldValue.getY(), vc.oldValue.getZ()));
            }
            if (vc.newValue != null) {
                change.put("newValue", String.format("(%.2f, %.2f, %.2f)", vc.newValue.getX(), vc.newValue.getY(), vc.newValue.getZ()));
            }
            response.vertexChanges.add(change);
        }

        // Convert face changes to maps for JSON serialization
        response.faceChanges = new ArrayList<>();
        for (Geometry3DDiff.FaceChange fc : report.faceChanges) {
            Map<String, Object> change = new HashMap<>();
            change.put("index", fc.index);
            change.put("type", fc.type);
            if (fc.oldValue != null) {
                change.put("oldValue", fc.oldValue.getVertexIndices());
            }
            if (fc.newValue != null) {
                change.put("newValue", fc.newValue.getVertexIndices());
            }
            response.faceChanges.add(change);
        }

        return response;
    }
}

