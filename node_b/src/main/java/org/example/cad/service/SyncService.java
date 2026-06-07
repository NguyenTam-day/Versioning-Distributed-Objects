package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.domain.model.Geometry3DModel;
import org.example.cad.repository.VersionRepository;
import org.example.cad.repository.Geometry3DRepository;
import org.example.dv.Geometry3D;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@ConfigurationProperties(prefix = "node")
public class SyncService {
    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final VersionRepository versionRepository;
    private final RestTemplate restTemplate;
    private final SyncControlService syncControlService;
    private final Geometry3DRepository geometry3DRepository;
    private final VersionService versionService;
    private final Gson gson = new Gson();

    private List<String> peers;

    public List<String> getPeers() {
        return peers;
    }

    public void setPeers(List<String> peers) {
        this.peers = peers;
    }

    public SyncService(VersionRepository versionRepository,
            RestTemplate restTemplate,
            SyncControlService syncControlService,
            Geometry3DRepository geometry3DRepository,
            VersionService versionService) {
        this.versionRepository = versionRepository;
        this.restTemplate = restTemplate;
        this.syncControlService = syncControlService;
        this.geometry3DRepository = geometry3DRepository;
        this.versionService = versionService;
    }

    private void saveGeometryFromVersion(VersionDoc versionDoc) {
        try {
            versionService.saveGeometryFromVersion(versionDoc);
        } catch (Exception e) {
            log.error("Failed to save geometry from version: {}", e.getMessage(), e);
        }
    }

    /**
     * Synchronize a specific version to all peers.
     *
     * The /push endpoint now returns List<VersionDoc> containing:
     * [0] = the incoming version with its resolved status
     * [1..n] = any sibling versions that changed state on the peer
     *
     * We apply ALL returned docs to our local DB so our state stays consistent.
     */
    public void syncVersionToPeers(VersionDoc versionDoc) {
        if (!syncControlService.isSyncEnabled()) {
            log.info("Sync disabled. Queuing version {} for model {} as PENDING_SYNC.",
                    versionDoc.getVersionNumber(), versionDoc.getModelId());
            if (!"PENDING_SYNC".equals(versionDoc.getSyncStatus())) {
                versionDoc.setSyncStatus("PENDING_SYNC");
                versionRepository.save(versionDoc);
            }
            return;
        }

        if (peers == null || peers.isEmpty()) {
            log.warn("No peers registered for synchronization.");
            return;
        }

        for (String peer : peers) {
            try {
                String url = String.format("%s/api/sync/push", peer);
                log.info("Syncing version {} (model {}) → peer {}", versionDoc.getVersionNumber(),
                        versionDoc.getModelId(), peer);

                ResponseEntity<List<VersionDoc>> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        new org.springframework.http.HttpEntity<>(versionDoc),
                        new ParameterizedTypeReference<List<VersionDoc>>() {
                        });

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<VersionDoc> updatedDocs = response.getBody();
                    log.info("Peer {} returned {} updated doc(s) for version {}.", peer, updatedDocs.size(),
                            versionDoc.getVersionNumber());
                    // Apply every returned doc to our local DB.
                    // This includes our own version (with resolved status) AND
                    // any sibling versions that the peer branched as CONFLICT.
                    for (VersionDoc updated : updatedDocs) {
                        log.info("  Applying peer update: id={} versionName={} status={} branch={}",
                                updated.getId(), updated.getVersionName(), updated.getSyncStatus(),
                                updated.getBranchName());
                        versionRepository.save(updated);
                        saveGeometryFromVersion(updated);
                    }
                } else {
                    log.error("Peer {} returned non-2xx for push of version {}. Status: {}",
                            peer, versionDoc.getVersionNumber(), response.getStatusCode());
                    versionDoc.setSyncStatus("PENDING_SYNC");
                    versionRepository.save(versionDoc);
                }
            } catch (Exception e) {
                log.error("Error communicating with peer {} during sync of version {}: {}. Marking PENDING_SYNC.",
                        peer, versionDoc.getVersionNumber(), e.getMessage());
                versionDoc.setSyncStatus("PENDING_SYNC");
                versionRepository.save(versionDoc);
            }
        }
    }

    /**
     * Asynchronously synchronize a specific version to all peers.
     */
    public void syncVersionToPeersAsync(VersionDoc versionDoc) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                syncVersionToPeers(versionDoc);
            } catch (Exception e) {
                log.error("Asynchronous peer sync failed: {}", e.getMessage());
            }
        });
    }

    /**
     * Push latest local version for a model to a target remote peer node.
     */
    public void pushToRemote(String modelId, String targetNode) {
        if (!syncControlService.isSyncEnabled()) {
            log.info("Sync disabled. Skipping manual push of model {} to {}.", modelId, targetNode);
            return;
        }
        Optional<VersionDoc> latestOpt = versionRepository.findFirstByModelIdOrderByVersionNumberDesc(modelId);
        if (latestOpt.isEmpty()) {
            log.warn("No version found to push for model {}", modelId);
            return;
        }
        VersionDoc latest = latestOpt.get();
        String url = String.format("%s/api/sync/push", targetNode);
        try {
            log.info("Pushing version {} for model {} to {}", latest.getVersionNumber(), modelId, targetNode);
            ResponseEntity<List<VersionDoc>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new org.springframework.http.HttpEntity<>(latest),
                    new ParameterizedTypeReference<List<VersionDoc>>() {
                    });
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Pushed version {} to {}. Applying {} updates.", latest.getVersionNumber(), targetNode,
                        response.getBody().size());
                for (VersionDoc updated : response.getBody()) {
                    versionRepository.save(updated);
                    saveGeometryFromVersion(updated);
                }
            }
        } catch (Exception e) {
            log.error("Error pushing version to {}: {}", targetNode, e.getMessage());
        }
    }

    /**
     * Pull all versions from a peer that this node doesn't already have.
     * Called when sync is re-enabled to catch up on versions created by the peer
     * while this node was offline/sync-disabled.
     */
    public void pullFromPeers() {
        if (peers == null || peers.isEmpty()) {
            return;
        }

        // Collect all model IDs this node knows about
        List<VersionDoc> allLocal = versionRepository.findAll();
        // Group local version IDs by modelId so we can tell the peer what we already
        // have
        Map<String, List<String>> localIdsByModel = new HashMap<>();
        for (VersionDoc v : allLocal) {
            localIdsByModel.computeIfAbsent(v.getModelId(), k -> new ArrayList<>()).add(v.getId());
        }

        for (String peer : peers) {
            for (Map.Entry<String, List<String>> entry : localIdsByModel.entrySet()) {
                String modelId = entry.getKey();
                List<String> knownIds = entry.getValue();
                try {
                    String url = String.format("%s/api/sync/pull", peer);
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("modelId", modelId);
                    payload.put("knownIds", knownIds);

                    ResponseEntity<List<VersionDoc>> response = restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            new org.springframework.http.HttpEntity<>(payload),
                            new ParameterizedTypeReference<List<VersionDoc>>() {
                            });

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        List<VersionDoc> missing = response.getBody();
                        if (!missing.isEmpty()) {
                            log.info("Pulled {} missing version(s) for model {} from peer {}", missing.size(), modelId,
                                    peer);
                            for (VersionDoc pulled : missing) {
                                // Only save versions we don't already have
                                if (!versionRepository.existsById(pulled.getId())) {
                                    versionRepository.save(pulled);
                                    saveGeometryFromVersion(pulled);
                                    log.info("  Saved pulled version: {} ({})", pulled.getVersionName(),
                                            pulled.getSyncStatus());
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not pull from peer {} for model {}: {}", peer, modelId, e.getMessage());
                }
            }
        }
    }

    /**
     * Periodic retry task to sync all PENDING_SYNC versions.
     * Also pulls missing versions from peers on each cycle.
     * Runs every 10 seconds (fixedDelay so it won't overlap).
     */
    @Scheduled(fixedDelay = 10000)
    public void retryPendingSyncs() {
        if (!syncControlService.isSyncEnabled()) {
            return;
        }

        // Step 1: Pull versions from peers that we are missing
        pullFromPeers();

        // Step 2: Push our own PENDING_SYNC versions to peers
        List<VersionDoc> pendingVersions = versionRepository.findAll().stream()
                .filter(v -> "PENDING_SYNC".equals(v.getSyncStatus()))
                .collect(Collectors.toList());

        if (!pendingVersions.isEmpty()) {
            log.info("Retrying sync for {} PENDING_SYNC version(s).", pendingVersions.size());
            for (VersionDoc version : pendingVersions) {
                syncVersionToPeers(version);
            }
        }
    }
}
