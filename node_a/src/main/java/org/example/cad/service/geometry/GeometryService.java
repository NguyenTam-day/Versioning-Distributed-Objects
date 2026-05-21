package org.example.cad.service.geometry;

import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
import org.example.dv.ObjParser;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * Core Geometry Service
 * - Handles versioning
 * - Stores geometry history
 * - Provides diff (delta analysis)
 * - Supports distributed site tracking (basic)
 */
@Service
public class GeometryService {

    private final Map<String, List<Geometry3D>> store = new HashMap<>();
    private final Map<String, String> jsonCache = new HashMap<>();
    private final Map<String, Map<String, Integer>> siteVersion = new HashMap<>();

    /**
     * Upload geometry (new version)
     */
    public Geometry3D upload(String objectId,
                             String siteId,
                             InputStream inputStream,
                             String filename) throws IOException {

        Geometry3D geometry = ObjParser.parseFromInputStream(inputStream, filename);

        List<Geometry3D> versions =
                store.computeIfAbsent(objectId, k -> new ArrayList<>());

        int newVersion = versions.size() + 1;

        geometry.setVersion(newVersion);
        geometry.setSiteId(siteId);
        geometry.setTimestamp(System.currentTimeMillis());

        versions.add(geometry);

        jsonCache.put(objectId + "_" + newVersion, geometry.toJson());

        siteVersion
                .computeIfAbsent(objectId, k -> new HashMap<>())
                .put(siteId, newVersion);

        return geometry;
    }

    /**
     * Get specific version
     */
    public Geometry3D get(String objectId, int version) {
        List<Geometry3D> list = store.get(objectId);
        if (list == null || version <= 0 || version > list.size()) return null;
        return list.get(version - 1);
    }

    /**
     * Get all versions
     */
    public List<Geometry3D> getAll(String objectId) {
        return store.getOrDefault(objectId, new ArrayList<>());
    }

    /**
     * Version count
     */
    public int count(String objectId) {
        List<Geometry3D> list = store.get(objectId);
        return list == null ? 0 : list.size();
    }

    /**
     * JSON snapshot (for storage comparison: FULL snapshot)
     */
    public String getJson(String objectId, int version) {
        return jsonCache.get(objectId + "_" + version);
    }

    /**
     * Delta analysis (diff between versions)
     */
    public Geometry3DDiff.DiffReport diff(String objectId, int from, int to) {

        Geometry3D a = get(objectId, from);
        Geometry3D b = get(objectId, to);

        if (a == null || b == null) return null;

        return Geometry3DDiff.diff(a, b);
    }

    /**
     * Basic conflict detection
     * (same site editing same base version)
     */
    public boolean hasConflict(String objectId, String siteId, int baseVersion) {

        Map<String, Integer> map = siteVersion.get(objectId);

        if (map == null) return false;

        Integer last = map.get(siteId);

        return last != null && last != baseVersion;
    }
}