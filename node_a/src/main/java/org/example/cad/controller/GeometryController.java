package org.example.cad.controller;

import org.example.cad.dto.response.GeometryDiffResponse;
import org.example.cad.dto.response.GeometryVersionResponse;
import org.example.cad.service.Geometry3DService;

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

        public GeometryController(
                        Geometry3DService geometry3DService) {

                this.geometry3DService = geometry3DService;
        }

        /**
         * Upload geometry
         */
        @PostMapping("/upload")
        public ResponseEntity<GeometryVersionResponse> uploadGeometry(

                        @RequestParam("objectId") String objectId,

                        @RequestParam("file") MultipartFile file,

                        @RequestParam(value = "parentVersion", required = false) String parentVersion,

                        @RequestParam(value = "branchName", required = false) String branchName) {

                try {

                        /**
                         * Validate file
                         */
                        if (file == null
                                        || file.isEmpty()) {

                                return ResponseEntity
                                                .badRequest()
                                                .build();
                        }

                        /**
                         * Upload + store
                         */
                        geometry3DService
                                        .uploadGeometry(

                                                        objectId,

                                                        file.getInputStream(),

                                                        file.getOriginalFilename(),

                                                        parentVersion,

                                                        branchName);

                        /**
                         * Latest version
                         */
                        int versionCount = geometry3DService
                                        .getVersionCount(
                                                        objectId);

                        Geometry3D geometry = geometry3DService
                                        .getGeometry(
                                                        objectId,
                                                        versionCount);

                        if (geometry == null) {

                                return ResponseEntity
                                                .internalServerError()
                                                .build();
                        }

                        String json = geometry3DService
                                        .getGeometryAsJson(
                                                        objectId,
                                                        versionCount);

                        /**
                         * Response DTO
                         */
                        GeometryVersionResponse response = new GeometryVersionResponse(

                                        objectId,

                                        versionCount,

                                        geometry.getName(),

                                        geometry.getFormat(),

                                        geometry
                                                        .getVertices()
                                                        .size(),

                                        geometry
                                                        .getFaces()
                                                        .size(),

                                        json);

                        return ResponseEntity
                                        .ok(response);

                } catch (IOException e) {

                        throw new RuntimeException(
                                        "Failed to upload geometry: "
                                                        + e.getMessage());
                }
        }

        /**
         * Get all versions
         */
        @GetMapping("/{objectId}/versions")
        public ResponseEntity<List<GeometryVersionResponse>> getAllVersions(

                        @PathVariable String objectId) {

                List<Geometry3D> versions = geometry3DService
                                .getAllVersions(
                                                objectId);

                List<GeometryVersionResponse> responses = new ArrayList<>();

                for (Geometry3D geometry : versions) {

                        String json = geometry3DService
                                        .getGeometryAsJson(

                                                        objectId,

                                                        geometry.getVersion());

                        responses.add(

                                        new GeometryVersionResponse(

                                                        objectId,

                                                        geometry.getVersion(),

                                                        geometry.getName(),

                                                        geometry.getFormat(),

                                                        geometry
                                                                        .getVertices()
                                                                        .size(),

                                                        geometry
                                                                        .getFaces()
                                                                        .size(),

                                                        json));
                }

                return ResponseEntity
                                .ok(responses);
        }

        /**
         * Get single version
         */
        @GetMapping("/{objectId}/version/{versionNumber}")
        public ResponseEntity<GeometryVersionResponse> getVersion(

                        @PathVariable String objectId,

                        @PathVariable int versionNumber) {

                Geometry3D geometry = geometry3DService
                                .getGeometry(
                                                objectId,
                                                versionNumber);

                if (geometry == null) {

                        return ResponseEntity
                                        .notFound()
                                        .build();
                }

                String json = geometry3DService
                                .getGeometryAsJson(
                                                objectId,
                                                versionNumber);

                GeometryVersionResponse response = new GeometryVersionResponse(

                                objectId,

                                versionNumber,

                                geometry.getName(),

                                geometry.getFormat(),

                                geometry
                                                .getVertices()
                                                .size(),

                                geometry
                                                .getFaces()
                                                .size(),

                                json);

                return ResponseEntity
                                .ok(response);
        }

        /**
         * Compare versions
         */
        @GetMapping("/{objectId}/diff")
        public ResponseEntity<GeometryDiffResponse> diffVersions(

                        @PathVariable String objectId,

                        @RequestParam int from,

                        @RequestParam int to) {

                Geometry3DDiff.DiffReport report = geometry3DService
                                .diffVersions(
                                                objectId,
                                                from,
                                                to);

                if (report == null) {

                        return ResponseEntity
                                        .notFound()
                                        .build();
                }

                GeometryDiffResponse response = new GeometryDiffResponse(
                                objectId,
                                from,
                                to);

                response.geometryName = report.geometryName;

                return ResponseEntity
                                .ok(response);
        }
}