package org.example.cad.controller;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.repository.VersionRepository;
import org.example.cad.repository.Geometry3DRepository;
import org.example.cad.service.sync.SyncService;
import org.example.dv.Geometry3D;
import com.google.gson.Gson;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    private final VersionRepository versionRepository;
    private final SyncService syncService;
    private final Geometry3DRepository geometry3DRepository;

    public SyncController(VersionRepository versionRepository, SyncService syncService, Geometry3DRepository geometry3DRepository) {
        this.versionRepository = versionRepository;
        this.syncService = syncService;
        this.geometry3DRepository = geometry3DRepository;
    }

    private void saveGeometryFromVersion(VersionDoc versionDoc) {
        if (versionDoc.getGeometryData() != null && !versionDoc.getGeometryData().isEmpty()) {
            try {
                Gson gson = new Gson();
                Geometry3D geometry = gson.fromJson(versionDoc.getGeometryData(), Geometry3D.class);
                if (geometry != null) {
                    if (!geometry3DRepository.findByObjectIdAndVersion(versionDoc.getModelId(), versionDoc.getVersionNumber()).isPresent()) {
                        Geometry3DModel geoModel = Geometry3DModel.createNew(
                                versionDoc.getModelId(),
                                versionDoc.getVersionNumber(),
                                geometry.getName() != null ? geometry.getName() : "model",
                                geometry.getFormat() != null ? geometry.getFormat() : "obj",
                                gson.toJson(geometry.getVertices()),
                                gson.toJson(geometry.getFaces()),
                                versionDoc.getGeometryData(),
                                versionDoc.getSiteId()
                        );
                        geoModel.setTimestamp(versionDoc.getTimestamp());
                        geometry3DRepository.save(geoModel);
                    }
                }
            } catch (Exception e) {
                // Non-blocking sync error
            }
        }
    }

    @PostMapping("/receive-version")
    public ResponseEntity<Void> receiveVersion(@RequestBody VersionDoc versionDoc) {
        versionDoc.setSyncStatus("SYNCED");
        versionRepository.save(versionDoc);
        saveGeometryFromVersion(versionDoc);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/push")
    public ResponseEntity<Void> push(@RequestBody VersionDoc versionDoc) {
        versionDoc.setSyncStatus("SYNCED");
        versionRepository.save(versionDoc);
        saveGeometryFromVersion(versionDoc);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trigger-push")
    public ResponseEntity<Void> triggerPush(@RequestBody Map<String, String> payload) {
        String modelId = payload.get("modelId");
        String targetNode = payload.get("targetNode");
        if (modelId != null && targetNode != null) {
            syncService.pushToRemote(modelId, targetNode);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }
}
