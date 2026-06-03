package org.example.cad.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

/**
 * Geometry3D MongoDB Model
 *
 * Stores:
 * - geometry versions
 * - distributed site info
 * - metadata
 * - serialized geometry JSON
 */
@Document(collection = "geometries")

@CompoundIndexes({

        /**
         * Prevent duplicate versions
         * for same object
         */
        @CompoundIndex(name = "object_version_site_idx",

                def = "{'objectId':1,'version':1,'siteId':1}",

                unique = true),

        /**
         * Faster distributed queries
         */
        @CompoundIndex(name = "object_site_idx",

                def = "{'objectId':1,'siteId':1}"),

        /**
         * Faster history queries
         */
        @CompoundIndex(name = "timestamp_idx",

                def = "{'timestamp':1}")
})

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Geometry3DModel {

    /**
     * Mongo document id
     */
    @Id
    private String id;

    /**
     * Shared CAD object id
     */
    private String objectId;

    /**
     * Version number
     */
    private int version;

    /**
     * Geometry/model name
     */
    private String name;

    /**
     * File format
     * obj/stl/step...
     */
    private String format;

    /**
     * Serialized vertices JSON
     */
    private String vertices;

    /**
     * Serialized faces JSON
     */
    private String faces;

    /**
     * Full geometry JSON
     */
    private String geometryJson;

    /**
     * Origin node/site
     * node-a / node-b
     */
    private String siteId;

    /**
     * Creation timestamp
     */
    private long timestamp;

    /**
     * Factory method
     */
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

        model.setId(
                UUID.randomUUID()
                        .toString());

        model.setObjectId(
                objectId);

        model.setVersion(
                version);

        model.setName(
                name);

        model.setFormat(
                format);

        model.setVertices(
                vertices);

        model.setFaces(
                faces);

        model.setGeometryJson(
                geometryJson);

        model.setSiteId(
                siteId);

        model.setTimestamp(
                System.currentTimeMillis());

        return model;
    }
}