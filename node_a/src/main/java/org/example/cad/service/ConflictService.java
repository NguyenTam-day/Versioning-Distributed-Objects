package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * ConflictService xử lý phát hiện và giải quyết conflict
 * trong hệ thống distributed CAD versioning.
 *
 * <p>
 * Conflict xảy ra khi:
 *
 * <pre>
 * Hai version khác nhau được tạo từ cùng một parentVersion
 * </pre>
 *
 * Ví dụ:
 *
 * <pre>
 * v1_A
 * ├── v2_A
 * └── v2_B
 * </pre>
 *
 * => v2_A và v2_B đều sửa từ cùng base version v1_A
 * => concurrent modification
 * => conflict detected
 */
@Service
public class ConflictService {

    /**
     * Detect distributed branching conflict.
     *
     * <p>
     * Conflict được định nghĩa là:
     *
     * <pre>
     * multiple children sharing same parentVersion
     * </pre>
     *
     * Ví dụ:
     *
     * <pre>
     * Existing:
     *   v2_A.parent = v1_A
     *
     * Incoming:
     *   v2_B.parent = v1_A
     *
     * => CONFLICT
     * </pre>
     *
     * @param incoming         incoming version
     * @param existingVersions all existing versions of same model
     * @return true if conflict detected
     */
    public boolean detectConflict(
            VersionDoc incoming,
            List<VersionDoc> existingVersions) {

        if (incoming == null) {
            return false;
        }

        String incomingParent = incoming.getParentVersion();

        if (incomingParent == null || incomingParent.isEmpty()) {
            return false;
        }

        // Ignore already-conflicted branches
        if (incoming.getBranchName() != null
                && incoming.getBranchName().startsWith("conflict/")) {

            return false;
        }

        // Ignore same document during sync retry
        if (incoming.getId() != null) {

            for (VersionDoc v : existingVersions) {

                if (incoming.getId().equals(v.getId())) {
                    return false;
                }
            }
        }

        // Detect sibling conflict:
        // another ACTIVE (non-conflict-branch) version already exists with same parentVersion
        return existingVersions.stream()
                .anyMatch(v ->
                        incomingParent.equals(v.getParentVersion())
                                && !v.getId().equals(incoming.getId())
                                // Only count non-conflict siblings as real conflicts
                                && (v.getBranchName() == null
                                        || !v.getBranchName().startsWith("conflict/")));
    }

    /**
     * Find first conflicting sibling version.
     *
     * @param incoming         incoming version
     * @param existingVersions all versions
     * @return conflicting version if found
     */
    public Optional<VersionDoc> findConflictingVersion(
            VersionDoc incoming,
            List<VersionDoc> existingVersions) {

        if (incoming == null) {
            return Optional.empty();
        }

        String incomingParent = incoming.getParentVersion();

        if (incomingParent == null || incomingParent.isEmpty()) {
            return Optional.empty();
        }

        return existingVersions.stream()
                .filter(v ->
                        incomingParent.equals(v.getParentVersion())
                                && !v.getId().equals(incoming.getId())
                                // Skip siblings already resolved to a conflict branch
                                && (v.getBranchName() == null
                                        || !v.getBranchName().startsWith("conflict/")))
                .findFirst();
    }

    /**
     * Resolve conflict using branching strategy.
     *
     * <p>
     * Incoming version is preserved on separate branch.
     *
     * Example:
     *
     * <pre>
     * conflict/2_B
     * </pre>
     *
     * @param incoming   version with conflict
     * @param branchName target branch name
     * @return updated version
     */
    public VersionDoc resolveWithBranching(
            VersionDoc incoming,
            String branchName) {

        incoming.setBranchName(branchName);
        incoming.setSyncStatus("CONFLICT");

        return incoming;
    }

    /**
     * Build conflict branch name.
     *
     * Example:
     *
     * <pre>
     * versionNumber = 2
     * siteId = node-b
     *
     * => conflict/2_B
     * </pre>
     *
     * @param versionNumber version number
     * @param siteId        node site id
     * @return branch name
     */
    public String buildConflictBranchName(
            int versionNumber,
            String siteId) {

        return "conflict/" + versionNumber + "_" + VersionDoc.getSiteSuffix(siteId);
    }

    /**
     * Determine conflict winner using timestamp.
     * Older timestamp wins (First Writer Wins).
     */
    public VersionDoc determineWinner(VersionDoc incoming, VersionDoc existing) {
        if (incoming == null) return existing;
        if (existing == null) return incoming;

        Instant t1 = incoming.getTimestamp();
        Instant t2 = existing.getTimestamp();

        if (t1 == null) return existing;
        if (t2 == null) return incoming;

        if (t1.isBefore(t2)) {
            return incoming;
        } else if (t1.isAfter(t2)) {
            return existing;
        }

        // Tie-breaker: lexicographically lower siteId wins
        String site1 = incoming.getSiteId() != null ? incoming.getSiteId() : "";
        String site2 = existing.getSiteId() != null ? existing.getSiteId() : "";
        return site1.compareTo(site2) < 0 ? incoming : existing;
    }

    /**
     * Determine conflict loser (opposite of winner).
     */
    public VersionDoc determineLoser(VersionDoc incoming, VersionDoc existing) {
        VersionDoc winner = determineWinner(incoming, existing);
        if (winner == null) return null;
        return winner.getId().equals(incoming.getId()) ? existing : incoming;
    }
}