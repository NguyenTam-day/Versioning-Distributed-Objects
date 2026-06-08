package org.example.cad.service;

import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.repository.VersionRepository;
import org.example.cad.service.SyncService;
import org.example.cad.service.VersionService;
import org.example.cad.dto.request.CreateVersionRequest;
import org.example.dv.*;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.dao.DuplicateKeyException;
import com.google.gson.Gson;
import org.springframework.data.mongodb.core.MongoTemplate;
import jakarta.annotation.PostConstruct;

@Service
/**
 * Service for processing 3D CAD files and managing geometry versions.
 */
public class Geometry3DService {
    private final Geometry3DRepository geometry3DRepository;
    private final VersionRepository versionRepository;
    private final SyncService syncService;
    private final VersionService versionService;
    private final MongoTemplate mongoTemplate;

    /**
     * siteId lấy từ application.yml (app.site-id: node-b)
     * Đảm bảo luôn lưu đúng node vào database
     */
    @Value("${app.site-id}")
    private String currentSiteId;

    public Geometry3DService(
            Geometry3DRepository geometry3DRepository,
            VersionRepository versionRepository,
            SyncService syncService,
            VersionService versionService,
            MongoTemplate mongoTemplate) {
        this.geometry3DRepository = geometry3DRepository;
        this.versionRepository = versionRepository;
        this.syncService = syncService;
        this.versionService = versionService;
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void dropOldIndex() {
        try {
            mongoTemplate.indexOps("geometries").dropIndex("object_version_idx");
        } catch (Exception e) {
            // Ignore if index doesn't exist
        }
    }

    /**
     * Upload and parse a 3D file (OBJ format).
     * siteId được lấy từ application config — không nhận từ tham số
     */
    public VersionDoc uploadGeometry(String objectId, InputStream inputStream, String filename, String parentVersion,
            String branchName) throws IOException {
        Geometry3D geometry = ObjParser.parseFromInputStream(inputStream, filename);

        Geometry3D latestGeometry = null;
        if (parentVersion != null && !parentVersion.isEmpty()) {
            Optional<VersionDoc> parentDocOpt = versionRepository.findByModelIdAndVersionName(objectId, parentVersion).stream().findFirst();
            if (parentDocOpt.isPresent()) {
                latestGeometry = versionService.reconstructGeometry(parentDocOpt.get());
            }
        }
        if (latestGeometry == null) {
            latestGeometry = getLatestVersion(objectId);
        }

        if (latestGeometry != null) {
            Geometry3DDiff.DiffReport diffReport = Geometry3DDiff.diff(latestGeometry, geometry);
            boolean hasChanges = diffReport.vertexModifications > 0 || diffReport.vertexAdditions > 0
                    || diffReport.vertexDeletions > 0
                    || diffReport.faceModifications > 0 || diffReport.faceAdditions > 0 || diffReport.faceDeletions > 0;
            if (!hasChanges) {
                throw new IllegalArgumentException("Geometry data has not changed. Upload aborted.");
            }
        }

        VersionDoc versionDoc;
        try {
            // Create corresponding VersionDoc using VersionService first to generate the unique sequential versionNumber
            CreateVersionRequest req = new CreateVersionRequest();
            req.setModelId(objectId);
            req.setCommitMessage("Upload file: " + filename);
            req.setGeometryData(new Gson().toJson(geometry));
            req.setAuthor("system");
            req.setBranchName(branchName != null && !branchName.isEmpty() ? branchName : "main");
            req.setParentVersion(parentVersion);

            versionDoc = versionService.createVersion(req, currentSiteId);
            int newVersion = versionDoc.getVersionNumber();

            geometry.setVersion(newVersion);
            geometry.setSiteId(currentSiteId);
            geometry.setTimestamp(versionDoc.getTimestamp().toEpochMilli());

            // Save to database
            Geometry3DModel model = Geometry3DModel.createNew(
                    objectId,
                    newVersion,
                    geometry.getName(),
                    geometry.getFormat(),
                    currentSiteId);
            model.setTimestamp(versionDoc.getTimestamp().toEpochMilli());

            geometry3DRepository.save(model);

            // Asynchronously sync version to peers
            try {
                syncService.syncVersionToPeersAsync(versionDoc);
            } catch (Exception e) {
                // Non-blocking sync
            }

        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Version conflict detected");
        }

        return versionDoc;
    }

    /**
     * Get geometry by object ID and version number (1-indexed).
     * Reads geometry data and reconstructs from VersionDoc delta chain.
     */
    public Geometry3D getGeometry(String objectId, int version) {
        Optional<VersionDoc> vd = versionRepository.findByModelIdAndVersionNumber(objectId, version);
        if (vd.isEmpty() || vd.get().getGeometryData() == null)
            return null;
        return versionService.reconstructGeometry(vd.get());
    }

    /**
     * Get all versions of a geometry.
     * Reads geometry data and reconstructs from VersionDoc delta chain.
     */
    public List<Geometry3D> getAllVersions(String objectId) {
        List<VersionDoc> versionDocs = versionRepository.findByModelIdOrderByVersionNumberAsc(objectId);
        List<Geometry3D> result = new ArrayList<>();
        for (VersionDoc vd : versionDocs) {
            if (vd.getGeometryData() != null) {
                Geometry3D geom = versionService.reconstructGeometry(vd);
                if (geom != null) {
                    result.add(geom);
                }
            }
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
     * Get JSON representation of a geometry from VersionDoc — always returns full reconstructed geometry.
     */
    public String getGeometryAsJson(String objectId, int version) {
        Optional<VersionDoc> vd = versionRepository.findByModelIdAndVersionNumber(objectId, version);
        if (vd.isEmpty()) return null;
        Geometry3D geo = versionService.reconstructGeometry(vd.get());
        return geo != null ? new Gson().toJson(geo) : null;
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
        if (siteVersions.isEmpty())
            return false;
        int latestSiteVersion = siteVersions.stream()
                .mapToInt(Geometry3DModel::getVersion)
                .max()
                .orElse(0);
        return latestSiteVersion > baseVersion;
    }

    /**
     * Get latest version geometry for an object (across all branches).
     */
    public Geometry3D getLatestVersion(String objectId) {
        List<Geometry3D> versions = getAllVersions(objectId);
        if (versions.isEmpty()) return null;
        return versions.get(versions.size() - 1);
    }
}
