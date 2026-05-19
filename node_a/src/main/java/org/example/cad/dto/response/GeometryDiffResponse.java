package org.example.cad.dto.response;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for geometry diff report.
 */
public class GeometryDiffResponse {
    public String objectId;
    public int fromVersion;
    public int toVersion;
    public String geometryName;
    public int oldVertexCount;
    public int newVertexCount;
    public int vertexAdditions;
    public int vertexModifications;
    public int vertexDeletions;
    public int oldFaceCount;
    public int newFaceCount;
    public int faceAdditions;
    public int faceDeletions;
    public List<Map<String, Object>> vertexChanges;
    public List<Map<String, Object>> faceChanges;

    public GeometryDiffResponse() {}

    public GeometryDiffResponse(String objectId, int fromVersion, int toVersion) {
        this.objectId = objectId;
        this.fromVersion = fromVersion;
        this.toVersion = toVersion;
    }
}

