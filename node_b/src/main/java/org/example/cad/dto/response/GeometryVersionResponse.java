package org.example.cad.dto.response;

import java.util.List;

/**
 * Response DTO for geometry version info.
 */
public class GeometryVersionResponse {
    public String objectId;
    public int versionNumber;
    public String name;
    public String format;
    public int vertexCount;
    public int faceCount;
    public String jsonRepresentation;

    public GeometryVersionResponse() {}

    public GeometryVersionResponse(String objectId, int versionNumber, String name, String format,
                                  int vertexCount, int faceCount, String jsonRepresentation) {
        this.objectId = objectId;
        this.versionNumber = versionNumber;
        this.name = name;
        this.format = format;
        this.vertexCount = vertexCount;
        this.faceCount = faceCount;
        this.jsonRepresentation = jsonRepresentation;
    }
}

