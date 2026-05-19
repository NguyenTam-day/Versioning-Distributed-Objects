package org.example.cad.dto.response;

import java.util.Date;

/**
 * Response DTO for CAD model info.
 */
public class CadResponse {
    public String id;
    public String name;
    public String description;
    public int versionCount;
    public Date createdAt;
    public Date updatedAt;

    public CadResponse() {}

    public CadResponse(String id, String name, int versionCount, Date createdAt, Date updatedAt) {
        this.id = id;
        this.name = name;
        this.versionCount = versionCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
