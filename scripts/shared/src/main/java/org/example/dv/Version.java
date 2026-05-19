package org.example.dv;

import java.util.Objects;

/**
 * Represents a version of a CAD model. Either a full snapshot or a delta.
 */
public class Version {
    private final String id;
    private final String parentId; // null for root
    private final long timestamp;
    private final String author;
    private final boolean snapshot;
    private final String snapshotContent; // present if snapshot==true
    private final Delta delta; // present if snapshot==false
    private final String branchId;

    public Version(String id, String parentId, long timestamp, String author, boolean snapshot, String snapshotContent, Delta delta, String branchId) {
        this.id = id;
        this.parentId = parentId;
        this.timestamp = timestamp;
        this.author = author;
        this.snapshot = snapshot;
        this.snapshotContent = snapshotContent;
        this.delta = delta;
        this.branchId = branchId;
    }

    public String getId() {
        return id;
    }

    public String getParentId() {
        return parentId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public String getAuthor() {
        return author;
    }

    public boolean isSnapshot() {
        return snapshot;
    }

    public String getSnapshotContent() {
        return snapshotContent;
    }

    public Delta getDelta() {
        return delta;
    }

    public String getBranchId() {
        return branchId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Version version = (Version) o;
        return Objects.equals(id, version.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

