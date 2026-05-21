package org.example.cad.service.geometry;

import org.example.dv.*;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
/**
 * Service for processing 3D CAD files and managing geometry versions.
 */
public class Geometry3DService {
    private final Map<String, List<Geometry3D>> geometryStore = new HashMap<>();
    private final Map<String, String> geometryJson = new HashMap<>();

    /**
     * Upload and parse a 3D file (OBJ format).
     */
    public String uploadGeometry(String objectId, InputStream inputStream, String filename) throws IOException {
        Geometry3D geometry = ObjParser.parseFromInputStream(inputStream, filename);

        // Store geometry
        geometryStore.computeIfAbsent(objectId, k -> new ArrayList<>()).add(geometry);
        String json = geometry.toJson();
        geometryJson.put(objectId + "_" + geometryStore.get(objectId).size(), json);

        return geometry.toString();
    }

    /**
     * Get geometry by object ID and version number (1-indexed).
     */
    public Geometry3D getGeometry(String objectId, int version) {
        List<Geometry3D> versions = geometryStore.get(objectId);
        if (versions != null && version > 0 && version <= versions.size()) {
            return versions.get(version - 1);
        }
        return null;
    }

    /**
     * Get all versions of a geometry.
     */
    public List<Geometry3D> getAllVersions(String objectId) {
        return geometryStore.getOrDefault(objectId, new ArrayList<>());
    }

    /**
     * Compute diff between two versions.
     */
    public Geometry3DDiff.DiffReport diffVersions(String objectId, int fromVersion, int toVersion) {
        Geometry3D from = getGeometry(objectId, fromVersion);
        Geometry3D to = getGeometry(objectId, toVersion);
        if (from == null || to == null) {
            return null;
        }
        return Geometry3DDiff.diff(from, to);
    }

    /**
     * Get JSON representation of a geometry.
     */
    public String getGeometryAsJson(String objectId, int version) {
        Geometry3D geom = getGeometry(objectId, version);
        return geom != null ? geom.toJson() : null;
    }

    /**
     * Get version count for an object.
     */
    public int getVersionCount(String objectId) {
        List<Geometry3D> versions = geometryStore.get(objectId);
        return versions != null ? versions.size() : 0;
    }
}

