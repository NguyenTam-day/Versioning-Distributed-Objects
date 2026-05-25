package org.example.cad.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVersionRequest {
    private String modelId;
    private int baseVersion;
    private String commitMessage;
    private String geometryData;
    private String author;
    private String branchName;
    private String siteId;
    private String parentVersion;
    private boolean fullSnapshot;
}
