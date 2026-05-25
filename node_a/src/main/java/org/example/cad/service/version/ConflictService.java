package org.example.cad.service.version;

import org.example.cad.domain.model.VersionDoc;
import org.example.dv.ConflictResolutionStrategy;
import org.springframework.stereotype.Service;

@Service
public class ConflictService {

    /**
     * Detects conflict using parentVersion.
     * Conflict is detected if:
     * - The incoming version has a parent version
     * - And that parent version does NOT match the version number of the current head version
     */
    public boolean detectConflict(VersionDoc incoming, VersionDoc currentHead) {
        if (incoming == null || currentHead == null) {
            return false;
        }
        
        String incomingParent = incoming.getParentVersion();
        if (incomingParent == null || incomingParent.isEmpty()) {
            return false;
        }
        
        String currentHeadVersionStr = String.valueOf(currentHead.getVersionNumber());
        return !incomingParent.equals(currentHeadVersionStr);
    }
    
    /**
     * Resolves conflict between incoming version and current head using branching strategy
     */
    public VersionDoc resolveWithBranching(VersionDoc incoming, String alternativeBranchName) {
        incoming.setBranchName(alternativeBranchName != null ? alternativeBranchName : "feature/conflict-" + incoming.getSiteId());
        return incoming;
    }
}
