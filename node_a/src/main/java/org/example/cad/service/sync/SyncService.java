package org.example.cad.service.sync;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.VersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;
import java.util.Optional;

@Service
@ConfigurationProperties(prefix = "node")
public class SyncService {
    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final VersionRepository versionRepository;
    private final RestTemplate restTemplate;

    private List<String> peers;

    public List<String> getPeers() {
        return peers;
    }

    public void setPeers(List<String> peers) {
        this.peers = peers;
    }

    public SyncService(VersionRepository versionRepository, RestTemplate restTemplate) {
        this.versionRepository = versionRepository;
        this.restTemplate = restTemplate;
    }

    /**
     * Synchronize a specific version to all peers.
     */
    public void syncVersionToPeers(VersionDoc versionDoc) {
        if (peers == null || peers.isEmpty()) {
            log.warn("No peers registered for synchronization.");
            return;
        }

        for (String peer : peers) {
            try {
                String url = String.format("%s/api/sync/push", peer);
                log.info("Attempting to sync version {} for model {} to peer {}", 
                        versionDoc.getVersionNumber(), versionDoc.getModelId(), peer);
                
                ResponseEntity<Void> response = restTemplate.postForEntity(url, versionDoc, Void.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Successfully synced version {} to peer {}", versionDoc.getVersionNumber(), peer);
                    versionDoc.setSyncStatus("SYNCED");
                    versionRepository.save(versionDoc);
                } else {
                    log.error("Failed to sync version {} to peer {}. Status code: {}", 
                            versionDoc.getVersionNumber(), peer, response.getStatusCode());
                    versionDoc.setSyncStatus("PENDING_SYNC");
                    versionRepository.save(versionDoc);
                }
            } catch (Exception e) {
                log.error("Error communicating with peer {} during sync: {}. Marking status as PENDING_SYNC.", 
                        peer, e.getMessage());
                versionDoc.setSyncStatus("PENDING_SYNC");
                versionRepository.save(versionDoc);
            }
        }
    }

    /**
     * Push latest local version for a model to a target remote peer node.
     */
    public void pushToRemote(String modelId, String targetNode) {
        Optional<VersionDoc> latestOpt = versionRepository.findFirstByModelIdOrderByVersionNumberDesc(modelId);
        if (latestOpt.isEmpty()) {
            log.warn("No version found to push for model {}", modelId);
            return;
        }
        VersionDoc latest = latestOpt.get();
        String url = String.format("%s/api/sync/push", targetNode);
        try {
            log.info("Pushing version {} for model {} to {}", latest.getVersionNumber(), modelId, targetNode);
            ResponseEntity<Void> response = restTemplate.postForEntity(url, latest, Void.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully pushed version to {}", targetNode);
                latest.setSyncStatus("SYNCED");
                versionRepository.save(latest);
            }
        } catch (Exception e) {
            log.error("Error pushing version to {}: {}", targetNode, e.getMessage());
        }
    }

    /**
     * Periodic retry task to sync all PENDING_SYNC versions.
     * Runs every 10 seconds.
     */
    @Scheduled(fixedDelay = 10000)
    public void retryPendingSyncs() {
        List<VersionDoc> pendingVersions = versionRepository.findAll().stream()
                .filter(v -> "PENDING_SYNC".equals(v.getSyncStatus()))
                .toList();

        if (!pendingVersions.isEmpty()) {
            log.info("Found {} pending versions for sync retry.", pendingVersions.size());
            for (VersionDoc version : pendingVersions) {
                syncVersionToPeers(version);
            }
        }
    }
}
