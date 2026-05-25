package org.example.cad.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConflictResponse {
    private String id;
    private String modelId;
    private String type; // e.g., "CONCURRENT_EDIT"
    private int versionA;
    private int versionB;
    private String status; // e.g., "Needs Resolution"
    private String conflictType; // e.g., "CONCURRENT_EDIT"
}
