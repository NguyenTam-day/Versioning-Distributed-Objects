package org.example.cad.service;

import com.google.gson.Gson;

import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.repository.VersionRepository;
import org.example.cad.service.SyncService;
import org.example.cad.service.VersionService;
import org.example.cad.dto.request.CreateVersionRequest;

import org.example.dv.Geometry3D;
import org.example.dv.Geometry3DDiff;
import org.example.dv.ObjParser;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;
import jakarta.annotation.PostConstruct;

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
        private final VersionService versionService;
        private final MongoTemplate mongoTemplate;

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
         * Upload geometry
         */
        public VersionDoc uploadGeometry(
                        String objectId,
                        InputStream inputStream,
                        String filename,
                        String parentVersion,
                        String branchName) throws IOException {

                Geometry3D geometry = ObjParser.parseFromInputStream(
                                inputStream,
                                filename);

                 Geometry3D latestGeometry = null;
                 if (parentVersion != null && !parentVersion.isEmpty()) {
                         Optional<VersionDoc> parentDocOpt = versionRepository.findByModelIdAndVersionName(objectId, parentVersion);
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
                                         || diffReport.faceModifications > 0 || diffReport.faceAdditions > 0
                                         || diffReport.faceDeletions > 0;
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
                         req.setGeometryData(gson.toJson(geometry));
                         req.setAuthor("system");
                         req.setBranchName(branchName != null && !branchName.isEmpty() ? branchName : "main");
                         req.setParentVersion(parentVersion);

                         versionDoc = versionService.createVersion(req, currentSiteId);
                         int newVersion = versionDoc.getVersionNumber();

                         /**
                          * Set metadata on geometry
                          */
                         geometry.setVersion(newVersion);
                         geometry.setSiteId(currentSiteId);
                         geometry.setTimestamp(versionDoc.getTimestamp().toEpochMilli());

                         /**
                          * Convert and save to DB model
                          */
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
         * Get geometry by version — read and reconstruct from VersionDoc delta chain
         */
        public Geometry3D getGeometry(
                        String objectId,
                        int version) {

                Optional<VersionDoc> vd = versionRepository
                                .findByModelIdAndVersionNumber(objectId, version);

                if (vd.isEmpty() || vd.get().getGeometryData() == null) {
                        return null;
                }

                return versionService.reconstructGeometry(vd.get());
        }

        /**
         * Get all versions — read and reconstruct from VersionDoc delta chain
         */
        public List<Geometry3D> getAllVersions(
                        String objectId) {

                List<VersionDoc> versionDocs = versionRepository
                                .findByModelIdOrderByVersionNumberAsc(objectId);

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
         * Get geometry JSON from VersionDoc — always returns full reconstructed geometry
         */
        public String getGeometryAsJson(
                        String objectId,
                        int version) {

                Optional<VersionDoc> vd = versionRepository
                                .findByModelIdAndVersionNumber(objectId, version);

                if (vd.isEmpty()) return null;

                Geometry3D geo = versionService.reconstructGeometry(vd.get());
                return geo != null ? gson.toJson(geo) : null;
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