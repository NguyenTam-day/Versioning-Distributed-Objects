package org.example.cad.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service to control the synchronization status of the node dynamically
 * and simulate network partitions.
 */
@Service
public class SyncControlService {

    private volatile boolean syncEnabled;

    public SyncControlService(@Value("${distributed.sync.enabled:true}") boolean syncEnabled) {
        this.syncEnabled = syncEnabled;
    }

    public void enableSync() {
        this.syncEnabled = true;
    }

    public void disableSync() {
        this.syncEnabled = false;
    }

    public boolean isSyncEnabled() {
        return this.syncEnabled;
    }
}
