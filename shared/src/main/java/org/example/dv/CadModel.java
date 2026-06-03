package org.example.dv;

import java.util.ArrayList;
import java.util.List;

/**
 * Simple in-memory CAD model for demo: holds partId and a history of versions.
 */
public class CadModel {
    private final String partId;
    private String latestGeometry;
    private final List<Version> versions = new ArrayList<>();

    public CadModel(String partId, String initialGeometry) {
        this.partId = partId;
        this.latestGeometry = initialGeometry;
    }

    public String getPartId() {
        return partId;
    }

    public String getLatestGeometry() {
        return latestGeometry;
    }

    public void setLatestGeometry(String latestGeometry) {
        this.latestGeometry = latestGeometry;
    }

    public List<Version> getVersions() {
        return versions;
    }

    public void addVersion(Version v) {
        versions.add(v);
        if (v.isSnapshot()) {
            this.latestGeometry = v.getSnapshotContent();
        } else if (v.getDelta() != null) {
            // apply delta to latestGeometry for demo purposes
            this.latestGeometry = DeltaUtil.applyDelta(latestGeometry, v.getDelta());
        }
    }
}

