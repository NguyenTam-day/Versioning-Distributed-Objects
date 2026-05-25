package org.example.cad.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

/**
 * Version document for MongoDB persistence
 * Stores individual version history entries
 */
@Document(collection = "versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VersionDoc {

    @Id
    private String id;

    private String modelId;
    private int versionNumber;
    private String commitMessage;
    private long timestamp;
    private String author;
    private String geometryData;
    private String branchName;
    private String siteId;
    private String syncStatus;
    private String parentVersion;
    private boolean fullSnapshot;

    public static VersionDoc createNew(
            String modelId,
            int versionNumber,
            String commitMessage,
            String geometryData,
            String author,
            String siteId,
            String branchName,
            String parentVersion,
            boolean fullSnapshot) {
        VersionDoc doc = new VersionDoc();
        doc.setId(UUID.randomUUID().toString());
        doc.setModelId(modelId);
        doc.setVersionNumber(versionNumber);
        doc.setCommitMessage(commitMessage);
        doc.setGeometryData(geometryData);
        doc.setTimestamp(System.currentTimeMillis());
        doc.setAuthor(author);
        doc.setSiteId(siteId);
        doc.setBranchName(branchName != null ? branchName : "main");
        doc.setSyncStatus("PENDING_SYNC");
        doc.setParentVersion(parentVersion);
        doc.setFullSnapshot(fullSnapshot);
        return doc;
    }

    public static VersionDoc createNew(
            String modelId,
            int versionNumber,
            String commitMessage,
            String geometryData,
            String author,
            String siteId,
            String branchName) {
        return createNew(modelId, versionNumber, commitMessage, geometryData, author, siteId, branchName, null, true);
    }
}