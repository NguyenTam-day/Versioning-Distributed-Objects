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

    public static VersionDoc createNew(
            String modelId,
            int versionNumber,
            String commitMessage,
            String geometryData,
            String author,
            String siteId,
            String branchName
    ) {
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
        return doc;
    }
}

