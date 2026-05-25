package org.example.cad.service.geometry;

import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.repository.VersionRepository;
import org.example.cad.service.sync.SyncService;
import org.example.dv.*;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.google.gson.Gson;

@Service
/**
 * Service for processing 3D CAD files and managing geometry versions.
 */
public class Geometry3DService {
    private final Geometry3DRepository geometry3DRepository;
    private final VersionRepository versionRepository;
    private final SyncService syncService;

    /**
     * siteId lấy từ application.yml (app.site-id: node-b)
     * Đảm bảo luôn lưu đúng node vào database
     */
    @Value("${app.site-id}")
    private String currentSiteId;

    public Geometry3DService(
            Geometry3DRepository geometry3DRepository,
            VersionRepository versionRepository,
            SyncService syncService) {
        this.geometry3DRepository = geometry3DRepository;
        this.versionRepository = versionRepository;
        this.syncService = syncService;
    }

    /**
     * Upload and parse a 3D file (OBJ format).
     * siteId được lấy từ application config — không nhận từ tham số
     */
    public String uploadGeometry(String objectId, InputStream inputStream, String filename) throws IOException {
        Geometry3D geometry = ObjParser.parseFromInputStream(inputStream, filename);

        List<Geometry3DModel> versions = geometry3DRepository.findByObjectId(objectId);
        int newVersion = versions.isEmpty() ? 1 : versions.size() + 1;

        geometry.setVersion(newVersion);
        geometry.setSiteId(currentSiteId);
        geometry.setTimestamp(System.currentTimeMillis());

        // Save to database
        Geometry3DModel model = Geometry3DModel.createNew(
                objectId,
                newVersion,
                geometry.getName(),
                geometry.getFormat(),
                new Gson().toJson(geometry.getVertices()),
                new Gson().toJson(geometry.getFaces()),
                new Gson().toJson(geometry),
                currentSiteId
        );

        geometry3DRepository.save(model);

        // Create corresponding VersionDoc
        String parentVersion = null;
        if (newVersion > 1) {
            parentVersion = String.valueOf(newVersion - 1);
        }

        VersionDoc versionDoc = VersionDoc.createNew(
                objectId,
                newVersion,
                "Upload file: " + filename,
                new Gson().toJson(geometry),
                "system",
                currentSiteId,
                "main",
                parentVersion,
                true
        );

        versionRepository.save(versionDoc);

        // Asynchronously sync version to peers
        try {
            syncService.syncVersionToPeers(versionDoc);
        } catch (Exception e) {
            // Non-blocking sync
        }

        return new Gson().toJson(geometry);
    }

    /**
     * Get geometry by object ID and version number (1-indexed).
     */
    public Geometry3D getGeometry(String objectId, int version) {
        Optional<Geometry3DModel> model = geometry3DRepository.findByObjectIdAndVersion(objectId, version);
        if (model.isEmpty()) return null;
        return new Gson().fromJson(model.get().getGeometryJson(), Geometry3D.class);
    }

    /**
     * Get all versions of a geometry.
     */
    public List<Geometry3D> getAllVersions(String objectId) {
        List<Geometry3DModel> models = geometry3DRepository.findByObjectId(objectId);
        List<Geometry3D> result = new ArrayList<>();
        Gson gson = new Gson();
        for (Geometry3DModel model : models) {
            result.add(gson.fromJson(model.getGeometryJson(), Geometry3D.class));
        }
        return result;
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
        Optional<Geometry3DModel> model = geometry3DRepository.findByObjectIdAndVersion(objectId, version);
        return model.map(Geometry3DModel::getGeometryJson).orElse(null);
    }

    /**
     * Get version count for an object.
     */
    public int getVersionCount(String objectId) {
        return (int) geometry3DRepository.findByObjectId(objectId).size();
    }

    /**
     * Conflict resolution helper
     */
    public boolean hasConflict(String objectId, String siteId, int baseVersion) {
        List<Geometry3DModel> siteVersions = geometry3DRepository.findByObjectIdAndSiteId(objectId, siteId);
        if (siteVersions.isEmpty()) return false;
        int latestSiteVersion = siteVersions.stream()
                .mapToInt(Geometry3DModel::getVersion)
                .max()
                .orElse(0);
        return latestSiteVersion > baseVersion;
    }
}
