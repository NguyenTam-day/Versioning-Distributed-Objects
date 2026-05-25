package org.example.cad.service.geometry;

import com.google.gson.Gson;

import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.repository.VersionRepository;
import org.example.cad.service.sync.SyncService;

import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
import org.example.dv.ObjParser;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Geometry Service
 *
 * Features:
 * - OBJ parsing
 * - Geometry versioning
 * - MongoDB persistence
 * - Distributed node tracking
 * - Conflict detection
 * - Version diff analysis
 */
@Service
public class Geometry3DService {

    private final Geometry3DRepository geometry3DRepository;
    private final VersionRepository versionRepository;
    private final SyncService syncService;

    private final Gson gson = new Gson();

    /**
     * Current node/site id
     *
     * node-a
     * node-b
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
     * Upload geometry
     */
    public String uploadGeometry(
            String objectId,
            InputStream inputStream,
            String filename) throws IOException {

        Geometry3D geometry = ObjParser.parseFromInputStream(
                inputStream,
                filename);

        /**
         * Count current versions
         */
        int newVersion = (int) geometry3DRepository
                .countByObjectId(
                        objectId)
                + 1;

        /**
         * Set metadata
         */
        geometry.setVersion(
                newVersion);

        geometry.setSiteId(
                currentSiteId);

        geometry.setTimestamp(
                System.currentTimeMillis());

        /**
         * Convert to DB model
         */
        Geometry3DModel model = Geometry3DModel.createNew(

                objectId,

                newVersion,

                geometry.getName(),

                geometry.getFormat(),

                gson.toJson(
                        geometry.getVertices()),

                gson.toJson(
                        geometry.getFaces()),

                gson.toJson(
                        geometry),

                currentSiteId);

        try {

            geometry3DRepository
                    .save(model);

            // Create corresponding VersionDoc
            String parentVersion = null;
            if (newVersion > 1) {
                parentVersion = String.valueOf(newVersion - 1);
            }

            VersionDoc versionDoc = VersionDoc.createNew(
                    objectId,
                    newVersion,
                    "Upload file: " + filename,
                    gson.toJson(geometry),
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

        } catch (DuplicateKeyException e) {

            throw new RuntimeException(
                    "Version conflict detected");
        }

        return gson.toJson(
                geometry);
    }

    /**
     * Get geometry by version
     */
    public Geometry3D getGeometry(
            String objectId,
            int version) {

        Optional<Geometry3DModel> model = geometry3DRepository
                .findByObjectIdAndVersion(
                        objectId,
                        version);

        if (model.isEmpty()) {

            return null;
        }

        return gson.fromJson(
                model.get()
                        .getGeometryJson(),

                Geometry3D.class);
    }

    /**
     * Get all versions
     */
    public List<Geometry3D> getAllVersions(
            String objectId) {

        List<Geometry3DModel> models = geometry3DRepository
                .findByObjectIdOrderByVersionAsc(
                        objectId);

        List<Geometry3D> result = new ArrayList<>();

        for (Geometry3DModel model : models) {

            result.add(

                    gson.fromJson(
                            model.getGeometryJson(),
                            Geometry3D.class));
        }

        return result;
    }

    /**
     * Diff between versions
     */
    public Geometry3DDiff.DiffReport diffVersions(
            String objectId,
            int fromVersion,
            int toVersion) {

        Geometry3D from = getGeometry(
                objectId,
                fromVersion);

        Geometry3D to = getGeometry(
                objectId,
                toVersion);

        if (from == null
                || to == null) {

            return null;
        }

        return Geometry3DDiff
                .diff(from, to);
    }

    /**
     * Get geometry JSON
     */
    public String getGeometryAsJson(
            String objectId,
            int version) {

        Optional<Geometry3DModel> model = geometry3DRepository
                .findByObjectIdAndVersion(
                        objectId,
                        version);

        return model
                .map(
                        Geometry3DModel::getGeometryJson)
                .orElse(null);
    }

    /**
     * Get total version count
     */
    public int getVersionCount(
            String objectId) {

        return (int) geometry3DRepository
                .countByObjectId(
                        objectId);
    }

    /**
     * Check conflict
     */
    public boolean hasConflict(
            String objectId,
            String siteId,
            int baseVersion) {

        List<Geometry3DModel> siteVersions = geometry3DRepository
                .findByObjectIdAndSiteId(
                        objectId,
                        siteId);

        if (siteVersions.isEmpty()) {

            return false;
        }

        int latestSiteVersion = siteVersions
                .stream()

                .max(
                        Comparator.comparingInt(
                                Geometry3DModel::getVersion))

                .map(
                        Geometry3DModel::getVersion)

                .orElse(0);

        return latestSiteVersion > baseVersion;
    }

    /**
     * Delete all versions
     */
    public void deleteObject(
            String objectId) {

        List<Geometry3DModel> models = geometry3DRepository
                .findByObjectId(
                        objectId);

        geometry3DRepository
                .deleteAll(models);
    }

    /**
     * Get latest version
     */
    public Geometry3D getLatestVersion(
            String objectId) {

        List<Geometry3D> versions = getAllVersions(
                objectId);

        if (versions.isEmpty()) {

            return null;
        }

        return versions.get(
                versions.size() - 1);
    }

    /**
     * Check object exists
     */
    public boolean exists(
            String objectId) {

        return geometry3DRepository
                .countByObjectId(
                        objectId) > 0;
    }
}