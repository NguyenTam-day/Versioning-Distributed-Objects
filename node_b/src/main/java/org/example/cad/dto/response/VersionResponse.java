package org.example.cad.dto.response;

import java.util.Date;

/**
 * Response DTO for version info.
 */
public class VersionResponse {
    public String id;
    public String modelId;
    public int versionNumber;
    public String branchName;
    public String commitMessage;
    public String author;
    public Date timestamp;
    public String geometryData;
    public String parentVersion;
    public boolean fullSnapshot;
    public String siteId;
    public String syncStatus;

    public VersionResponse() {
    }

    public VersionResponse(String modelId, int versionNumber, String branchName, String author, Date timestamp) {
        this.modelId = modelId;
        this.versionNumber = versionNumber;
        this.branchName = branchName;
        this.author = author;
        this.timestamp = timestamp;
    }

    public VersionResponse(String modelId, int versionNumber, String branchName, String author, Date timestamp,
            String parentVersion, boolean fullSnapshot) {
        this.modelId = modelId;
        this.versionNumber = versionNumber;
        this.branchName = branchName;
        this.author = author;
        this.timestamp = timestamp;
        this.parentVersion = parentVersion;
        this.fullSnapshot = fullSnapshot;
    }
}
