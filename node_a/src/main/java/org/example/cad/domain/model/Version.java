package org.example.cad.domain.model;

public class Version {

    private int versionNumber;

    /**
     * Geometry data:
     * - full snapshot OR
     * - delta encoding
     */
    private String geometryData;

    private long timestamp;

    private String siteId;

    /**
     * Used for distributed conflict resolution (branching later)
     */
    private String parentVersion;

    /**
     * true = full snapshot
     * false = delta
     */
    private boolean fullSnapshot;

    public Version() {}

    public int getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(int versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getGeometryData() {
        return geometryData;
    }

    public void setGeometryData(String geometryData) {
        this.geometryData = geometryData;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getSiteId() {
        return siteId;
    }

    public void setSiteId(String siteId) {
        this.siteId = siteId;
    }

    public String getParentVersion() {
        return parentVersion;
    }

    public void setParentVersion(String parentVersion) {
        this.parentVersion = parentVersion;
    }

    public boolean isFullSnapshot() {
        return fullSnapshot;
    }

    public void setFullSnapshot(boolean fullSnapshot) {
        this.fullSnapshot = fullSnapshot;
    }
}