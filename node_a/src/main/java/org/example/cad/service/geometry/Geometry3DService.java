package org.example.cad.service.geometry;

import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
import org.example.dv.ObjParser;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class Geometry3DService {

    private final Map<String, List<Geometry3D>> geometryStore = new ConcurrentHashMap<>();
    private final Map<String, String> geometryJson = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Integer>> siteVersionTracker = new ConcurrentHashMap<>();

    // =========================
    // REAL PARSER (OBJ)
    // =========================
    private Geometry3D parse(InputStream in, String filename) throws IOException {
        return ObjParser.parseFromInputStream(in, filename);
    }

    // =========================
    // UPLOAD VERSION
    // =========================
    public Geometry3D uploadGeometry(String objectId,
                                     String siteId,
                                     InputStream inputStream,
                                     String filename) throws IOException {

        Geometry3D geometry = parse(inputStream, filename);

        List<Geometry3D> versions =
                geometryStore.computeIfAbsent(objectId,
                        k -> Collections.synchronizedList(new ArrayList<>()));

        int newVersion = versions.size() + 1;

        geometry.setVersion(newVersion);
        geometry.setSiteId(siteId);
        geometry.setTimestamp(System.currentTimeMillis());

        versions.add(geometry);

        geometryJson.put(objectId + "_" + newVersion, geometry.toJson());

        siteVersionTracker
                .computeIfAbsent(objectId, k -> new ConcurrentHashMap<>())
                .put(siteId, newVersion);

        return geometry;
    }

    // =========================
    // GET VERSION
    // =========================
    public Geometry3D getGeometry(String objectId, int version) {
        List<Geometry3D> versions = geometryStore.get(objectId);
        if (versions == null || version <= 0 || version > versions.size()) return null;
        return versions.get(version - 1);
    }

    // =========================
    // LIST ALL
    // =========================
    public List<Geometry3D> getAllVersions(String objectId) {
        return geometryStore.getOrDefault(objectId, new ArrayList<>());
    }

    // =========================
    // DIFF
    // =========================
    public Geometry3DDiff.DiffReport diffVersions(String objectId, int from, int to) {
        Geometry3D a = getGeometry(objectId, from);
        Geometry3D b = getGeometry(objectId, to);
        if (a == null || b == null) return null;
        return Geometry3DDiff.diff(a, b);
    }

    // =========================
    // JSON SNAPSHOT
    // =========================
    public String getGeometryAsJson(String objectId, int version) {
        return geometryJson.get(objectId + "_" + version);
    }

    // =========================
    // VERSION COUNT
    // =========================
    public int getVersionCount(String objectId) {
        List<Geometry3D> v = geometryStore.get(objectId);
        return v == null ? 0 : v.size();
    }

    // =========================
    // CONFLICT CHECK
    // =========================
    public boolean hasConflict(String objectId, String siteId, int baseVersion) {
        Map<String, Integer> map = siteVersionTracker.get(objectId);
        if (map == null) return false;
        Integer last = map.get(siteId);
        return last != null && last > baseVersion;
    }
}