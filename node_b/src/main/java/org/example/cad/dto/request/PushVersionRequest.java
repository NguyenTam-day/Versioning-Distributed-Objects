package org.example.cad.dto.request;

import org.example.cad.domain.model.VersionDoc;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PushVersionRequest {
    private String modelId;
    private String targetNode;
    private VersionDoc versionDoc;
}
