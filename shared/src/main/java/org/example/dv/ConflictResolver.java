package org.example.dv;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Resolves conflicts between versions produced from the same base.
 * BRANCH -> keeps both as separate branches
 * TIMESTAMP -> picks the one with the latest timestamp (last-writer-wins)
 */
public class ConflictResolver {

    public static List<Version> resolve(List<Version> conflicting, ConflictResolutionStrategy strategy) {
        if (conflicting == null || conflicting.isEmpty()) return List.of();
        if (strategy == ConflictResolutionStrategy.BRANCH) {
            // return copies that indicate distinct branch ids (keep as-is for demo)
            List<Version> result = new ArrayList<>();
            for (Version v : conflicting) {
                result.add(v);
            }
            return result;
        } else if (strategy == ConflictResolutionStrategy.TIMESTAMP) {
            Version winner = conflicting.stream().max(Comparator.comparingLong(Version::getTimestamp)).get();
            return List.of(winner);
        }
        return List.of();
    }
}

