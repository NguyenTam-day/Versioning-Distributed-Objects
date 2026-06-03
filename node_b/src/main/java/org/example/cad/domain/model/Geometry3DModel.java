package org.example.cad.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import java.util.UUID;

/**
 * Geometry3D model for MongoDB persistence (Node B)
 * Stores 3D geometry versions with metadata
 */
@Document(collection = "geometries")
@CompoundIndexes({
        @CompoundIndex(name = "object_version_site_idx",
                def = "{'objectId':1,'version':1,'siteId':1}",
                unique = true),
        @CompoundIndex(name = "object_site_idx",
                def = "{'objectId':1,'siteId':1}"),
        @CompoundIndex(name = "timestamp_idx",
                def = "{'timestamp':1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Geometry3DModel {

    @Id
    private String id;

    private String objectId;
    private int version;
    private String name;
    private String format;
    private String vertices;      // JSON array of vertices
    private String faces;         // JSON array of faces
    private String geometryJson;  // Full JSON representation
    private String siteId;
    private long timestamp;

    public static Geometry3DModel createNew(
            String objectId,
            int version,
            String name,
            String format,
            String vertices,
            String faces,
            String geometryJson,
            String siteId
    ) {
        Geometry3DModel model = new Geometry3DModel();
        model.setId(UUID.randomUUID().toString());
        model.setObjectId(objectId);
        model.setVersion(version);
        model.setName(name);
        model.setFormat(format);
        model.setVertices(vertices);
        model.setFaces(faces);
        model.setGeometryJson(geometryJson);
        model.setSiteId(siteId);
        model.setTimestamp(System.currentTimeMillis());
        return model;
    }
}

